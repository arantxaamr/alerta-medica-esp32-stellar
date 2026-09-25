"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function InvitationActions({ contactId }: { contactId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [acceptsResponsibilities, setAcceptsResponsibilities] = useState(false);
  async function respond(decision: "accept" | "decline") {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/contacts/respond", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contactId, decision, acceptsResponsibilities }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No pudimos guardar tu respuesta.");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Intenta de nuevo.");
    } finally {
      setBusy(false);
    }
  }
  return <div className="invite-actions"><label className="check-label"><input type="checkbox" checked={acceptsResponsibilities} onChange={event => setAcceptsResponsibilities(event.target.checked)} /> Acepto recibir avisos de esta persona y entiendo que podría necesitar llamar al 911.</label><div><button type="button" className="button button-primary" disabled={busy || !acceptsResponsibilities} onClick={() => respond("accept")}>Aceptar vínculo</button><button type="button" className="plain-button" disabled={busy} onClick={() => respond("decline")}>Rechazar</button></div>{error && <span className="form-error" role="alert">{error}</span>}</div>;
}
