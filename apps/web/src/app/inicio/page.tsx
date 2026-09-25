import Link from "next/link";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { AppHeader } from "@/components/SiteChrome";
import { InstallHint } from "@/components/InstallHint";
import { localDayCDMX } from "@/lib/checkin";

export const dynamic = "force-dynamic";

export default async function InicioPage() {
  const session = await requireSession(["USER"]);
  if (!session) redirect("/entrar");
  const profile = await prisma.profile.findUnique({ where: { userId: session.userId } });
  if (profile?.kycStatus !== "completed") redirect("/alta");
  const [verifiedFamily, openIncident, todayCheckin] = await Promise.all([
    prisma.contact.count({ where: { userId: session.userId, kycStatus: "completed", verifiedAt: { not: null } } }),
    prisma.incident.findFirst({ where: { userId: session.userId, status: { in: ["created", "family_acknowledged", "contacting"] } }, orderBy: { openedAtUtc: "desc" } }),
    prisma.dailyCheckin.findUnique({ where: { userId_localDay: { userId: session.userId, localDay: localDayCDMX() } } }),
  ]);
  const name = profile?.displayName || session.displayName || "Persona usuaria";
  return <><AppHeader role="USER" name={name} /><main id="contenido" className="app-main"><div className="shell panel-shell"><div className="panel-top"><div><p className="eyebrow">TU ESPACIO PULSO</p><h1>Hola, <em>{name}.</em></h1><p className="inner-lead">{openIncident ? "Hay una alerta activa y tu red puede consultar su estado." : verifiedFamily > 0 ? "Tu red de apoyo está preparada para acompañarte." : "Completa tu red antes de iniciar las pruebas de alerta."}</p></div></div><div className="pilot-banner"><span className="pilot-dot" /><div><strong>Modo de demostración</strong><p>Las alertas del piloto se identifican como simulaciones y no llaman automáticamente al 911.</p></div><span className="status-pill pending">Piloto CDMX</span></div><section className="home-alert-card"><div><span className="panel-kicker">ACCIÓN PRINCIPAL</span><h2>{openIncident ? "Tienes una alerta en seguimiento" : "¿Necesitas apoyo de tu red?"}</h2><p>Antes de enviar, Pulso te pedirá confirmar. Tus familiares verificados recibirán el aviso.</p></div><Link href="/ayuda" className="home-sos-button">{openIncident ? "Ver alerta activa" : "Necesito ayuda"} <span>→</span></Link></section><div className="panel-grid"><section className="info-panel"><div className="panel-heading"><div><span className="panel-kicker">TU RED</span><h2>Preparación del hogar</h2></div><span className="count-badge">{verifiedFamily}</span></div><ul className="progress-list"><li className="done"><span>✓</span><div><strong>Alta completada</strong><small>Datos y consentimientos registrados</small></div></li><li className={verifiedFamily > 0 ? "done" : "current"}><span>{verifiedFamily > 0 ? "✓" : "2"}</span><div><strong>Familiar verificado</strong><small>{verifiedFamily > 0 ? "Tu red puede recibir alertas" : "Invita al menos a una persona"}</small></div></li><li><span>3</span><div><strong>Botón ESP32</strong><small>Integración física en la última etapa</small></div></li></ul><Link href="/contactos" className="button button-outline full-button">{verifiedFamily > 0 ? "Administrar mi red" : "Invitar a un familiar"} →</Link></section><section className="info-panel"><div className="panel-heading"><div><span className="panel-kicker">BIENESTAR DIARIO</span><h2>{todayCheckin ? "Chequeo completado" : "¿Cómo te sientes hoy?"}</h2></div>{todayCheckin?.score0100 != null && <span className="score-badge">{todayCheckin.score0100}</span>}</div><p>{todayCheckin ? "Tu respuesta de hoy quedó guardada. Puedes revisarla con calma mañana." : "Cinco preguntas breves pueden ayudarte a reconocer cambios y conversar con tu familia."}</p><Link href="/chequeo" className="button button-primary full-button">{todayCheckin ? "Ver mi chequeo" : "Hacer mi chequeo"} →</Link></section></div><div className="install-wrap"><InstallHint /></div></div></main></>;
}
