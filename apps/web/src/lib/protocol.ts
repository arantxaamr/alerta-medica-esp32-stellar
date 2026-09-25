/**
 * T01 — Protocolo familiar del piloto Pulso (CDMX).
 * Decisiones operativas cerradas para el MVP de demostración.
 */

export const PROTOCOL_VERSION = "pulso-protocol-cdmx-v1";

/** Alcance del piloto */
export const PILOT = {
  city: "Ciudad de México",
  mode: "simulacro" as const,
  timezone: "America/Mexico_City",
  maxUsers: 5,
  maxContactsPerUser: 3,
  note:
    "Prototipo de hackathon. No hay convenio con autoridades. Un familiar humano llama al 911 cuando corresponda.",
};

/**
 * Tiempo máximo para que el familiar principal confirme recepción.
 * Si no confirma, se pide avisar al suplente (protocolo humano; el sistema ya
 * puede haber notificado a ambos si están verificados).
 */
export const ACK_TIMEOUT_MINUTES = 15;

export const ROLES = {
  principal: {
    id: "principal",
    label: "Familiar principal",
    duties: [
      "Confirmar en Pulso que recibió la alerta",
      "Intentar contactar a la persona usuaria por teléfono",
      "Si hay indicios de urgencia, llamar al 911",
      "Registrar en Pulso el cierre o la falsa alarma",
    ],
  },
  suplente: {
    id: "suplente",
    label: "Familiar suplente",
    duties: [
      "Estar listo si el principal no confirma en 15 minutos",
      "Confirmar recepción y seguir el mismo protocolo de llamada",
      "Coordinarse con el principal para no llamar al 911 dos veces sin necesidad",
    ],
  },
} as const;

/** Pasos ordenados cuando llega una alerta */
export const ALERT_STEPS = [
  {
    id: "ack",
    title: "Confirma que recibiste el aviso",
    detail: "Pulsa «Confirmo que recibí la alerta» en Pulso lo antes posible.",
  },
  {
    id: "call_person",
    title: "Llama a la persona usuaria",
    detail:
      "Usa el teléfono que conoces. Pregunta cómo está y si necesita ayuda presencial.",
  },
  {
    id: "assess",
    title: "Decide si hay urgencia",
    detail:
      "Si no responde, hay signos graves, o ella lo pide: llama al 911. Pulso no avisa a autoridades por sí solo.",
  },
  {
    id: "911",
    title: "Si llamas al 911",
    detail:
      "Da domicilio de atención y situación. Anota el folio solo si te lo dan. No inventes un folio.",
  },
  {
    id: "close",
    title: "Cierra la alerta en Pulso",
    detail:
      "Usa «Cerrar alerta (atendida)» o «Marcar falsa alarma» para dejar constancia.",
  },
] as const;

/** Mensajes aprobados (tono producto) */
export const APPROVED_MESSAGES = {
  productTagline: "Tu red de apoyo en un toque",
  not911:
    "Pulso no sustituye al 911 ni a atención médica. Un familiar designado decide si llama al 911.",
  simulationBanner:
    "Simulacro — no es una emergencia real del sistema.",
  emailSubjectOpen: (personName: string, simulation: boolean) =>
    simulation
      ? `[PRUEBA] Pulso: ${personName} pidió ayuda`
      : `Pulso: ${personName} pidió ayuda`,
  familyCta: "Confirmar que recibí la alerta",
  userCta: "Necesito ayuda",
  escalateHuman: `Si el familiar principal no confirma en ${ACK_TIMEOUT_MINUTES} minutos, contacta al suplente y, si hay urgencia, llama al 911.`,
} as const;

export function protocolSummaryLines(): string[] {
  return [
    `Piloto: ${PILOT.city} · modo ${PILOT.mode}.`,
    `Familiar principal confirma en ≤ ${ACK_TIMEOUT_MINUTES} min; si no, interviene el suplente.`,
    APPROVED_MESSAGES.not911,
    PILOT.note,
  ];
}
