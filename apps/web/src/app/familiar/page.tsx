import Link from "next/link";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { AppHeader } from "@/components/SiteChrome";
import { FamiliarCheckins } from "./FamiliarCheckins";

export const dynamic = "force-dynamic";
const statusLabel: Record<string, string> = { created: "Nueva", family_acknowledged: "Atendida", contacting: "En seguimiento", resolved: "Resuelta", false_alarm: "Falsa alarma" };

export default async function FamiliarHomePage() {
  const session = await requireSession(["FAMILY", "ADMIN"]);
  if (!session) redirect("/entrar");
  const incidents = await prisma.incident.findMany({ where: { OR: [{ notifications: { some: { contact: { email: session.email } } } }, { user: { email: "ana.demo@pulso.local" } }] }, orderBy: { openedAtUtc: "desc" }, take: 20, include: { user: { include: { profile: true } } } });
  const active = incidents.filter(i => ["created","family_acknowledged","contacting"].includes(i.status)).length;
  return <><AppHeader role="FAMILY" name={session.displayName || "Familiar"} /><main id="contenido" className="app-main"><div className="shell panel-shell"><div className="panel-top"><div><p className="eyebrow">RED FAMILIAR</p><h1>Acompañar con <em>claridad.</em></h1><p className="inner-lead">Consulta las alertas de tu red y deja visible quién asumió la respuesta.</p></div></div><div className="pilot-banner"><span className={active ? "alert-dot" : "pilot-dot"} /><div><strong>{active ? active + " alerta" + (active === 1 ? " activa" : "s activas") : "Tu red está tranquila"}</strong><p>Ante una urgencia, la persona que responde debe llamar al 911 directamente.</p></div><Link href="/protocolo" className="text-link">Ver protocolo →</Link></div><div className="panel-grid family-dashboard"><section className="info-panel"><div className="panel-heading"><div><span className="panel-kicker">ACTIVIDAD RECIENTE</span><h2>Alertas de tu red</h2></div><span className="count-badge">{incidents.length}</span></div>{incidents.length === 0 ? <div className="empty-state"><span>♡</span><h3>No hay alertas todavía</h3><p>Cuando alguien de tu red pida ayuda, aparecerá aquí.</p></div> : <ul className="incident-list">{incidents.map(i => <li key={i.id}><Link href={"/familiar/alerta/" + i.id}><span className={["resolved","false_alarm"].includes(i.status) ? "incident-mark quiet" : "incident-mark"}>!</span><div><strong>{i.user.profile?.displayName || i.user.email}</strong><small>{i.openedAtUtc.toLocaleString("es-MX", { timeZone: "America/Mexico_City" })}</small></div><span className={["resolved","false_alarm"].includes(i.status) ? "status-pill" : "status-pill pending"}>{statusLabel[i.status] || i.status}</span></Link></li>)}</ul>}</section><section className="info-panel"><span className="panel-kicker">BIENESTAR COMPARTIDO</span><h2>Chequeos de la red</h2><FamiliarCheckins /></section></div></div></main></>;
}
