import { redirect } from "next/navigation";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { WelcomeForm } from "@/components/WelcomeForm";
import { currentUser } from "@/lib/auth";

export default async function BienvenidaPage() {
  const user = await currentUser();
  if (!user) redirect("/acceso");
  if (user.profile?.consentAcceptedAt) redirect("/panel");
  return <><SiteHeader /><main id="contenido" className="auth-page"><div className="shell consent-layout"><section className="auth-story"><p className="eyebrow">UN PASO MÁS</p><h1>Antes de cuidar, <em>nos conocemos.</em></h1><p className="inner-lead">Revisa qué guardaremos y cómo funciona tu participación en el piloto de Ciudad de México.</p><ul className="privacy-points"><li><span>✓</span><div><strong>Datos mínimos</strong><p>Nombre, correo, rol y vínculos que aceptes.</p></div></li><li><span>✓</span><div><strong>Privado por diseño</strong><p>Tu información personal no se publica en Stellar.</p></div></li><li><span>✓</span><div><strong>Tú decides</strong><p>Cada familiar acepta su vínculo de forma individual.</p></div></li></ul></section><WelcomeForm email={user.email} role={user.role} /></div></main><SiteFooter /></>;
}
