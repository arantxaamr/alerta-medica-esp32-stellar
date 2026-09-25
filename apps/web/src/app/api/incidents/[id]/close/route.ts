import { NextResponse } from "next/server";
import { closeIncident } from "@/lib/ack";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const { id } = await params;
  try {
    const body = (await request.json().catch(() => ({}))) as {
      kind?: "CLOSED" | "FALSE_ALARM";
      actorLabel?: string;
    };
    const kind = body.kind === "FALSE_ALARM" ? "FALSE_ALARM" : "CLOSED";
    const result = await closeIncident(id, kind, body.actorLabel);
    if (!result) {
      return NextResponse.json(
        { error: "Incidente no encontrado" },
        { status: 404 },
      );
    }
    return NextResponse.json({
      ok: true,
      alreadyClosed: result.alreadyClosed,
      incident: result.incident,
    });
  } catch (error) {
    console.error("POST /api/incidents/[id]/close", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error" },
      { status: 500 },
    );
  }
}
