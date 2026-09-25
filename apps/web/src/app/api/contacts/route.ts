import { currentUser, isValidEmail, normalizeEmail } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const user = await currentUser();
  if (!user || user.role !== "USER" || !user.profile?.consentAcceptedAt) return Response.json({ error: "Acceso no permitido." }, { status: 403 });
  try {
    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const relationship = typeof body.relationship === "string" ? body.relationship.trim() : "";
    if (!isValidEmail(body.email) || name.length < 2 || name.length > 80 || relationship.length < 2 || relationship.length > 50) {
      return Response.json({ error: "Completa nombre, correo y parentesco." }, { status: 400 });
    }
    const email = normalizeEmail(body.email);
    if (email === user.email) return Response.json({ error: "Agrega el correo de otra persona." }, { status: 400 });
    const count = await prisma.contact.count({ where: { userId: user.id } });
    if (count >= 5) return Response.json({ error: "El piloto permite hasta cinco contactos por persona." }, { status: 400 });
    const existing = await prisma.contact.findFirst({ where: { userId: user.id, email } });
    if (existing) return Response.json({ error: "Este correo ya está en tu red." }, { status: 409 });
    const contact = await prisma.contact.create({ data: { userId: user.id, name, email, relationship, isPrimary: count === 0 } });
    await prisma.auditLog.create({ data: { actorId: user.id, action: "CONTACT_INVITED", objectType: "contact", objectId: contact.id } });
    const inviteUrl = new URL("/acceso", request.url);
    inviteUrl.searchParams.set("invitacion", "1");
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.RESEND_FROM_EMAIL;
    let emailSent = false;
    if (apiKey && from) {
      const sent = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from, to: [email], subject: "Te invitaron a la red de apoyo Pulso", text: `${user.profile.displayName} te invitó a su red de apoyo en Pulso. Para aceptar, entra con este correo en ${inviteUrl.toString()} y completa tu consentimiento. Si no conoces a esta persona, ignora este mensaje.` }),
        cache: "no-store",
      });
      emailSent = sent.ok;
    }
    return Response.json({ contactId: contact.id, emailSent, inviteUrl: inviteUrl.toString() }, { status: 201 });
  } catch {
    return Response.json({ error: "No fue posible guardar el contacto." }, { status: 500 });
  }
}
