import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { upsertPulsoUser } from "@/lib/users";
import { prisma } from "@/lib/prisma";
import { hashesEqual, secretHash } from "@/lib/pollar-proof";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { attemptId?: string; code?: string; displayName?: string };
    if (typeof body.attemptId !== "string" || typeof body.code !== "string" || !/^\d{6}$/.test(body.code)) {
      return NextResponse.json({ error: "Escribe el código de seguridad de seis dígitos." }, { status: 400 });
    }
    const attempt = await prisma.authAttempt.findUnique({ where: { id: body.attemptId } });
    if (!attempt || !attempt.proofVerifiedAt || !attempt.codeHash || !attempt.codeExpiresAt || attempt.codeExpiresAt <= new Date() || attempt.consumedAt || attempt.attempts >= 5) {
      return NextResponse.json({ error: "El código venció. Inicia de nuevo." }, { status: 400 });
    }
    if (!hashesEqual(attempt.codeHash, secretHash(`${attempt.id}:${body.code}`))) {
      await prisma.authAttempt.update({ where: { id: attempt.id }, data: { attempts: { increment: 1 } } });
      return NextResponse.json({ error: "Código incorrecto." }, { status: 401 });
    }
    const claimed = await prisma.authAttempt.updateMany({ where: { id: attempt.id, consumedAt: null, attempts: { lt: 5 } }, data: { consumedAt: new Date() } });
    if (claimed.count !== 1) return NextResponse.json({ error: "El código ya fue utilizado." }, { status: 409 });

    const user = await upsertPulsoUser({
      email: attempt.email,
      pollarSubject: attempt.walletAddress,
      displayName: body.displayName?.trim() || attempt.email.split("@")[0],
    });
    const session = await getSession();
    session.isLoggedIn = true;
    session.userId = user.id;
    session.email = user.email;
    session.role = user.role;
    session.pollarSubject = user.pollarSubject;
    session.displayName = user.profile?.displayName || user.email;
    await session.save();
    return NextResponse.json({ user: { id: user.id, email: user.email, role: user.role, displayName: user.profile?.displayName } });
  } catch (error) {
    console.error("POST /api/auth/sync", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Error de sesión" }, { status: 500 });
  }
}
