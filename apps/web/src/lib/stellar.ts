import { createHash, randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";

const COMMITMENT_VERSION = "pulso_v1";

export function caseKeyToBytes(caseKeyHex: string): Buffer {
  return Buffer.from(caseKeyHex, "hex");
}

export function buildCommitment(input: {
  caseKey: string;
  seq: number;
  eventCode: string;
  serverReceivedAtUnix: number;
  canonicalRecord: string;
  nonce: Buffer;
}): { commitmentHex: string; nonceHex: string } {
  const preimage = Buffer.concat([
    Buffer.from(COMMITMENT_VERSION, "utf8"),
    Buffer.from("|", "utf8"),
    Buffer.from(input.caseKey, "utf8"),
    Buffer.from("|", "utf8"),
    Buffer.from(String(input.seq), "utf8"),
    Buffer.from("|", "utf8"),
    Buffer.from(input.eventCode, "utf8"),
    Buffer.from("|", "utf8"),
    Buffer.from(String(input.serverReceivedAtUnix), "utf8"),
    Buffer.from("|", "utf8"),
    Buffer.from(input.canonicalRecord, "utf8"),
    Buffer.from("|", "utf8"),
    input.nonce,
  ]);
  return {
    commitmentHex: createHash("sha256").update(preimage).digest("hex"),
    nonceHex: input.nonce.toString("hex"),
  };
}

const EVENT_CODE_NUM: Record<string, number> = {
  OPENED: 1,
  FAMILY_ACK: 2,
  CLOSED: 3,
  FALSE_ALARM: 4,
};

/**
 * Encola anclaje y, si hay claves Stellar + contract id, intenta enviarlo.
 * Fallos no bloquean la alerta operativa.
 */
export async function queueAndTryAnchor(input: {
  incidentId: string;
  incidentEventId: string;
  caseKey: string;
  seq: number;
  eventCode: keyof typeof EVENT_CODE_NUM;
  serverReceivedAtUtc: Date;
  canonicalRecord: string;
}) {
  const nonce = randomBytes(32);
  const serverReceivedAtUnix = Math.floor(
    input.serverReceivedAtUtc.getTime() / 1000,
  );
  const { commitmentHex, nonceHex } = buildCommitment({
    caseKey: input.caseKey,
    seq: input.seq,
    eventCode: input.eventCode,
    serverReceivedAtUnix,
    canonicalRecord: input.canonicalRecord,
    nonce,
  });

  const anchor = await prisma.chainAnchor.create({
    data: {
      incidentId: input.incidentId,
      incidentEventId: input.incidentEventId,
      network: process.env.STELLAR_NETWORK || "testnet",
      status: "pending",
      commitment: JSON.stringify({
        commitmentHex,
        nonceHex,
        eventCode: input.eventCode,
        eventCodeNum: EVENT_CODE_NUM[input.eventCode],
        serverReceivedAtUnix,
        caseKey: input.caseKey,
        seq: input.seq,
      }),
    },
  });

  const secret = process.env.STELLAR_SECRET_KEY;
  const contractId = process.env.STELLAR_CONTRACT_ID;
  if (!secret || !contractId) {
    return {
      anchorId: anchor.id,
      status: "pending" as const,
      reason: "STELLAR_SECRET_KEY o STELLAR_CONTRACT_ID no configurados",
    };
  }

  try {
    const { submitRecordEvent } = await import("./stellar-submit");
    const result = await submitRecordEvent({
      caseKeyHex: input.caseKey,
      seq: input.seq,
      eventCode: EVENT_CODE_NUM[input.eventCode],
      serverReceivedAtUnix,
      commitmentHex,
      secret,
      contractId,
    });
    await prisma.chainAnchor.update({
      where: { id: anchor.id },
      data: {
        status: "confirmed",
        txHash: result.txHash,
        ledgerClosedAtUtc: result.ledgerClosedAt
          ? new Date(result.ledgerClosedAt)
          : new Date(),
      },
    });
    return { anchorId: anchor.id, status: "confirmed" as const, ...result };
  } catch (error) {
    await prisma.chainAnchor.update({
      where: { id: anchor.id },
      data: {
        status: "failed",
        retries: { increment: 1 },
        commitment: JSON.stringify({
          commitmentHex,
          nonceHex,
          error: error instanceof Error ? error.message : "anchor failed",
        }),
      },
    });
    return {
      anchorId: anchor.id,
      status: "failed" as const,
      reason: error instanceof Error ? error.message : "anchor failed",
    };
  }
}
