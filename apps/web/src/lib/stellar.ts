import { createHash, randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";

const COMMITMENT_VERSION = "pulso_v1";

export const EVENT_CODE_NUM = {
  OPENED: 1,
  FAMILY_ACK: 2,
  CLOSED: 3,
  FALSE_ALARM: 4,
} as const;

export type AnchorEventCode = keyof typeof EVENT_CODE_NUM;

export type CommitmentPayload = {
  commitmentHex: string;
  nonceHex: string;
  eventCode: AnchorEventCode;
  eventCodeNum: number;
  serverReceivedAtUnix: number;
  caseKey: string;
  seq: number;
  lastError?: string;
};

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

function parseCommitment(raw: string | null): CommitmentPayload | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CommitmentPayload;
  } catch {
    return null;
  }
}

function expertTxUrl(txHash: string, network: string) {
  const net = network === "public" || network === "mainnet" ? "public" : "testnet";
  return `https://stellar.expert/explorer/${net}/tx/${txHash}`;
}

/**
 * Encola anclaje e intenta enviarlo a Stellar.
 * Fallos no deben bloquear alertas: el caller puede no await-ear.
 */
export async function queueAndTryAnchor(input: {
  incidentId: string;
  incidentEventId: string;
  caseKey: string;
  seq: number;
  eventCode: AnchorEventCode;
  serverReceivedAtUtc: Date;
  canonicalRecord: string;
}) {
  const existing = await prisma.chainAnchor.findFirst({
    where: { incidentEventId: input.incidentEventId },
  });
  if (existing?.status === "confirmed") {
    return {
      anchorId: existing.id,
      status: "confirmed" as const,
      txHash: existing.txHash,
    };
  }

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

  const payload: CommitmentPayload = {
    commitmentHex,
    nonceHex,
    eventCode: input.eventCode,
    eventCodeNum: EVENT_CODE_NUM[input.eventCode],
    serverReceivedAtUnix,
    caseKey: input.caseKey,
    seq: input.seq,
  };

  const anchor = existing
    ? await prisma.chainAnchor.update({
        where: { id: existing.id },
        data: {
          status: "pending",
          commitment: JSON.stringify(payload),
        },
      })
    : await prisma.chainAnchor.create({
        data: {
          incidentId: input.incidentId,
          incidentEventId: input.incidentEventId,
          network: process.env.STELLAR_NETWORK || "testnet",
          status: "pending",
          commitment: JSON.stringify(payload),
        },
      });

  return submitAnchorById(anchor.id);
}

async function submitAnchorById(anchorId: string) {
  const anchor = await prisma.chainAnchor.findUnique({
    where: { id: anchorId },
  });
  if (!anchor) {
    return { anchorId, status: "failed" as const, reason: "anchor missing" };
  }
  if (anchor.status === "confirmed" && anchor.txHash) {
    return {
      anchorId,
      status: "confirmed" as const,
      txHash: anchor.txHash,
    };
  }

  const payload = parseCommitment(anchor.commitment);
  if (!payload?.commitmentHex || !payload.caseKey) {
    return {
      anchorId,
      status: "failed" as const,
      reason: "commitment payload inválido",
    };
  }

  const secret = process.env.STELLAR_SECRET_KEY;
  const contractId = process.env.STELLAR_CONTRACT_ID;
  if (!secret || !contractId) {
    return {
      anchorId,
      status: "pending" as const,
      reason: "STELLAR_SECRET_KEY o STELLAR_CONTRACT_ID no configurados",
    };
  }

  try {
    const { submitRecordEvent } = await import("./stellar-submit");
    const result = await submitRecordEvent({
      caseKeyHex: payload.caseKey,
      seq: payload.seq,
      eventCode: payload.eventCodeNum,
      serverReceivedAtUnix: payload.serverReceivedAtUnix,
      commitmentHex: payload.commitmentHex,
      secret,
      contractId,
    });
    await prisma.chainAnchor.update({
      where: { id: anchor.id },
      data: {
        status: "confirmed",
        txHash: result.txHash,
        ledgerClosedAtUtc: result.ledgerClosedAt
          ? new Date(
              typeof result.ledgerClosedAt === "number"
                ? result.ledgerClosedAt * 1000
                : result.ledgerClosedAt,
            )
          : new Date(),
        commitment: JSON.stringify(payload),
      },
    });
    return { anchorId: anchor.id, status: "confirmed" as const, ...result };
  } catch (error) {
    const message = error instanceof Error ? error.message : "anchor failed";
    await prisma.chainAnchor.update({
      where: { id: anchor.id },
      data: {
        status: "failed",
        retries: { increment: 1 },
        commitment: JSON.stringify({ ...payload, lastError: message }),
      },
    });
    return {
      anchorId: anchor.id,
      status: "failed" as const,
      reason: message,
    };
  }
}

/** Reintenta anclajes pending/failed de un incidente (o globales, tope 10). */
export async function retryPendingAnchors(incidentId?: string) {
  const anchors = await prisma.chainAnchor.findMany({
    where: {
      status: { in: ["pending", "failed"] },
      ...(incidentId ? { incidentId } : {}),
      retries: { lt: 8 },
    },
    orderBy: { createdAt: "asc" },
    take: 10,
  });

  const results = [];
  for (const a of anchors) {
    results.push(await submitAnchorById(a.id));
  }
  return results;
}

export function serializeAnchors(
  anchors: {
    id: string;
    status: string;
    txHash: string | null;
    network: string;
    retries: number;
    commitment: string | null;
    createdAt: Date;
  }[],
) {
  return anchors.map((a) => {
    const payload = parseCommitment(a.commitment);
    return {
      id: a.id,
      status: a.status,
      txHash: a.txHash,
      network: a.network,
      retries: a.retries,
      eventCode: payload?.eventCode ?? null,
      seq: payload?.seq ?? null,
      explorerUrl: a.txHash ? expertTxUrl(a.txHash, a.network) : null,
      createdAt: a.createdAt.toISOString(),
    };
  });
}
