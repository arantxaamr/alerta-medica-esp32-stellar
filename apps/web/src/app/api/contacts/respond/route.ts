import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const user = await currentUser();
  if (!user || user.role !== "FAMILY" || !user.profile?.consentAcceptedAt) return Response.json({ error: "Acceso no permitido." }, { status: 403 });
  try {
    const body = await request.json();
    if (typeof body.contactId !== "string" || !["accept", "decline"].includes(body.decision) || (body.decision === "accept" && body.acceptsResponsibilities !== true)) return Response.json({ error: "Respuesta o consentimiento inválido." }, { status: 400 });
    const contact = await prisma.contact.findUnique({ where: { id: body.contactId } });
    if (!contact || contact.email !== user.email || contact.verifiedAt) return Response.json({ error: "Invitación no disponible." }, { status: 404 });
    await prisma.$transaction(async tx => {
      if (body.decision === "accept") await tx.contact.update({ where: { id: contact.id }, data: { verifiedAt: new Date(), kyc_status: "completed", kyc_completed_at: new Date(), accepts_alerts: true, accepts_call_911: true, accepts_privacy: true } });
      else await tx.contact.delete({ where: { id: contact.id } });
      await tx.auditLog.create({ data: { actorId: user.id, action: body.decision === "accept" ? "CONTACT_ACCEPTED" : "CONTACT_DECLINED", objectType: "contact", objectId: contact.id } });
    });
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "No pudimos guardar tu respuesta." }, { status: 500 });
  }
}
