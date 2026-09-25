import Link from "next/link";
import { redirect } from "next/navigation";
import { AccessFlow } from "@/components/AccessFlow";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { currentUser } from "@/lib/auth";
import { PollarShell } from "@/components/PollarShell";
import { prisma } from "@/lib/prisma";

export default async function AccesoPage() {
  let databaseAvailable = true;
  let user = null;
  try { user = await currentUser(); await prisma.authAttempt.findFirst({ select: { id: true } }); } catch { databaseAvailable = false; }
  if (user) redirect(user.profile?.consentAcceptedAt ? "/panel" : "/bienvenida");
  return <><SiteHeader /><main id="contenido" className="auth-page"><div className="shell auth-layout"><section className="auth-story"><Link className="back-link" href="/">← Volver a Pulso</Link><p className="eyebrow">ACCESO AL PILOTO</p><h1>Tu red empieza <em>aquí.</em></h1><p className="inner-lead">Un mismo acceso, tres experiencias distintas según tu vínculo con Pulso.</p><div className="role-preview"><article><span>01</span><div><strong>Persona usuaria</strong><p>Organiza su red y prepara el botón de casa.</p></div></article><article><span>02</span><div><strong>Familiar o cuidador</strong><p>Acepta invitaciones y acompaña a distancia.</p></div></article><article><span>03</span><div><strong>Administración</strong><p>Supervisa el piloto sin consultar datos clínicos.</p></div></article></div><div className="security-note"><span>✓</span><p><strong>Tu rol no se elige manualmente.</strong> Pulso lo asigna por invitación o correo autorizado.</p></div></section><section className="auth-form-column"><div className="auth-form-header"><span className="secure-badge">● CONEXIÓN SEGURA</span><p>Acceso con código por correo</p></div>{!databaseAvailable && <div className="form-error" role="status">La base de datos no responde desde este equipo. Puedes explorar la página, pero aún no se puede completar el registro.</div>}{process.env.NEXT_PUBLIC_POLLAR_PUBLISHABLE_KEY ? <PollarShell apiKey={process.env.NEXT_PUBLIC_POLLAR_PUBLISHABLE_KEY}><AccessFlow /></PollarShell> : <div className="notice">Pollar aún no está configurado en este entorno. Añade la clave publicable en <code>.env.local</code>.</div>}<p className="auth-emergency">¿Es una emergencia real? <a href="tel:911">Llama al 911</a>. Pulso aún no envía alertas operativas.</p></section></div></main><SiteFooter /></>;
}
