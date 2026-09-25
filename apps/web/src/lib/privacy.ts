/**
 * T02 — Aviso de privacidad, consentimientos y matriz de acceso (piloto Pulso).
 */

export const CONSENT_VERSION = "pulso-kyc-v2";
export const PRIVACY_VERSION = "pulso-privacy-cdmx-v1";
export const PRIVACY_EFFECTIVE = "2026-09-25";

export const PRIVACY_SUMMARY = `
Pulso es un prototipo de alerta familiar para un piloto en Ciudad de México.
No sustituye al 911 ni a servicios médicos.
Tratamos tu nombre, correo, teléfono, domicilio de atención y, si lo autorizas,
datos de bienestar autorreportado.
Solo tus contactos verificados y el equipo del proyecto (con mínimo privilegio)
pueden ver lo necesario para operar alertas.
Puedes pedir acceso, corrección o cancelación al equipo del proyecto.
`.trim();

export type AccessRole = "USER" | "FAMILY" | "ADMIN";

export type AccessRow = {
  data: string;
  user: string;
  family: string;
  admin: string;
};

/** Matriz de acceso (qué ve cada rol en el piloto) */
export const ACCESS_MATRIX: AccessRow[] = [
  {
    data: "Nombre y correo propios",
    user: "Sí",
    family: "Solo de la persona a quien ayuda",
    admin: "Sí (operación)",
  },
  {
    data: "Teléfono y domicilio de atención",
    user: "Sí (propios)",
    family: "Sí, para actuar en alerta",
    admin: "Sí (soporte del piloto)",
  },
  {
    data: "Estado de alertas / incidentes",
    user: "Los propios",
    family: "Los de su red",
    admin: "Todos (auditoría)",
  },
  {
    data: "Chequeo diario / bienestar",
    user: "Sí",
    family: "Solo si la persona autoriza compartir",
    admin: "No por defecto",
  },
  {
    data: "IP del evento (ofuscada/cifrada)",
    user: "No",
    family: "No",
    admin: "Solo auditoría técnica",
  },
  {
    data: "Anclaje Stellar (case_key, commitment, tx)",
    user: "Enlace público sin PII",
    family: "Enlace público sin PII",
    admin: "Sí",
  },
  {
    data: "Secretos / claves de servicio",
    user: "No",
    family: "No",
    admin: "Solo operadores del proyecto",
  },
];

export const PRIVACY_SECTIONS: { title: string; body: string }[] = [
  {
    title: "1. Quiénes somos",
    body: "Pulso es un prototipo académico/hackathon operado por el equipo del proyecto. No somos un servicio de emergencias ni una institución de salud. Correo de contacto del piloto: el administrador del proyecto (cuenta configurada en ADMIN_EMAILS).",
  },
  {
    title: "2. Finalidad",
    body: "Permitir que una persona usuaria avise a familiares de confianza ante una necesidad de ayuda; registrar el estado de la alerta; y, de forma opcional, un chequeo de bienestar autorreportado. El anclaje en Stellar testnet solo guarda un compromiso criptográfico sin datos personales.",
  },
  {
    title: "3. Datos que tratamos",
    body: "Identificación y contacto: nombre, correo, teléfono. Domicilio de atención (colonia/alcaldía). Rol (persona usuaria / familiar). Consentimientos y versión aceptada. Eventos de alerta (hora de recepción, estado, acciones). Opcional: respuestas de bienestar autorreportado. Técnicos: identificadores de sesión, IP ofuscada vinculada al incidente para seguridad.",
  },
  {
    title: "4. Datos sensibles",
    body: "Los datos relacionados con salud o bienestar se tratan como sensibles conforme a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares. Solo se recaban con consentimiento expreso y para las finalidades descritas. No diagnosticamos ni sustituimos atención médica.",
  },
  {
    title: "5. Destinatarios",
    body: "Familiares verificados que la persona invita. Proveedores técnicos necesarios: autenticación (Pollar), correo (Resend), base de datos (Supabase), cadena de prueba (Stellar testnet, sin PII). El equipo administrador del piloto con mínimo privilegio.",
  },
  {
    title: "6. Conservación",
    body: "Durante el piloto y un plazo razonable posterior para auditoría del hackathon (objetivo: no más de 12 meses salvo obligación legal). Puedes solicitar cancelación; algunos registros técnicos de seguridad pueden conservarse ofuscados.",
  },
  {
    title: "7. Derechos ARCO",
    body: "Puedes solicitar acceso, rectificación, cancelación u oposición respecto de tus datos personales escribiendo al equipo del proyecto. Responderemos en plazos razonables del piloto.",
  },
  {
    title: "8. Seguridad",
    body: "Sesiones con cookie httpOnly, separación de roles, mínimos datos en correos, nada de datos personales en la cadena pública. El modo simulacro marca mensajes como prueba.",
  },
  {
    title: "9. No somos el 911",
    body: "Una alerta en Pulso no implica que autoridades hayan sido notificadas. La decisión de llamar al 911 es humana y familiar. En CDMX el 911 atiende urgencias las 24 horas.",
  },
  {
    title: "10. Cambios",
    body: `Versión ${PRIVACY_VERSION}, vigente ${PRIVACY_EFFECTIVE}. Si cambia el aviso, pediremos nuevo consentimiento cuando el producto lo requiera.`,
  },
];
