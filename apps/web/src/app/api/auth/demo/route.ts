import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { upsertPulsoUser } from "@/lib/users";
import type { Role } from "@prisma/client";

export const dynamic = "force-dynamic";

/** Login de simulacro cuando aún no hay claves Pollar. */
export async function POST(request: Request) {
  if (process.env.PULSO_MODE === "production") {
    return NextResponse.json({ error: "Demo login deshabilitado" }, { status: 403 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    role?: Role;
    email?: string;
  };

  const role = body.role || "USER";
  const email =
    body.email?.trim().toLowerCase() ||
    (role === "ADMIN"
      ? "admin.demo@pulso.local"
      : role === "FAMILY"
        ? "familiar.demo@pulso.local"
        : "ana.demo@pulso.local");

  const user = await upsertPulsoUser({
    email,
    pollarSubject: `demo-${role.toLowerCase()}-${email}`,
    displayName:
      role === "ADMIN"
        ? "Admin (demo)"
        : role === "FAMILY"
          ? "Familiar (demo)"
          : "Ana (demo)",
  });

  // Force role for demo picker even if email mapping differs
  if (user.role !== role) {
    await (await import("@/lib/prisma")).prisma.user.update({
      where: { id: user.id },
      data: { role },
    });
  }

  const session = await getSession();
  session.isLoggedIn = true;
  session.userId = user.id;
  session.email = email;
  session.role = role;
  session.pollarSubject = user.pollarSubject;
  session.displayName =
    role === "ADMIN"
      ? "Admin (demo)"
      : role === "FAMILY"
        ? "Familiar (demo)"
        : "Ana (demo)";
  await session.save();

  return NextResponse.json({
    user: {
      id: user.id,
      email,
      role,
      displayName: session.displayName,
    },
  });
}
