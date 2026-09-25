import { NextResponse } from "next/server";
import { requireSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/** Fondea la wallet Pollar (opcional) tras KYC de producto completado. */
export async function POST(request: Request) {
  const session = await requireSession(["USER", "ADMIN"]);
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const secret = process.env.POLLAR_SECRET_KEY;
  if (!secret) {
    return NextResponse.json(
      { error: "POLLAR_SECRET_KEY no configurada" },
      { status: 500 },
    );
  }

  const profile = await prisma.profile.findUnique({
    where: { userId: session.userId },
  });
  if (!profile || profile.kycStatus !== "completed") {
    return NextResponse.json(
      { error: "Completa el KYC antes de activar la wallet" },
      { status: 400 },
    );
  }

  const body = (await request.json().catch(() => ({}))) as {
    publicKey?: string;
  };
  const publicKey = body.publicKey || session.pollarSubject;
  if (!publicKey || !publicKey.startsWith("G")) {
    return NextResponse.json(
      {
        error:
          "Falta la dirección Stellar (G…). Inicia sesión con Pollar OTP, no solo demo.",
      },
      { status: 400 },
    );
  }

  const response = await fetch(
    "https://server.api.pollar.xyz/v1/wallets/fund",
    {
      method: "POST",
      headers: {
        "x-pollar-api-key": secret,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ publicKey }),
    },
  );

  const payload = await response.json().catch(() => ({}));

  // 409 = already funded → éxito
  if (!response.ok && response.status !== 409) {
    return NextResponse.json(
      {
        error: "No se pudo fondear la wallet",
        details: payload,
        status: response.status,
      },
      { status: response.status },
    );
  }

  return NextResponse.json({
    activated: true,
    publicKey,
    pollar: payload,
  });
}
