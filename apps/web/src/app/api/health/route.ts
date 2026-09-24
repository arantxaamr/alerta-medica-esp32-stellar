import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const started = Date.now();
  let database: "ok" | "error" | "skipped" = "skipped";
  let databaseError: string | undefined;

  if (process.env.DATABASE_URL) {
    try {
      const { prisma } = await import("@/lib/prisma");
      await prisma.$queryRaw`SELECT 1`;
      database = "ok";
    } catch (error) {
      database = "error";
      databaseError =
        error instanceof Error ? error.message : "Unknown database error";
    }
  }

  const body = {
    service: "pulso",
    status: database === "error" ? "degraded" : "ok",
    mode: process.env.PULSO_MODE ?? "simulation",
    time: new Date().toISOString(),
    latencyMs: Date.now() - started,
    database,
    ...(databaseError ? { databaseError } : {}),
  };

  return NextResponse.json(body, {
    status: database === "error" ? 503 : 200,
  });
}
