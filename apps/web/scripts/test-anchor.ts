import { readFileSync } from "fs";
import { join } from "path";
import { randomBytes, createHash } from "crypto";
import { submitRecordEvent } from "../src/lib/stellar-submit";

for (const line of readFileSync(join(__dirname, "../.env.local"), "utf8").split(
  /\r?\n/,
)) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (!m) continue;
  const key = m[1].trim();
  let val = m[2].trim();
  if (
    (val.startsWith('"') && val.endsWith('"')) ||
    (val.startsWith("'") && val.endsWith("'"))
  ) {
    val = val.slice(1, -1);
  }
  process.env[key] = val;
}

async function main() {
  const caseKey = randomBytes(32).toString("hex");
  const commitment = createHash("sha256")
    .update("pulso-test-open")
    .digest("hex");
  const secret = process.env.STELLAR_SECRET_KEY;
  const contractId = process.env.STELLAR_CONTRACT_ID;
  if (!secret || !contractId) throw new Error("missing STELLAR env");
  console.log("contract", contractId);
  console.log("caseKey", caseKey.slice(0, 8) + "...");
  const r = await submitRecordEvent({
    caseKeyHex: caseKey,
    seq: 1,
    eventCode: 1,
    serverReceivedAtUnix: Math.floor(Date.now() / 1000),
    commitmentHex: commitment,
    secret,
    contractId,
  });
  console.log("OK", r.txHash);
  console.log("https://stellar.expert/explorer/testnet/tx/" + r.txHash);
}

main().catch((e) => {
  console.error("FAIL", e);
  process.exit(1);
});
