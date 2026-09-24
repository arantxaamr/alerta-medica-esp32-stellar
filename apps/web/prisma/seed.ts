import { PrismaClient, Role } from "@prisma/client";
import { randomBytes } from "crypto";

const prisma = new PrismaClient();

async function main() {
  const demoEmail = "ana.demo@pulso.local";
  const familyEmail = "familiar.demo@pulso.local";

  await prisma.notification.deleteMany();
  await prisma.chainAnchor.deleteMany();
  await prisma.incidentEvent.deleteMany();
  await prisma.incident.deleteMany();
  await prisma.deviceEvent.deleteMany();
  await prisma.device.deleteMany();
  await prisma.contactRequest.deleteMany();
  await prisma.dailyCheckin.deleteMany();
  await prisma.contact.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.user.deleteMany({
    where: { email: { in: [demoEmail, familyEmail] } },
  });

  const user = await prisma.user.create({
    data: {
      email: demoEmail,
      role: Role.USER,
      pollarSubject: "demo-pollar-ana",
      profile: {
        create: {
          displayName: "Ana (demo)",
          phone: "+52 55 0000 0000",
          addressEncrypted: "BASE64_DEMO_ADDRESS",
          consentVersion: "pilot-v0",
          isDemoIdentity: true,
        },
      },
      contacts: {
        create: {
          name: "Familiar demo",
          email: familyEmail,
          relationship: "hija",
          isPrimary: true,
          verifiedAt: new Date(),
          permissions: "ack,view_incident,view_checkin_summary",
        },
      },
      devices: {
        create: {
          publicId: "esp32-demo-001",
          secretRef: "env:DEVICE_EVENT_HMAC_SECRET",
          status: "ACTIVE",
          lastSeenAt: new Date(),
        },
      },
    },
    include: { contacts: true, devices: true },
  });

  await prisma.user.create({
    data: {
      email: familyEmail,
      role: Role.FAMILY,
      pollarSubject: "demo-pollar-familiar",
      profile: {
        create: {
          displayName: "Familiar (demo)",
          consentVersion: "pilot-v0",
          isDemoIdentity: true,
        },
      },
    },
  });

  const caseKey = randomBytes(32).toString("hex");
  await prisma.incident.create({
    data: {
      userId: user.id,
      deviceId: user.devices[0]?.id,
      status: "created",
      caseKey,
      isSimulation: true,
      addressSnapshotEncrypted: "BASE64_DEMO_ADDRESS",
      events: {
        create: {
          seq: 1,
          type: "OPENED",
          metadataPrivate: JSON.stringify({ note: "seed incident" }),
        },
      },
    },
  });

  console.log("Seed OK:", {
    user: user.email,
    device: user.devices[0]?.publicId,
    contact: user.contacts[0]?.email,
    caseKey,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
