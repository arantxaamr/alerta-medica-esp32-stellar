import { NextResponse } from "next/server";
import { adminEmails, hashesEqual, randomToken, secretHash, SESSION_COOKIE, sha256 } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (typeof body.attemptId !== "string" || typeof body.code !== "string" || !/^\d{6}$/.test(body.code)) {
      return Response.json({ error: "Escribe el código de seis dígitos." }, { status: 400 });
    }
    const attempt = await prisma.authAttempt.findUnique({ where: { id: body.attemptId } });
    if (!attempt || !attempt.proofVerifiedAt || !attempt.codeHash || !attempt.codeExpiresAt || attempt.codeExpiresAt <= new Date() || attempt.consumedAt || attempt.attempts >= 5) {
      return Response.json({ error: "El código venció. Inicia de nuevo." }, { status: 400 });
    }
    if (!hashesEqual(attempt.codeHash, secretHash(`${attempt.id}:${body.code}`))) {
      await prisma.authAttempt.update({ where: { id: attempt.id }, data: { attempts: { increment: 1 } } });
      return Response.json({ error: "Código incorrecto." }, { status: 401 });
    }
    const token = randomToken();
    const result = await prisma.$transaction(async (tx) => {
      const claimed = await tx.authAttempt.updateMany({ where: { id: attempt.id, consumedAt: null, attempts: { lt: 5 } }, data: { consumedAt: new Date() } });
      if (claimed.count !== 1) throw new Error("ALREADY_USED");
      const [byEmail, byWallet, invited] = await Promise.all([
        tx.user.findUnique({ where: { email: attempt.email }, include: { profile: true } }),
        tx.user.findUnique({ where: { pollarSubject: attempt.walletAddress }, include: { profile: true } }),
        tx.contact.count({ where: { email: attempt.email } }),
      ]);
      if ((byEmail && byEmail.pollarSubject && byEmail.pollarSubject !== attempt.walletAddress) || (byWallet && byWallet.email !== attempt.email)) throw new Error("ACCOUNT_CONFLICT");
      const role = adminEmails().has(attempt.email) ? "ADMIN" : invited > 0 ? "FAMILY" : "USER";
      const user = byEmail || byWallet || await tx.user.create({ data: { email: attempt.email, pollarSubject: attempt.walletAddress, role } });
      if (!user.pollarSubject || user.role !== role) await tx.user.update({ where: { id: user.id }, data: { pollarSubject: attempt.walletAddress, role } });
      await tx.appSession.create({ data: { userId: user.id, tokenHash: sha256(token), expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60_000) } });
      return { onboarding: !(byEmail || byWallet)?.profile?.consentAcceptedAt };
    });
    const response = NextResponse.json({ next: result.onboarding ? "/bienvenida" : "/panel" });
    response.cookies.set(SESSION_COOKIE, token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 7 * 24 * 60 * 60 });
    return response;
  } catch (error) {
    if (error instanceof Error && error.message === "ACCOUNT_CONFLICT") return Response.json({ error: "Este correo o cartera ya pertenece a otra cuenta. Contacta al equipo de Pulso." }, { status: 409 });
    return Response.json({ error: "No fue posible completar el acceso." }, { status: 500 });
  }
}
