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

/**
 * Pollar solo asigna USER/FAMILY. ADMIN entra solo por /api/auth/admin.
 */
export function resolveRoleForEmail(email: string, existing?: Role | null): Role {
  if (existing === "FAMILY") return "FAMILY";
  const lower = email.toLowerCase();
  if (parseEmailList("FAMILY_EMAILS").has(lower)) return "FAMILY";
  return "USER";
}

export async function upsertPulsoUser(input: {
  email: string;
  pollarSubject: string;
  displayName: string;
}) {
  const email = input.email.trim().toLowerCase();
  const existing = await prisma.user.findFirst({
    where: {
      OR: [{ email }, { pollarSubject: input.pollarSubject }],
    },
    include: { profile: true },
  });

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
