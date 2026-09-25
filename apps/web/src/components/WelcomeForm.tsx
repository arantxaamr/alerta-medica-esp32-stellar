"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function WelcomeForm({ email, role }: { email: string; role: string }) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [acceptsPrivacy, setAcceptsPrivacy] = useState(false);
  const [understands911, setUnderstands911] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/onboarding", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ displayName, acceptsPrivacy, understands911 }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No pudimos guardar tus datos.");
      router.push(data.next);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Intenta nuevamente.");
    } finally {
      setBusy(false);
    }
  }
  return <form className="info-panel simple-form" onSubmit={submit}>
    <div className="flow-steps"><span className="active">1. Correo Pollar</span><span className="active">2. Verificación Pulso</span><span className="active">3. Consentimiento</span></div>
    <h2>Confirma cómo participarás</h2>
    <p>Correo verificado: <strong>{email}</strong></p>
    <p>Acceso: <strong>{role === "ADMIN" ? "Administración" : role === "FAMILY" ? "Familiar invitado" : "Persona usuaria"}</strong>. El rol se asigna según el correo autorizado o una invitación; no se elige libremente.</p>
    <label htmlFor="display-name">¿Cómo quieres que te llamemos?</label>
    <input id="display-name" name="displayName" autoComplete="name" minLength={2} maxLength={80} value={displayName} onChange={event => setDisplayName(event.target.value)} required />
    <div className="consent-box"><h3>Consentimiento del piloto CDMX</h3><p>Pulso guardará tu correo, nombre, rol y la red de apoyo que aceptes. Si eres la persona usuaria, podrás agregar contactos y más adelante registrar chequeos diarios. Tus datos no se publicarán en Stellar. La persona familiar solo verá información vinculada a una invitación aceptada. Puedes pedir que se eliminen tus datos al equipo del piloto.</p><label className="check-label"><input type="checkbox" checked={acceptsPrivacy} onChange={event => setAcceptsPrivacy(event.target.checked)} required /> Acepto participar y autorizo este tratamiento de datos para la demostración.</label><label className="check-label"><input type="checkbox" checked={understands911} onChange={event => setUnderstands911(event.target.checked)} required /> Entiendo que Pulso aún no envía alertas reales ni sustituye una llamada al 911.</label></div>
    {role === "FAMILY" && <p className="form-hint">Después podrás revisar cada invitación y aceptar o rechazar el vínculo por separado.</p>}
    <button className="button button-primary" type="submit" disabled={busy || !acceptsPrivacy || !understands911}>{busy ? "Guardando…" : "Aceptar y entrar →"}</button>
    {error && <p className="form-error" role="alert">{error}</p>}
  </form>;
}
