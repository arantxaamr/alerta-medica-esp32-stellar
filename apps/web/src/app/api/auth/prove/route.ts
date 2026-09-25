import { randomInt } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { secretHash, verifySep53 } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (typeof body.attemptId !== "string" || typeof body.signature !== "string" || typeof body.signerAddress !== "string") {
      return Response.json({ error: "Prueba inválida." }, { status: 400 });
    }
    const attempt = await prisma.authAttempt.findUnique({ where: { id: body.attemptId } });
    if (!attempt || attempt.consumedAt || attempt.expiresAt <= new Date() || attempt.proofVerifiedAt) {
      return Response.json({ error: "El intento venció. Vuelve a iniciar." }, { status: 400 });
    }
    if (attempt.walletAddress !== body.signerAddress || !verifySep53(attempt.challenge, body.signature, body.signerAddress)) {
      return Response.json({ error: "No se pudo comprobar la sesión de Pollar." }, { status: 401 });
    }
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.RESEND_FROM_EMAIL;
    if (!apiKey || !from) return Response.json({ error: "El correo de verificación no está configurado." }, { status: 503 });
    const code = randomInt(100000, 1000000).toString();
    const updated = await prisma.authAttempt.updateMany({
      where: { id: attempt.id, proofVerifiedAt: null, consumedAt: null },
      data: { proofVerifiedAt: new Date(), codeHash: secretHash(`${attempt.id}:${code}`), codeExpiresAt: new Date(Date.now() + 10 * 60_000) },
    });
    if (updated.count !== 1) return Response.json({ error: "El intento ya fue utilizado." }, { status: 409 });
    const sent = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [attempt.email], subject: "Código de verificación de Pulso", text: `Tu código de Pulso es ${code}. Vence en 10 minutos. Si no lo solicitaste, ignora este mensaje.` }),
      cache: "no-store",
    });
    if (!sent.ok) {
      await prisma.authAttempt.update({ where: { id: attempt.id }, data: { consumedAt: new Date() } });
      return Response.json({ error: "No pudimos enviar el correo. Revisa la configuración de Resend e inicia de nuevo." }, { status: 502 });
    }
    return Response.json({ sent: true });
  } catch {
    return Response.json({ error: "No fue posible verificar el acceso." }, { status: 500 });
  }
}
