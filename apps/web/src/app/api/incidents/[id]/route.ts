import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeIncident } from "@/lib/incidents";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  try {
    const incident = await prisma.incident.findUnique({
      where: { id },
      include: {
        events: { orderBy: { seq: "asc" } },
        notifications: { include: { contact: true } },
      },
    });
    if (!incident) {
      return NextResponse.json({ error: "Incidente no encontrado" }, { status: 404 });
    }
    return NextResponse.json({ incident: serializeIncident(incident) });
  } catch (error) {
    console.error("GET /api/incidents/[id]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error" },
      { status: 500 },
    );
  }
}
