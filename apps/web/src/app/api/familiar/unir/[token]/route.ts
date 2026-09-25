import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { upsertPulsoUser } from "@/lib/users";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ token: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { token } = await params;
  const contact = await prisma.contact.findUnique({
    where: { inviteToken: token },
    include: {
      user: { include: { profile: true } },
    },
  });
  if (!contact) {
    return NextResponse.json({ error: "Invitación no válida" }, { status: 404 });
  }
  return NextResponse.json({
    contact: {
      id: contact.id,
      name: contact.name,
      email: contact.email,
      relationship: contact.relationship,
      kycStatus: contact.kycStatus,
      personName: contact.user.profile?.displayName || contact.user.email,
    },
  });
}

export async function POST(request: Request, { params }: Params) {
  const { token } = await params;
  const contact = await prisma.contact.findUnique({
    where: { inviteToken: token },
    include: { user: { include: { profile: true } } },
  });
  if (!contact) {
    return NextResponse.json({ error: "Invitación no válida" }, { status: 404 });
  }

  const body = (await request.json()) as {
    name?: string;
    phone?: string;
    acceptsAlerts?: boolean;
    acceptsCall911?: boolean;
    acceptsPrivacy?: boolean;
  };

  if (!body.name?.trim() || !body.phone?.trim()) {
    return NextResponse.json(
      { error: "Nombre y teléfono son obligatorios" },
      { status: 400 },
    );
  }
  if (!body.acceptsAlerts || !body.acceptsCall911 || !body.acceptsPrivacy) {
    return NextResponse.json(
      { error: "Debes aceptar los consentimientos del familiar" },
      { status: 400 },
    );
  }

  const updated = await prisma.contact.update({
    where: { id: contact.id },
    data: {
      name: body.name.trim(),
      phone: body.phone.trim(),
      acceptsAlerts: true,
      acceptsCall911: true,
      acceptsPrivacy: true,
      kycStatus: "completed",
      kycCompletedAt: new Date(),
      verifiedAt: new Date(),
    },
  });

  // Crea/actualiza usuario FAMILY para que pueda entrar al panel
  const familyUser = await upsertPulsoUser({
    email: contact.email,
    pollarSubject: `family-invite-${contact.id}`,
    displayName: body.name.trim(),
  });
  if (familyUser.role !== "FAMILY") {
    await prisma.user.update({
      where: { id: familyUser.id },
      data: { role: "FAMILY" },
    });
  }

  const session = await getSession();
  session.isLoggedIn = true;
  session.userId = familyUser.id;
  session.email = contact.email;
  session.role = "FAMILY";
  session.pollarSubject = familyUser.pollarSubject;
  session.displayName = body.name.trim();
  await session.save();

  await prisma.auditLog.create({
    data: {
      actorId: familyUser.id,
      action: "kyc.family.completed",
      objectType: "contact",
      objectId: contact.id,
    },
  });

  return NextResponse.json({
    ok: true,
    contactId: updated.id,
    personName: contact.user.profile?.displayName,
  });
}
