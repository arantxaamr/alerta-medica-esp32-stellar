import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { sendFamilyInviteEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await requireSession(["USER", "ADMIN"]);
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  const contacts = await prisma.contact.findMany({
    where: { userId: session.userId },
    orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
  });
  return NextResponse.json({ contacts });
}

export async function POST(request: Request) {
  const session = await requireSession(["USER", "ADMIN"]);
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const profile = await prisma.profile.findUnique({
    where: { userId: session.userId },
  });
  if (profile?.kycStatus !== "completed") {
    return NextResponse.json(
      { error: "Completa primero tu alta / KYC personal" },
      { status: 403 },
    );
  }

  const body = (await request.json()) as {
    name?: string;
    email?: string;
    phone?: string;
    relationship?: string;
    isPrimary?: boolean;
  };

  if (!body.name?.trim() || !body.email?.trim() || !body.relationship?.trim()) {
    return NextResponse.json(
      { error: "Nombre, correo y parentesco son obligatorios" },
      { status: 400 },
    );
  }

  const email = body.email.trim().toLowerCase();
  const inviteToken = randomBytes(24).toString("hex");
  const now = new Date();

  const contact = await prisma.contact.create({
    data: {
      userId: session.userId,
      name: body.name.trim(),
      email,
      phone: body.phone?.trim() || null,
      relationship: body.relationship.trim(),
      isPrimary: Boolean(body.isPrimary),
      inviteToken,
      inviteSentAt: now,
      kycStatus: "pending",
      permissions: "ack,view_incident,view_checkin_summary",
    },
  });

  const base =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    "http://localhost:3000";
  const inviteLink = `${base}/familiar/unir/${inviteToken}`;

  const mail = await sendFamilyInviteEmail({
    to: email,
    contactName: contact.name,
    personName: profile.displayName || session.displayName || "Alguien",
    inviteLink,
  });

  return NextResponse.json(
    {
      contact,
      inviteLink,
      emailSent: mail.ok,
      emailTo: mail.ok ? mail.to : email,
      emailError: mail.ok ? null : mail.error,
    },
    { status: 201 },
  );
}
