import {
  Contract,
  Keypair,
  Networks,
  TransactionBuilder,
  rpc,
  nativeToScVal,
} from "@stellar/stellar-sdk";

const RPC_URL =
  process.env.STELLAR_RPC_URL || "https://soroban-testnet.stellar.org";

export async function submitRecordEvent(input: {
  caseKeyHex: string;
  seq: number;
  eventCode: number;
  serverReceivedAtUnix: number;
  commitmentHex: string;
  secret: string;
  contractId: string;
}) {
  const server = new rpc.Server(RPC_URL);
  const source = Keypair.fromSecret(input.secret);
  const account = await server.getAccount(source.publicKey());
  const contract = new Contract(input.contractId);

  const caseKey = Buffer.from(input.caseKeyHex, "hex");
  const commitment = Buffer.from(input.commitmentHex, "hex");
  if (caseKey.length !== 32 || commitment.length !== 32) {
    throw new Error("case_key y commitment deben ser 32 bytes");
  }

  const tx = new TransactionBuilder(account, {
    fee: "100000",
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(
      contract.call(
        "record_event",
        nativeToScVal(caseKey),
        nativeToScVal(input.seq, { type: "u32" }),
        nativeToScVal(input.eventCode, { type: "u32" }),
        nativeToScVal(BigInt(input.serverReceivedAtUnix), { type: "u64" }),
        nativeToScVal(commitment),
      ),
    )
    .setTimeout(60)
    .build();

  const prepared = await server.prepareTransaction(tx);
  prepared.sign(source);
  const send = await server.sendTransaction(prepared);
  if (send.status === "ERROR") {
    throw new Error(`Stellar send error: ${JSON.stringify(send)}`);
  }

  const hash = send.hash;
  for (let i = 0; i < 20; i++) {
    await new Promise((r) => setTimeout(r, 1500));
    const res = await server.getTransaction(hash);
    if (res.status === "SUCCESS") {
      const closeTime =
        "createdAt" in res && typeof res.createdAt === "number"
          ? res.createdAt
          : undefined;
      return {
        txHash: hash,
        ledgerClosedAt: closeTime,
      };
    }
    if (res.status === "FAILED") {
      throw new Error(`Stellar tx failed: ${hash}`);
    }
  }
  return { txHash: hash, ledgerClosedAt: undefined };
}
