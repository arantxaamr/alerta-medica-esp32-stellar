import { prisma } from "@/lib/prisma";
import type { Role } from "@prisma/client";

function parseEmailList(envName: string): Set<string> {
  return new Set(
    (process.env[envName] || "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function resolveRoleForEmail(email: string, existing?: Role | null): Role {
  if (existing === "ADMIN") return "ADMIN";
  if (existing === "FAMILY") return "FAMILY";
  const lower = email.toLowerCase();
  if (parseEmailList("ADMIN_EMAILS").has(lower)) return "ADMIN";
  if (parseEmailList("FAMILY_EMAILS").has(lower)) return "FAMILY";
  return "USER";
}

export async function upsertPulsoUser(input: {
  email: string;
  pollarSubject: string;
  displayName: string;
}) {
  const email = input.email.trim().toLowerCase();
  const [byEmail, bySubject] = await Promise.all([
    prisma.user.findUnique({ where: { email }, include: { profile: true } }),
    prisma.user.findUnique({ where: { pollarSubject: input.pollarSubject }, include: { profile: true } }),
  ]);
  if ((byEmail?.pollarSubject && byEmail.pollarSubject !== input.pollarSubject) || (bySubject && bySubject.email !== email)) {
    throw new Error("Este correo o cartera ya pertenece a otra cuenta. Contacta al equipo de Pulso.");
  }
  const existing = byEmail || bySubject;

  const role = resolveRoleForEmail(email, existing?.role);

  if (existing) {
    const user = await prisma.user.update({
      where: { id: existing.id },
      data: {
        email,
        pollarSubject: input.pollarSubject,
        role,
        profile: {
          upsert: {
            create: {
              displayName: input.displayName || email.split("@")[0],
              consentVersion: "pilot-v0",
              isDemoIdentity: process.env.PULSO_MODE !== "production",
            },
            update: {
              displayName:
                input.displayName ||
                existing.profile?.displayName ||
                email.split("@")[0],
            },
          },
        },
      },
      include: { profile: true },
    });
    return user;
  }

  return prisma.user.create({
    data: {
      email,
      pollarSubject: input.pollarSubject,
      role,
      profile: {
        create: {
          displayName: input.displayName || email.split("@")[0],
          consentVersion: "pilot-v0",
          isDemoIdentity: process.env.PULSO_MODE !== "production",
        },
      },
    },
    include: { profile: true },
  });
}
