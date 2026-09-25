"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ContactForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState("");
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setBusy(true);
    setError("");
    setResult("");
    try {
      const response = await fetch("/api/contacts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.fromEntries(data)) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "No pudimos invitar al contacto.");
      setResult(body.emailSent ? "Invitación enviada. Quedará activa cuando tu familiar verifique su correo y acepte." : `Contacto guardado. Comparte este enlace con tu familiar: ${body.inviteUrl}`);
      form.reset();
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Intenta de nuevo.");
    } finally {
      setBusy(false);
    }
  }
  return <form className="simple-form" onSubmit={submit}><h3>Invitar a una persona</h3><label htmlFor="contact-name">Nombre</label><input id="contact-name" name="name" autoComplete="name" minLength={2} maxLength={80} required /><label htmlFor="contact-email">Correo</label><input id="contact-email" name="email" type="email" autoComplete="email" required /><label htmlFor="relationship">Vínculo contigo</label><input id="relationship" name="relationship" placeholder="Por ejemplo, hija o cuidador" minLength={2} maxLength={50} required /><button className="button button-primary" type="submit" disabled={busy}>{busy ? "Guardando…" : "Enviar invitación →"}</button>{error && <p className="form-error" role="alert">{error}</p>}{result && <p className="notice" role="status">{result}</p>}</form>;
}
