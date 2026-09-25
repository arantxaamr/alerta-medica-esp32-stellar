import { randomBytes } from "node:crypto";
import { NextRequest } from "next/server";
import { isValidEmail, isValidStellarAddress, normalizeEmail, secretHash } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!isValidEmail(body.email) || typeof body.walletAddress !== "string" || !/^G[A-Z2-7]{55}$/.test(body.walletAddress)) {
      return Response.json({ error: "Datos de acceso inválidos." }, { status: 400 });
    }
    const email = normalizeEmail(body.email);
    const walletAddress = body.walletAddress;
    if (!isValidStellarAddress(walletAddress)) return Response.json({ error: "Dirección inválida." }, { status: 400 });
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
    const ipHash = secretHash(`ip:${ip}`);
    const since = new Date(Date.now() - 60 * 60_000);
    const [emailCount, ipCount] = await Promise.all([
      prisma.authAttempt.count({ where: { email, createdAt: { gte: since } } }),
      prisma.authAttempt.count({ where: { ipHash, createdAt: { gte: since } } }),
    ]);
    if (emailCount >= 5 || ipCount >= 20) return Response.json({ error: "Demasiados intentos. Intenta más tarde." }, { status: 429 });
    const nonce = randomBytes(24).toString("base64url");
    const challenge = `Pulso · acceso al piloto\nOrigen: ${request.nextUrl.origin}\nNonce: ${nonce}\nVálido por 5 minutos`;
    const attempt = await prisma.authAttempt.create({
      data: { email, walletAddress, challenge, ipHash, expiresAt: new Date(Date.now() + 5 * 60_000) },
    });
    return Response.json({ attemptId: attempt.id, challenge });
  } catch {
    return Response.json({ error: "No fue posible iniciar el acceso." }, { status: 500 });
  }
}
