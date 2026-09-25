import { CONSENT_VERSION, currentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) return Response.json({ error: "Inicia sesión de nuevo." }, { status: 401 });
  try {
    const body = await request.json();
    const displayName = typeof body.displayName === "string" ? body.displayName.trim() : "";
    if (displayName.length < 2 || displayName.length > 80 || body.acceptsPrivacy !== true || body.understands911 !== true) {
      return Response.json({ error: "Escribe tu nombre y confirma ambos consentimientos para continuar." }, { status: 400 });
    }
    await prisma.$transaction(async (tx) => {
      await tx.profile.upsert({
        where: { userId: user.id },
        create: { userId: user.id, displayName, consentVersion: CONSENT_VERSION, consentAcceptedAt: new Date(), isDemoIdentity: false, kyc_status: "completed", kyc_completed_at: new Date(), onboarding_step: "complete", accepts_privacy: true, accepts_not_911: true },
        update: { displayName, consentVersion: CONSENT_VERSION, consentAcceptedAt: new Date(), isDemoIdentity: false, kyc_status: "completed", kyc_completed_at: new Date(), onboarding_step: "complete", accepts_privacy: true, accepts_not_911: true },
      });
      await tx.auditLog.create({ data: { actorId: user.id, action: "CONSENT_ACCEPTED", objectType: "profile", objectId: user.id } });
    });
    return Response.json({ next: "/panel" });
  } catch {
    return Response.json({ error: "No pudimos guardar tu consentimiento." }, { status: 500 });
  }
}
