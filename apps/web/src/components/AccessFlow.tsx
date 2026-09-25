"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { usePollar } from "@pollar/react";
import type { AuthState } from "@pollar/core";

type StartResponse = { attemptId: string; challenge: string; error?: string };

async function postJson(path: string, body: unknown) {
  const response = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "No se pudo completar la solicitud.");
  return data;
}

export function AccessFlow() {
  const { wallet, isAuthenticated, verified, login, getClient, configStatus, retryConfig, logout } = usePollar();
  const router = useRouter();
  const [step, setStep] = useState<"pollar" | "email">("pollar");
  const [attemptId, setAttemptId] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [pollarEmail, setPollarEmail] = useState("");
  const [pollarCode, setPollarCode] = useState("");
  const [authState, setAuthState] = useState<AuthState>({ step: "idle" });

  useEffect(() => getClient().onAuthStateChange(setAuthState), [getClient]);

  function beginPollar(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    login({ provider: "email", email: pollarEmail.trim().toLowerCase() });
  }

  function verifyPollar(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    getClient().verifyEmailCode(pollarCode);
  }

  async function proveIdentity() {
    if (!wallet?.address || !verified) return;
    setBusy(true);
    setError("");
    try {
      const profile = getClient().getUserProfile();
      const address = profile?.providers.email?.address || profile?.mail;
      if (!address) throw new Error("Pollar no devolvió un correo. Cierra sesión y entra usando correo electrónico.");
      const started: StartResponse = await postJson("/api/auth/start", { email: address, walletAddress: wallet.address });
      const proof = await getClient().stellar.sep53.signMessage(started.challenge);
      if (proof.status !== "signed") throw new Error("No se pudo firmar la comprobación de Pollar.");
      await postJson("/api/auth/prove", { attemptId: started.attemptId, signature: proof.signature, signerAddress: proof.signerAddress });
      setAttemptId(started.attemptId);
      setEmail(address);
      setStep("email");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No pudimos completar la comprobación.");
    } finally {
      setBusy(false);
    }
  }

  async function verifyCode(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result: { next: string } = await postJson("/api/auth/verify", { attemptId, code });
      router.push(result.next);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No pudimos verificar el código.");
    } finally {
      setBusy(false);
    }
  }

  return <div className="info-panel access-card">
    <div className="flow-steps"><span className="active">1. Correo Pollar</span><span className={step === "email" ? "active" : ""}>2. Verificación Pulso</span><span>3. Consentimiento</span></div>
    {step === "pollar" ? <>
      <h2>Entra con tu correo</h2>
      <p>Pollar enviará un código a tu correo. Después Pulso comprobará la sesión y te pedirá consentimiento para el piloto.</p>
      {configStatus === "error" && <p className="form-error">No pudimos cargar Pollar. <button type="button" onClick={retryConfig}>Reintentar</button></p>}
      {!isAuthenticated ? <>
        {authState.step === "entering_code" || authState.step === "verifying_email_code" ? <form className="simple-form" onSubmit={verifyPollar}><label htmlFor="pollar-code">Código enviado a {pollarEmail}</label><input id="pollar-code" autoComplete="one-time-code" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={pollarCode} onChange={event => setPollarCode(event.target.value.replace(/\D/g, ""))} required /><button className="button button-primary" type="submit" disabled={pollarCode.length !== 6 || authState.step === "verifying_email_code"}>{authState.step === "verifying_email_code" ? "Verificando…" : "Confirmar correo con Pollar →"}</button></form> : <form className="simple-form" onSubmit={beginPollar}><label htmlFor="pollar-email">Tu correo electrónico</label><input id="pollar-email" type="email" autoComplete="email" value={pollarEmail} onChange={event => setPollarEmail(event.target.value)} required /><button className="button button-primary" type="submit" disabled={configStatus !== "ready" || authState.step === "sending_email" || authState.step === "creating_session"}>{authState.step === "sending_email" ? "Enviando código…" : "Enviar código con Pollar →"}</button></form>}
        {authState.step === "error" && <p className="form-error" role="alert">Pollar no pudo completar este paso. Revisa el correo o solicita un código nuevo.</p>}
      </> : <div className="flow-ready">
        <strong>{verified ? "Sesión de Pollar confirmada" : "Comprobando sesión de Pollar…"}</strong>
        <p>{wallet?.address ? `Cartera vinculada: ${wallet.address.slice(0, 6)}…${wallet.address.slice(-5)}` : "Preparando tu acceso."}</p>
        <button className="button button-primary" type="button" disabled={!verified || busy} onClick={proveIdentity}>{busy ? "Comprobando…" : "Continuar con Pulso →"}</button>
        <button className="plain-button" type="button" onClick={() => logout()}>Usar otro correo</button>
      </div>}
    </> : <>
      <h2>Confirma tu correo</h2>
      <p>Enviamos un segundo código a <strong>{email}</strong> para vincular tu correo con el registro privado de Pulso.</p>
      <form onSubmit={verifyCode} className="simple-form">
        <label htmlFor="pulso-code">Código de seis dígitos</label>
        <input id="pulso-code" autoComplete="one-time-code" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={code} onChange={event => setCode(event.target.value.replace(/\D/g, ""))} required />
        <button className="button button-primary" type="submit" disabled={busy || code.length !== 6}>{busy ? "Verificando…" : "Verificar y continuar →"}</button>
      </form>
      <p className="form-hint">El código vence en 10 minutos. Si no llega, revisa spam o inicia el acceso de nuevo.</p>
    </>}
    {error && <p className="form-error" role="alert">{error}</p>}
  </div>;
}
