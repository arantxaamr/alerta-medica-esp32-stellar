import { randomBytes } from "node:crypto";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashIp, isValidEmail, isValidStellarAddress, normalizeEmail } from "@/lib/pollar-proof";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!isValidEmail(body.email) || typeof body.walletAddress !== "string" || !isValidStellarAddress(body.walletAddress)) {
      return Response.json({ error: "Identidad de Pollar inválida." }, { status: 400 });
    }
    const email = normalizeEmail(body.email);
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "local";
    const ipHash = hashIp(ip);
    const since = new Date(Date.now() - 60 * 60_000);
    const [emailCount, ipCount] = await Promise.all([
      prisma.authAttempt.count({ where: { email, createdAt: { gte: since } } }),
      prisma.authAttempt.count({ where: { ipHash, createdAt: { gte: since } } }),
    ]);
    if (emailCount >= 10 || ipCount >= 30) return Response.json({ error: "Demasiados intentos. Intenta más tarde." }, { status: 429 });
    const nonce = randomBytes(24).toString("base64url");
    const challenge = `Pulso · comprobar sesión Pollar\nOrigen: ${request.nextUrl.origin}\nNonce: ${nonce}\nVálido por 5 minutos`;
    const attempt = await prisma.authAttempt.create({ data: { email, walletAddress: body.walletAddress, challenge, ipHash, expiresAt: new Date(Date.now() + 5 * 60_000) } });
    return Response.json({ attemptId: attempt.id, challenge });
  } catch {
    return Response.json({ error: "No fue posible comprobar la sesión." }, { status: 500 });
  }
}
