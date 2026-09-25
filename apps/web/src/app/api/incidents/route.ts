import { NextResponse } from "next/server";
import { createWebHelpIncident, serializeIncident } from "@/lib/incidents";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      forceNew?: boolean;
    };
    const { incident, reused } = await createWebHelpIncident({
      forceNew: Boolean(body.forceNew),
    });
    return NextResponse.json(
      {
        accepted: true,
        reused,
        incident: serializeIncident(incident),
        serverTime: new Date().toISOString(),
      },
      { status: reused ? 200 : 201 },
    );
  } catch (error) {
    if (error instanceof Error && error.message === "AUTH_REQUIRED") {
      return NextResponse.json(
        { accepted: false, error: "Inicia sesión para crear una alerta." },
        { status: 401 },
      );
    }
    console.error("POST /api/incidents", error);
    return NextResponse.json(
      {
        accepted: false,
        error:
          error instanceof Error ? error.message : "No se pudo crear la alerta",
      },
      { status: 500 },
    );
  }
}
