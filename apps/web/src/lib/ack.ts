import { prisma } from "@/lib/prisma";
import { serializeIncident } from "@/lib/incidents";

export async function acknowledgeIncident(incidentId: string, actorLabel?: string) {
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
      },
    });
    return { incident: serializeIncident(full), alreadyAcked: true };
  }

  const nextSeq = (incident.events[0]?.seq ?? 0) + 1;
  const now = new Date();

  await prisma.$transaction(async (tx) => {
    await tx.incident.update({
      where: { id: incidentId },
      data: { status: "family_acknowledged" },
    });
    await tx.incidentEvent.create({
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
  });

  const full = await prisma.incident.findUniqueOrThrow({
    where: { id: incidentId },
    include: {
      events: { orderBy: { seq: "asc" } },
      notifications: { include: { contact: true } },
    },
  });
  return { incident: serializeIncident(full), alreadyAcked: false };
}
