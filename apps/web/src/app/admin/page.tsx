import { redirect } from "next/navigation";
import { requireSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { AppHeader } from "@/components/SiteChrome";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await requireSession(["ADMIN"]);
  if (!session) redirect("/");
  const [users, incidents, devices, contacts] = await Promise.all([prisma.user.count(), prisma.incident.count(), prisma.device.count(), prisma.contact.count({ where: { verifiedAt: { not: null } } })]);
  const recentUsers = await prisma.user.findMany({ orderBy: { createdAt: "desc" }, take: 10, include: { profile: true } });
  return <><AppHeader role="ADMIN" name={session.displayName || "Administración"} /><main id="contenido" className="app-main"><div className="shell panel-shell"><div className="panel-top"><div><p className="eyebrow">CENTRO DE OPERACIONES</p><h1>Estado del <em>piloto.</em></h1><p className="inner-lead">Actividad general para operar la demostración sin mostrar respuestas clínicas ni domicilios.</p></div></div><section className="panel-stats" aria-label="Resumen del piloto"><div><span>Cuentas</span><strong>{users}</strong><small>identidades registradas</small></div><div><span>Vínculos</span><strong>{contacts}</strong><small>familiares verificados</small></div><div><span>Incidentes</span><strong>{incidents}</strong><small>alertas registradas</small></div><div><span>Dispositivos</span><strong>{devices}</strong><small>equipos vinculados</small></div></section><div className="panel-grid admin-grid"><section className="info-panel"><div className="panel-heading"><div><span className="panel-kicker">ACTIVIDAD</span><h2>Cuentas recientes</h2></div><span className="count-badge">{recentUsers.length}</span></div><ul className="panel-list">{recentUsers.map(u => <li key={u.id}><div className="person-row"><span className="person-avatar">{(u.profile?.displayName || u.email).slice(0,1).toUpperCase()}</span><div><strong>{u.profile?.displayName || "Cuenta sin alta"}</strong><span>{u.email}</span></div></div><span className="status-pill">{u.role}</span></li>)}</ul></section><section className="info-panel"><span className="panel-kicker">ALCANCE DE LA VISTA</span><h2>Privacidad operativa</h2><p>El panel presenta conteos, roles y estado del piloto. Las respuestas detalladas de salud y los domicilios quedan fuera de esta vista.</p><div className="service-list"><div className="privacy-callout"><span>✓</span><p><strong>Datos mínimos</strong><br />Solo lo necesario para coordinar el piloto.</p></div><div className="privacy-callout"><span>✓</span><p><strong>Stellar</strong><br />Guarda pruebas de integridad, no datos personales.</p></div></div></section></div></div></main></>;
}
