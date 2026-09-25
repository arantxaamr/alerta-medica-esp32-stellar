import { NextResponse } from "next/server";
import { requireSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const CONSENT_VERSION = "pulso-pilot-v1";

export async function GET() {
  const session = await requireSession(["USER", "ADMIN"]);
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const profile = await prisma.profile.findUnique({
    where: { userId: session.userId },
  });
  const contacts = await prisma.contact.count({
    where: { userId: session.userId },
  });

  return NextResponse.json({
    profile,
    contacts,
    consentVersion: CONSENT_VERSION,
    done: profile?.onboardingStep === "done" && profile.kycStatus === "approved",
  });
}

export async function POST(request: Request) {
  const session = await requireSession(["USER", "ADMIN"]);
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const body = (await request.json()) as {
    step?: "consent" | "profile" | "kyc" | "family" | "done";
    displayName?: string;
    phone?: string;
    address?: string;
    alcaldia?: string;
    colonia?: string;
    acceptConsent?: boolean;
  };

  const existing = await prisma.profile.findUnique({
    where: { userId: session.userId },
  });

  if (body.step === "consent") {
    if (!body.acceptConsent) {
      return NextResponse.json(
        { error: "Debes aceptar el aviso de privacidad" },
        { status: 400 },
      );
    }
    const profile = await prisma.profile.upsert({
      where: { userId: session.userId },
      create: {
        userId: session.userId,
        displayName: session.displayName || session.email.split("@")[0],
        consentVersion: CONSENT_VERSION,
        consentAcceptedAt: new Date(),
        onboardingStep: "profile",
        kycStatus: "none",
        isDemoIdentity: false,
      },
      update: {
        consentVersion: CONSENT_VERSION,
        consentAcceptedAt: new Date(),
        onboardingStep: "profile",
        isDemoIdentity: false,
      },
    });
    return NextResponse.json({ profile });
  }

  if (body.step === "profile") {
    if (!body.displayName?.trim() || !body.phone?.trim() || !body.address?.trim()) {
      return NextResponse.json(
        { error: "Nombre, teléfono y domicilio son obligatorios" },
        { status: 400 },
      );
    }
    const profile = await prisma.profile.update({
      where: { userId: session.userId },
      data: {
        displayName: body.displayName.trim(),
        phone: body.phone.trim(),
        addressEncrypted: Buffer.from(body.address.trim(), "utf8").toString(
          "base64",
        ),
        alcaldia: body.alcaldia?.trim() || null,
        colonia: body.colonia?.trim() || null,
        onboardingStep: "kyc",
        kycStatus: "pending",
        isDemoIdentity: false,
      },
    });
    return NextResponse.json({ profile });
  }

  if (body.step === "kyc") {
    // KYC de producto aprobado: datos reales capturados + consentimiento.
    // Luego el cliente llama /api/activate para fondear wallet Pollar.
    const profile = await prisma.profile.update({
      where: { userId: session.userId },
      data: {
        kycStatus: "approved",
        kycCompletedAt: new Date(),
        onboardingStep: "family",
      },
    });
    return NextResponse.json({ profile });
  }

  if (body.step === "family" || body.step === "done") {
    const profile = await prisma.profile.update({
      where: { userId: session.userId },
      data: {
        onboardingStep: "done",
        kycStatus: existing?.kycStatus === "approved" ? "approved" : existing?.kycStatus,
      },
    });
    return NextResponse.json({ profile });
  }

  return NextResponse.json({ error: "Paso inválido" }, { status: 400 });
}
