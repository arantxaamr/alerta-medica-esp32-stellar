import { timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const ADMIN_EMAIL = "cruzcervantesdanieladrianelias@gmail.com";

function safeEqual(a: string, b: string): boolean {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return timingSafeEqual(aBuf, bBuf);
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    email?: string;
    password?: string;
  };

  const email = body.email?.trim().toLowerCase() || "";
  const password = body.password || "";
  const expectedPassword = process.env.ADMIN_PASSWORD || "12341234";

  const emailOk = safeEqual(email, ADMIN_EMAIL);
  const passwordOk = safeEqual(password, expectedPassword);

  if (!emailOk || !passwordOk) {
    return NextResponse.json(
      { error: "Correo o contraseña incorrectos" },
      { status: 401 },
    );
  }

  const user = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    create: {
      email: ADMIN_EMAIL,
      role: "ADMIN",
      pollarSubject: `admin-local-${ADMIN_EMAIL}`,
      profile: {
        create: {
          displayName: "Admin Pulso",
          consentVersion: "pilot-v0",
          isDemoIdentity: false,
          kycStatus: "completed",
        },
      },
    },
    update: {
      role: "ADMIN",
    },
    include: { profile: true },
  });

  const session = await getSession();
  session.isLoggedIn = true;
  session.userId = user.id;
  session.email = user.email;
  session.role = "ADMIN";
  session.pollarSubject = user.pollarSubject;
  session.displayName = user.profile?.displayName || "Admin Pulso";
  await session.save();

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      role: "ADMIN",
      displayName: session.displayName,
    },
  });
}
