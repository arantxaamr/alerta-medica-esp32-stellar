import { createHash, createHmac, createPublicKey, timingSafeEqual, verify } from "node:crypto";

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function isValidEmail(value: unknown): value is string {
  return typeof value === "string" && value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function secretHash(value: string) {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) throw new Error("SESSION_SECRET no configurado");
  return createHmac("sha256", secret).update(value).digest("hex");
}

export function hashIp(ip: string) {
  return secretHash(`ip:${ip}`);
}

function decodeStellarAddress(address: string): Buffer | null {
  if (!/^G[A-Z2-7]{55}$/.test(address)) return null;
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];
  for (const letter of address) {
    value = (value << 5) | alphabet.indexOf(letter);
    bits += 5;
    if (bits >= 8) {
      bits -= 8;
      bytes.push((value >>> bits) & 255);
    }
  }
  if (bytes.length !== 35 || bytes[0] !== 6 << 3) return null;
  let crc = 0;
  for (const byte of bytes.slice(0, 33)) {
    crc ^= byte << 8;
    for (let i = 0; i < 8; i++) crc = ((crc & 0x8000) ? (crc << 1) ^ 0x1021 : crc << 1) & 0xffff;
  }
  if (bytes[33] !== (crc & 255) || bytes[34] !== (crc >> 8)) return null;
  return Buffer.from(bytes.slice(1, 33));
}

export function isValidStellarAddress(address: string) {
  return decodeStellarAddress(address) !== null;
}

export function verifySep53(message: string, signature: string, address: string) {
  const key = decodeStellarAddress(address);
  if (!key || !/^[A-Za-z0-9+/]{86}==$/.test(signature)) return false;
  try {
    const digest = createHash("sha256").update(`Stellar Signed Message:\n${message}`).digest();
    const spki = Buffer.concat([Buffer.from("302a300506032b6570032100", "hex"), key]);
    return verify(null, digest, createPublicKey({ key: spki, format: "der", type: "spki" }), Buffer.from(signature, "base64"));
  } catch {
    return false;
  }
}

export function hashesEqual(a: string, b: string) {
  const left = Buffer.from(a, "hex");
  const right = Buffer.from(b, "hex");
  return left.length === right.length && timingSafeEqual(left, right);
}
