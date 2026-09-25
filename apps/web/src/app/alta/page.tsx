import { redirect } from "next/navigation";
import { requireSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { AppHeader } from "@/components/SiteChrome";
import { AltaUserForm } from "./AltaUserForm";

export const dynamic = "force-dynamic";

export default async function AltaPage() {
  const session = await requireSession(["USER"]);
  if (!session) redirect("/entrar");
  const profile = await prisma.profile.findUnique({ where: { userId: session.userId } });
  if (profile?.kycStatus === "completed") redirect("/contactos?alta=1");
  return <><AppHeader role="USER" name={session.displayName || "Nueva cuenta"} /><main id="contenido" className="app-main"><div className="shell onboarding-shell"><div className="onboarding-intro"><p className="eyebrow">PASO 1 DE 2 · ALTA PERSONAL</p><h1>Conozcamos a la persona que <em>recibirá apoyo.</em></h1><p className="inner-lead">Estos datos permiten que la red elegida entienda a quién acompaña. Revisa cada consentimiento antes de continuar.</p><div className="privacy-points"><div><span>✓</span><p><strong>Uso limitado</strong><br />Solo para operar el piloto y sus alertas.</p></div><div><span>✓</span><p><strong>Fuera de Stellar</strong><br />Nombre, domicilio y salud no se publican en la cadena.</p></div><div><span>✓</span><p><strong>Control de la persona</strong><br />Cada vínculo familiar requiere aceptación.</p></div></div></div><section className="auth-form-column onboarding-form"><div className="auth-form-header"><span className="secure-badge">● DATOS PROTEGIDOS</span><p>Alta propia de Pulso</p></div><AltaUserForm /></section></div></main></>;
}
