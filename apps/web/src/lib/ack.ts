import { prisma } from "@/lib/prisma";
import { serializeIncident } from "@/lib/incidents";
import { queueAndTryAnchor } from "@/lib/stellar";

function fireAnchor(
  promise: ReturnType<typeof queueAndTryAnchor>,
  label: string,
) {
  void promise.catch((error) => {
    console.error(`stellar anchor ${label} failed (non-blocking)`, error);
  });
}

export async function acknowledgeIncident(
  incidentId: string,
  actorLabel?: string,
) {
  const incident = await prisma.incident.findUnique({
    where: { id: incidentId },
    include: {
      events: { orderBy: { seq: "desc" }, take: 1 },
      notifications: true,
    },
  });
  if (!incident) return null;

  if (
    incident.status === "resolved" ||
    incident.status === "false_alarm" ||
    incident.status === "family_acknowledged" ||
    incident.status === "contacting"
  ) {
    const full = await prisma.incident.findUniqueOrThrow({
      where: { id: incidentId },
      include: {
        events: { orderBy: { seq: "asc" } },
        notifications: { include: { contact: true } },
        chainAnchors: { orderBy: { createdAt: "asc" } },
      },
    });
    return { incident: serializeIncident(full), alreadyAcked: true };
  }

  const nextSeq = (incident.events[0]?.seq ?? 0) + 1;
  const now = new Date();

  const ackEvent = await prisma.$transaction(async (tx) => {
    await tx.incident.update({
      where: { id: incidentId },
      data: { status: "family_acknowledged" },
    });
    const event = await tx.incidentEvent.create({
      data: {
        incidentId,
        seq: nextSeq,
        type: "FAMILY_ACK",
        serverReceivedAtUtc: now,
        metadataPrivate: JSON.stringify({
          actorLabel: actorLabel || "familiar",
        }),
      },
    });
    await tx.notification.updateMany({
      where: { incidentId, status: { in: ["queued", "sent"] } },
      data: { status: "acknowledged" },
    });
    await tx.auditLog.create({
      data: {
        action: "incident.family_ack",
        objectType: "incident",
        objectId: incidentId,
      },
    });
    return event;
  });

  fireAnchor(
    queueAndTryAnchor({
      incidentId,
      incidentEventId: ackEvent.id,
      caseKey: incident.caseKey,
      seq: nextSeq,
      eventCode: "FAMILY_ACK",
      serverReceivedAtUtc: now,
      canonicalRecord: JSON.stringify({
        incidentId,
        type: "FAMILY_ACK",
        actorLabel: actorLabel || "familiar",
      }),
    }),
    "FAMILY_ACK",
  );

  const full = await prisma.incident.findUniqueOrThrow({
    where: { id: incidentId },
    include: {
      events: { orderBy: { seq: "asc" } },
      notifications: { include: { contact: true } },
      chainAnchors: { orderBy: { createdAt: "asc" } },
    },
  });
  return { incident: serializeIncident(full), alreadyAcked: false };
}

export async function closeIncident(
  incidentId: string,
  kind: "CLOSED" | "FALSE_ALARM",
  actorLabel?: string,
) {
  const incident = await prisma.incident.findUnique({
    where: { id: incidentId },
    include: {
      events: { orderBy: { seq: "desc" }, take: 1 },
    },
  });
  if (!incident) return null;

  if (incident.status === "resolved" || incident.status === "false_alarm") {
    const full = await prisma.incident.findUniqueOrThrow({
      where: { id: incidentId },
      include: {
        events: { orderBy: { seq: "asc" } },
        notifications: { include: { contact: true } },
        chainAnchors: { orderBy: { createdAt: "asc" } },
      },
    });
    return { incident: serializeIncident(full), alreadyClosed: true };
  }

  const nextSeq = (incident.events[0]?.seq ?? 0) + 1;
  const now = new Date();
  const status = kind === "FALSE_ALARM" ? "false_alarm" : "resolved";
  const eventType = kind;

  const closeEvent = await prisma.$transaction(async (tx) => {
    await tx.incident.update({
      where: { id: incidentId },
      data: {
        status,
        closedAtUtc: now,
      },
    });
    const event = await tx.incidentEvent.create({
      data: {
        incidentId,
        seq: nextSeq,
        type: eventType,
        serverReceivedAtUtc: now,
        metadataPrivate: JSON.stringify({
          actorLabel: actorLabel || "familiar",
        }),
      },
    });
    await tx.auditLog.create({
      data: {
        action:
          kind === "FALSE_ALARM"
            ? "incident.false_alarm"
            : "incident.closed",
        objectType: "incident",
        objectId: incidentId,
      },
    });
    return event;
  });

  fireAnchor(
    queueAndTryAnchor({
      incidentId,
      incidentEventId: closeEvent.id,
      caseKey: incident.caseKey,
      seq: nextSeq,
      eventCode: kind,
      serverReceivedAtUtc: now,
      canonicalRecord: JSON.stringify({
        incidentId,
        type: kind,
        actorLabel: actorLabel || "familiar",
      }),
    }),
    kind,
  );

  const full = await prisma.incident.findUniqueOrThrow({
    where: { id: incidentId },
    include: {
      events: { orderBy: { seq: "asc" } },
      notifications: { include: { contact: true } },
      chainAnchors: { orderBy: { createdAt: "asc" } },
    },
  });
  return { incident: serializeIncident(full), alreadyClosed: false };
}
