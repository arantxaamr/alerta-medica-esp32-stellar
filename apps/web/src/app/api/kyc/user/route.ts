import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { CONSENT_VERSION } from "@/lib/kyc";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await requireSession(["USER", "ADMIN"]);
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const body = (await request.json()) as {
    displayName?: string;
    phone?: string;
    address?: string;
    colonia?: string;
    alcaldia?: string;
    birthYear?: number;
    acceptsNot911?: boolean;
    acceptsPrivacy?: boolean;
    acceptsHealthData?: boolean;
  };

  if (!body.displayName?.trim() || !body.phone?.trim() || !body.address?.trim()) {
    return NextResponse.json(
      { error: "Nombre, teléfono y domicilio son obligatorios" },
      { status: 400 },
    );
  }
  if (!body.acceptsNot911 || !body.acceptsPrivacy || !body.acceptsHealthData) {
    return NextResponse.json(
      { error: "Debes aceptar los consentimientos para continuar" },
      { status: 400 },
    );
  }

  const year = body.birthYear ? Number(body.birthYear) : null;
  if (year && (year < 1900 || year > new Date().getFullYear() - 18)) {
    return NextResponse.json(
      { error: "Año de nacimiento no válido (MVP: mayor de 18)" },
      { status: 400 },
    );
  }

  const addressEncrypted = Buffer.from(body.address.trim(), "utf8").toString(
    "base64",
  );

  const profile = await prisma.profile.upsert({
    where: { userId: session.userId },
    create: {
      userId: session.userId,
      displayName: body.displayName.trim(),
      phone: body.phone.trim(),
      addressEncrypted,
      colonia: body.colonia?.trim() || null,
      alcaldia: body.alcaldia?.trim() || null,
      birthYear: year,
      consentVersion: CONSENT_VERSION,
      kycStatus: "completed",
      kycCompletedAt: new Date(),
      acceptsNot911: true,
      acceptsPrivacy: true,
      acceptsHealthData: true,
      isDemoIdentity: process.env.PULSO_MODE !== "production",
    },
    update: {
      displayName: body.displayName.trim(),
      phone: body.phone.trim(),
      addressEncrypted,
      colonia: body.colonia?.trim() || null,
      alcaldia: body.alcaldia?.trim() || null,
      birthYear: year,
      consentVersion: CONSENT_VERSION,
      kycStatus: "completed",
      kycCompletedAt: new Date(),
      acceptsNot911: true,
      acceptsPrivacy: true,
      acceptsHealthData: true,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: session.userId,
      action: "kyc.user.completed",
      objectType: "profile",
      objectId: session.userId,
    },
  });

  return NextResponse.json({
    ok: true,
    profile: {
      displayName: profile.displayName,
      kycStatus: profile.kycStatus,
    },
  });
}
