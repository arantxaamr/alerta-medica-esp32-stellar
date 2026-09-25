import { randomBytes, createHash } from "crypto";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { dispatchQueuedNotifications } from "@/lib/email";
import { requireSession } from "@/lib/session";
import { queueAndTryAnchor } from "@/lib/stellar";
import type { IncidentStatus } from "@prisma/client";

const DEMO_USER_EMAIL = process.env.DEMO_USER_EMAIL ?? "ana.demo@pulso.local";
const OPEN_STATUSES: IncidentStatus[] = [
  "created",
  "family_acknowledged",
  "contacting",
];

function obfuscateIp(ip: string | null): string | null {
  if (!ip) return null;
  return createHash("sha256").update(`pulso-ip:${ip}`).digest("hex");
}

export async function resolveClientIp(): Promise<string | null> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || null;
  return h.get("x-real-ip");
}

export async function getActingUser() {
  const session = await requireSession(["USER", "ADMIN"]);
  if (session) {
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: {
        profile: true,
        contacts: {
          where: {
            verifiedAt: { not: null },
            kycStatus: "completed",
          },
        },
        devices: { where: { status: "ACTIVE" }, take: 1 },
      },
    });
    if (user) return user;
  }

  const user = await prisma.user.findUnique({
    where: { email: DEMO_USER_EMAIL },
    include: {
      profile: true,
      contacts: {
        where: {
          verifiedAt: { not: null },
          kycStatus: "completed",
        },
      },
      devices: { where: { status: "ACTIVE" }, take: 1 },
    },
  });
  if (!user) {
    throw new Error(`Demo user not found: ${DEMO_USER_EMAIL}. Run seed.`);
  }
  return user;
}

/** @deprecated use getActingUser */
export async function getDemoUser() {
  return getActingUser();
}

