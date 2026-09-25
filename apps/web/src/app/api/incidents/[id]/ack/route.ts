import { NextResponse } from "next/server";
import { acknowledgeIncident } from "@/lib/ack";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const { id } = await params;
  try {
    const body = (await request.json().catch(() => ({}))) as {
      actorLabel?: string;
    };
    const result = await acknowledgeIncident(id, body.actorLabel);
    if (!result) {
      return NextResponse.json({ error: "Incidente no encontrado" }, { status: 404 });
    }
    return NextResponse.json(result);
  } catch (error) {
    console.error("POST ack", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error" },
      { status: 500 },
    );
  }
}
