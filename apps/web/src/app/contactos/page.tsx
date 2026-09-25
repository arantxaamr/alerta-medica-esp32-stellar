import { redirect } from "next/navigation";
import { requireSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { AppHeader } from "@/components/SiteChrome";
import { ContactosClient } from "./ContactosClient";

export const dynamic = "force-dynamic";

export default async function ContactosPage({ searchParams }: { searchParams: Promise<{ alta?: string }> }) {
  const session = await requireSession(["USER", "ADMIN"]);
  if (!session) redirect("/entrar");
  const profile = await prisma.profile.findUnique({ where: { userId: session.userId } });
  if (profile?.kycStatus !== "completed") redirect("/alta");
  const sp = await searchParams;
  return <><AppHeader role={session.role} name={profile.displayName || session.displayName || "Mi cuenta"} /><main id="contenido" className="app-main"><div className="shell task-shell"><p className="eyebrow">PASO 2 · RED DE APOYO</p><h1>Personas en quienes <em>confías.</em></h1><p className="inner-lead">Invita a familiares o personas cuidadoras. Cada una deberá entrar con su correo, completar su alta y aceptar el vínculo.</p>{sp.alta === "1" && <div className="success-banner"><span>✓</span><div><strong>Tu alta quedó completa</strong><p>Ahora agrega a la primera persona de tu red de apoyo.</p></div></div>}<section className="info-panel task-card"><ContactosClient showAltaHint={sp.alta === "1"} /></section></div></main></>;
}
