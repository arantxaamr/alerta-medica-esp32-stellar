import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
export { isValidStellarAddress, verifySep53 } from "@/lib/stellar-proof";

export const SESSION_COOKIE = "pulso_session";
export const CONSENT_VERSION = "piloto-cdmx-v1";

export function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function secretHash(value: string) {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) throw new Error("SESSION_SECRET no configurado");
  return createHmac("sha256", secret).update(value).digest("hex");
}

export function randomToken() {
  return randomBytes(32).toString("base64url");
}

export function isValidEmail(value: unknown): value is string {
  return typeof value === "string" && value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function adminEmails() {
  return new Set((process.env.ADMIN_EMAILS || "").split(",").map(normalizeEmail).filter(Boolean));
}

export function hashesEqual(a: string, b: string) {
  const left = Buffer.from(a, "hex");
  const right = Buffer.from(b, "hex");
  return left.length === right.length && timingSafeEqual(left, right);
}

export async function currentUser() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token || token.length > 100) return null;
  const session = await prisma.appSession.findUnique({
    where: { tokenHash: sha256(token) },
    include: { user: { include: { profile: true } } },
  });
  if (!session || session.revokedAt || session.expiresAt <= new Date()) return null;
  if (session.user.role === "ADMIN" && !adminEmails().has(session.user.email)) return null;
  return session.user;
}
