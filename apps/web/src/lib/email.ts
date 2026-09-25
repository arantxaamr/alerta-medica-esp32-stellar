import { Resend } from "resend";
import { prisma } from "@/lib/prisma";

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

function appBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    "http://localhost:3000"
  );
}

function resolveRecipient(contactEmail: string): {
  to: string;
  redirected: boolean;
} {
  const testTo = process.env.RESEND_TEST_TO?.trim();
  const isFake =
    contactEmail.endsWith(".local") || contactEmail.includes("pulso.local");
  // Correos .local (demo) se redirigen a RESEND_TEST_TO si existe.
  if (isFake && testTo) {
    return { to: testTo, redirected: true };
  }
  return { to: contactEmail, redirected: false };
}

export async function sendFamilyInviteEmail(input: {
  to: string;
  contactName: string;
  personName: string;
  inviteLink: string;
}) {
  const resend = getResend();
  if (!resend) {
    return {
      ok: false as const,
      error: "RESEND_API_KEY no configurada",
    };
  }

  const from =
    process.env.RESEND_FROM_EMAIL || "Pulso <onboarding@resend.dev>";
  const { to, redirected } = resolveRecipient(input.to);

  const { data, error } = await resend.emails.send({
    from,
    to: [to],
    subject: `[Pulso] ${input.personName} te invita como contacto de ayuda`,
    text: [
      `Hola ${input.contactName},`,
      "",
      `${input.personName} te designó como contacto de ayuda en Pulso.`,
      "Completa tu alta para recibir alertas:",
      input.inviteLink,
      "",
      redirected
        ? `(Demo: el contacto en sistema era ${input.to}; se reenvió a ${to}.)`
        : null,
      "Si no esperabas este correo, ignóralo.",
    ]
      .filter(Boolean)
      .join("\n"),
    html: `
      <div style="font-family:system-ui,sans-serif;font-size:18px;line-height:1.5;color:#172B4D">
        <p>Hola ${escapeHtml(input.contactName)},</p>
        <p>
          <strong>${escapeHtml(input.personName)}</strong> te designó como
          contacto de ayuda en Pulso.
        </p>
        <p>
          <a href="${input.inviteLink}" style="display:inline-block;background:#0D5C63;color:#fff;padding:14px 20px;border-radius:12px;text-decoration:none;font-weight:600">
            Completar mi alta de familiar
          </a>
        </p>
        <p style="color:#4B5563;font-size:16px">
          O copia este enlace:<br/>
          <a href="${input.inviteLink}">${escapeHtml(input.inviteLink)}</a>
        </p>
        ${
          redirected
            ? `<p style="color:#4B5563;font-size:14px">(Demo: destino original ${escapeHtml(input.to)}; enviado a ${escapeHtml(to)}.)</p>`
            : ""
        }
      </div>
    `,
  });

  if (error) {
    return { ok: false as const, error: error.message };
  }
  return {
    ok: true as const,
    providerId: data?.id ?? null,
    to,
    redirected,
  };
}

export async function sendFamilyAlertEmail(input: {
  to: string;
  contactName: string;
  personName: string;
  incidentId: string;
  isSimulation: boolean;
}) {
  const resend = getResend();
  if (!resend) {
    return {
      ok: false as const,
      error: "RESEND_API_KEY no configurada",
    };
  }

  const from =
    process.env.RESEND_FROM_EMAIL || "Pulso <onboarding@resend.dev>";
  const { to, redirected } = resolveRecipient(input.to);
  const link = `${appBaseUrl()}/familiar/alerta/${input.incidentId}`;
  const subject = input.isSimulation
    ? `[PRUEBA] Pulso: ${input.personName} pidió ayuda`
    : `Pulso: ${input.personName} pidió ayuda`;

  const { data, error } = await resend.emails.send({
    from,
    to: [to],
    subject,
    text: [
      input.isSimulation ? "ESTO ES UN SIMULACRO DE PULSO." : null,
      `Hola ${input.contactName},`,
      "",
      `${input.personName} activó una alerta de ayuda en Pulso.`,
      "Abre el enlace para confirmar que recibiste el aviso y registrar qué hiciste.",
      "",
      link,
      "",
      "Si es una emergencia real, llama al 911. Pulso no avisa a autoridades automáticamente.",
      redirected
        ? `(Demo: el contacto en sistema era ${input.to}; se reenvió a ${to}.)`
        : null,
    ]
      .filter(Boolean)
      .join("\n"),
    html: `
      <div style="font-family:system-ui,sans-serif;font-size:18px;line-height:1.5;color:#172B4D">
        ${
          input.isSimulation
            ? `<p style="color:#B42318;font-weight:600">Esto es un simulacro de Pulso.</p>`
            : ""
        }
        <p>Hola ${escapeHtml(input.contactName)},</p>
        <p><strong>${escapeHtml(input.personName)}</strong> activó una alerta de ayuda.</p>
        <p>
          <a href="${link}" style="display:inline-block;background:#0D5C63;color:#fff;padding:14px 20px;border-radius:12px;text-decoration:none;font-weight:600">
            Abrir la alerta
          </a>
        </p>
        <p style="color:#4B5563;font-size:16px">
          Si es una emergencia real, llama al <a href="tel:911">911</a>.
          Pulso no avisa a autoridades automáticamente.
        </p>
      </div>
    `,
  });

  if (error) {
    return { ok: false as const, error: error.message };
  }
  return { ok: true as const, providerId: data?.id ?? null, to };
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Envía correos pendientes de un incidente y actualiza estados. */
export async function dispatchQueuedNotifications(incidentId: string) {
  const incident = await prisma.incident.findUnique({
    where: { id: incidentId },
    include: {
      user: { include: { profile: true } },
      notifications: {
        where: { status: "queued" },
        include: { contact: true },
      },
    },
  });
  if (!incident) return { sent: 0, failed: 0 };

  const personName = incident.user.profile?.displayName || "Tu contacto";
  let sent = 0;
  let failed = 0;

  for (const n of incident.notifications) {
    const result = await sendFamilyAlertEmail({
      to: n.contact.email,
      contactName: n.contact.name,
      personName,
      incidentId: incident.id,
      isSimulation: incident.isSimulation,
    });

    if (result.ok) {
      sent += 1;
      await prisma.notification.update({
        where: { id: n.id },
        data: {
          status: "sent",
          attempts: { increment: 1 },
          providerId: result.providerId,
        },
      });
    } else {
      failed += 1;
      await prisma.notification.update({
        where: { id: n.id },
        data: {
          status: "failed",
          attempts: { increment: 1 },
          providerId: result.error.slice(0, 200),
        },
      });
    }
  }

  return { sent, failed };
}
