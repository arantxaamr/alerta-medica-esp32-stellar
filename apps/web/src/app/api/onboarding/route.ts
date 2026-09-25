import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Onboarding legacy. El flujo actual es `/alta` + `/api/profile` (KYC v2).
 * Se mantiene el endpoint para no romper clientes viejos.
 */
export async function GET() {
  return NextResponse.json(
    {
      error: "Usa /alta para el alta de usuario",
      redirect: "/alta",
    },
    { status: 410 },
  );
}

export async function POST() {
  return NextResponse.json(
    {
      error: "Usa /alta para el alta de usuario",
      redirect: "/alta",
    },
    { status: 410 },
  );
}
