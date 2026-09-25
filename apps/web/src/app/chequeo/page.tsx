import { redirect } from "next/navigation";
import Link from "next/link";
import { requireSession } from "@/lib/session";
import { AppHeader } from "@/components/SiteChrome";
import { ChequeoClient } from "./ChequeoClient";

export const dynamic = "force-dynamic";

export default async function ChequeoPage() {
  const session = await requireSession(["USER"]);
  if (!session) redirect("/entrar");
  return <><AppHeader role="USER" name={session.displayName || "Mi cuenta"} /><main id="contenido" className="app-main"><div className="shell task-shell"><p className="eyebrow">BIENESTAR COTIDIANO</p><h1>Tu chequeo de <em>hoy.</em></h1><p className="inner-lead">Responde una pregunta a la vez. Puedes omitir el chequeo; tu score describe cómo te sientes y no es un diagnóstico.</p><div className="notice"><strong>Tú tienes el control.</strong> Las respuestas solo se comparten según el alcance que elijas.</div><section className="info-panel task-card"><ChequeoClient /></section><Link href="/inicio" className="back-link task-back">← Volver a mi inicio</Link></div></main></>;
}
