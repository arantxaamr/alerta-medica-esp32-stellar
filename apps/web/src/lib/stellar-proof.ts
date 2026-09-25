import { createHash, createPublicKey, verify } from "node:crypto";

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