export async function createWebHelpIncident(opts?: {
  forceNew?: boolean;
}) {
  const user = await getActingUser();
  const ip = await resolveClientIp();
  const serverReceivedAtUtc = new Date();

  // Only verified contacts with completed family KYC get alert emails
  const alertContacts = user.contacts.filter(
    (c) => c.verifiedAt && c.kycStatus === "completed",
  );

  if (!opts?.forceNew) {
    const existing = await prisma.incident.findFirst({
      where: {
        userId: user.id,
        status: { in: OPEN_STATUSES },
      },
      orderBy: { openedAtUtc: "desc" },
      include: {
        events: { orderBy: { seq: "asc" } },
        notifications: { include: { contact: true } },
      },
    });
    if (existing) {
      if (existing.notifications.length === 0 && alertContacts.length > 0) {
        const now = new Date();
        await prisma.notification.createMany({
          data: alertContacts.map((c) => ({
            incidentId: existing.id,
            contactId: c.id,
            channel: "email",
            status: "queued",
            attempts: 0,
            updatedAt: now,
          })),
        });
        const refreshed = await prisma.incident.findUniqueOrThrow({
          where: { id: existing.id },
          include: {
            events: { orderBy: { seq: "asc" } },
            notifications: { include: { contact: true } },
          },
        });
        await dispatchQueuedNotifications(refreshed.id);
        const afterMail = await prisma.incident.findUniqueOrThrow({
          where: { id: refreshed.id },
          include: {
            events: { orderBy: { seq: "asc" } },
            notifications: { include: { contact: true } },
          },
        });
        return { incident: afterMail, reused: true as const };
      }

      const queued = existing.notifications.filter((n) => n.status === "queued");
      if (queued.length > 0) {
        await dispatchQueuedNotifications(existing.id);
        const afterMail = await prisma.incident.findUniqueOrThrow({
          where: { id: existing.id },
          include: {
            events: { orderBy: { seq: "asc" } },
            notifications: { include: { contact: true } },
          },
        });
        return { incident: afterMail, reused: true as const };
      }

      return { incident: existing, reused: true as const };
    }
  }

  const caseKey = randomBytes(32).toString("hex");
  const eventId = `web_${randomBytes(16).toString("hex")}`;

  const incident = await prisma.$transaction(async (tx) => {
    const created = await tx.incident.create({
      data: {
        userId: user.id,
        deviceId: user.devices[0]?.id,
        status: "created",
        caseKey,
        isSimulation: process.env.PULSO_MODE !== "production",
        addressSnapshotEncrypted: user.profile?.addressEncrypted ?? null,
        openedAtUtc: serverReceivedAtUtc,
        events: {
          create: {
            seq: 1,
            type: "OPENED",
            actorId: user.id,
            serverReceivedAtUtc,
            metadataPrivate: JSON.stringify({
              sourceChannel: "web",
              eventId,
            }),
          },
        },
      },
      include: {
        events: true,
        notifications: true,
      },
    });

    if (user.devices[0]) {
      await tx.deviceEvent.create({
        data: {
          deviceId: user.devices[0].id,
          eventId,
          counter: BigInt(Date.now()),
          serverReceivedAtUtc,
          sourceIpEncrypted: obfuscateIp(ip),
          sourceChannel: "web",
        },
      });
      await tx.device.update({
        where: { id: user.devices[0].id },
        data: { lastSeenAt: serverReceivedAtUtc },
      });
    }

    if (alertContacts.length > 0) {
      await tx.notification.createMany({
        data: alertContacts.map((c) => ({
          incidentId: created.id,
          contactId: c.id,
          channel: "email",
          status: "queued",
          attempts: 0,
          updatedAt: serverReceivedAtUtc,
        })),
      });
    }

    await tx.auditLog.create({
      data: {
        actorId: user.id,
        action: "incident.open.web",
        objectType: "incident",
        objectId: created.id,
      },
    });

    return tx.incident.findUniqueOrThrow({
      where: { id: created.id },
      include: {
        events: { orderBy: { seq: "asc" } },
        notifications: { include: { contact: true } },
      },
    });
  });

  await dispatchQueuedNotifications(incident.id);

  const opened = incident.events.find((e) => e.seq === 1);
  if (opened) {
    try {
      await queueAndTryAnchor({
        incidentId: incident.id,
        incidentEventId: opened.id,
        caseKey: incident.caseKey,
        seq: 1,
        eventCode: "OPENED",
        serverReceivedAtUtc: opened.serverReceivedAtUtc,
        canonicalRecord: JSON.stringify({
          incidentId: incident.id,
          source: "web",
          userId: incident.userId,
        }),
      });
    } catch (error) {
      console.error("stellar anchor failed (non-blocking)", error);
    }
  }

  const withMail = await prisma.incident.findUniqueOrThrow({
    where: { id: incident.id },
    include: {
      events: { orderBy: { seq: "asc" } },
      notifications: { include: { contact: true } },
    },
  });

  return { incident: withMail, reused: false as const };
}

export function serializeIncident(
  incident: Awaited<ReturnType<typeof createWebHelpIncident>>["incident"],
) {
  const notifications = incident.notifications ?? [];
  const anySent = notifications.some((n) => n.status === "sent");
  const anyAck = notifications.some((n) => n.status === "acknowledged");
  const anyFailed = notifications.some((n) => n.status === "failed");
  const familyStep =
    incident.status === "family_acknowledged" ||
    incident.status === "contacting" ||
    incident.status === "resolved" ||
    anyAck
      ? "done"
      : anySent
        ? "sent"
        : anyFailed && notifications.every((n) => n.status === "failed")
          ? "failed"
          : "queued";

  return {
    id: incident.id,
    status: incident.status,
    isSimulation: incident.isSimulation,
    openedAtUtc: incident.openedAtUtc.toISOString(),
    closedAtUtc: incident.closedAtUtc?.toISOString() ?? null,
    caseKeyPrefix: incident.caseKey.slice(0, 8),
    events: incident.events.map((e) => ({
      seq: e.seq,
      type: e.type,
      at: e.serverReceivedAtUtc.toISOString(),
    })),
    notifications: notifications.map((n) => ({
      id: n.id,
      status: n.status,
      channel: n.channel,
      contactName: "contact" in n && n.contact ? n.contact.name : undefined,
    })),
    ui: {
      systemReceived: true,
      familyNotify: familyStep,
      familyAck:
        incident.status === "family_acknowledged" ||
        incident.status === "contacting" ||
        incident.status === "resolved" ||
        anyAck,
    },
  };
}
