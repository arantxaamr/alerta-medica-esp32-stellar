"use client";

import { useEffect, useState } from "react";
import { usePollar } from "@pollar/react";
import type { AuthState } from "@pollar/core";

function PollarEmailLogin() {
  const {
    getClient,
    isAuthenticated,
    logout,
    configStatus,
    retryConfig,
  } = usePollar();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    const client = getClient();
    return client.onAuthStateChange((state: AuthState) => {
      if (state.step === "entering_code") {
        setStep("code");
        if (state.email) setEmail(state.email);
        setPending(false);
        setInfo("Código enviado. Revisa tu correo.");
        setError(null);
      } else if (state.step === "sending_email") {
        setPending(true);
        setInfo("Enviando código…");
        if (state.email) setEmail(state.email);
      } else if (state.step === "verifying_email_code") {
        setPending(true);
        setInfo("Verificando código…");
      } else if (state.step === "error") {
        setPending(false);
        setError(state.message || "No se pudo completar el acceso");
        setInfo(null);
        if (state.email) setEmail(state.email);
      } else if (state.step === "authenticated" || state.step === "idle") {
        setPending(false);
      }
    });
  }, [getClient]);

  if (isAuthenticated) {
    return (
      <section className="space-y-3 rounded-xl border border-border bg-surface p-4">
        <p className="text-success">Ya tienes sesión Pollar activa.</p>
        <p className="text-sm text-text-secondary">
          Te llevamos al panel en un momento. Si quieres usar otro correo, cierra
          sesión primero.
        </p>
        <button
          type="button"
          onClick={() => {
            logout();
            setStep("email");
            setCode("");
            setError(null);
            setInfo(null);
          }}
          className="flex min-h-[52px] w-full items-center justify-center rounded-xl border border-border px-4 font-medium text-text"
        >
          Usar otro correo
        </button>
      </section>
    );
  }

  if (configStatus === "loading") {
    return (
      <p className="rounded-xl border border-border bg-surface p-4 text-text-secondary">
        Cargando acceso…
      </p>
    );
  }

  if (configStatus === "error") {
    return (
      <section className="space-y-3 rounded-xl border border-border bg-surface p-4">
        <p className="text-danger">No se pudo cargar Pollar.</p>
        <button
          type="button"
          onClick={() => retryConfig()}
          className="flex min-h-[52px] w-full items-center justify-center rounded-xl bg-primary px-4 font-medium text-white"
        >
          Reintentar
        </button>
      </section>
    );
  }

  return (
    <section className="space-y-3 rounded-xl border border-border bg-surface p-4">
      <h2 className="text-lg font-semibold text-text">Entrar con correo</h2>
      <p className="text-sm text-text-secondary">
        Para la persona usuaria o el familiar. Te enviamos un código de 6 dígitos.
      </p>

      {step === "email" ? (
        <>
          <label className="block text-sm text-text-secondary" htmlFor="email">
            Correo
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="min-h-[52px] w-full rounded-xl border border-border px-3 text-text"
            placeholder="tu@correo.com"
            autoComplete="email"
            disabled={pending}
          />
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              if (!email.includes("@")) {
                setError("Escribe un correo válido");
                return;
              }
              setError(null);
              setInfo(null);
              setPending(true);
              try {
                getClient().login({
                  provider: "email",
                  email: email.trim(),
                });
              } catch (e) {
                setPending(false);
                setError(
                  e instanceof Error ? e.message : "No se pudo enviar el código",
                );
              }
            }}
            className="flex min-h-[52px] w-full items-center justify-center rounded-xl bg-primary px-4 font-medium text-white disabled:opacity-60"
          >
            {pending ? "Enviando…" : "Enviar código"}
          </button>
        </>
      ) : (
        <>
          <p className="text-sm text-text-secondary">
            Código enviado a <strong className="text-text">{email}</strong>
          </p>
          <label className="block text-sm text-text-secondary" htmlFor="otp">
            Código de 6 dígitos
          </label>
          <input
            id="otp"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={code}
            onChange={(e) =>
              setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
            }
            className="min-h-[52px] w-full rounded-xl border border-border px-3 text-center text-2xl tracking-[0.4em] text-text"
            placeholder="••••••"
            disabled={pending}
          />
          <button
            type="button"
            disabled={pending || code.length !== 6}
            onClick={() => {
              setError(null);
              setPending(true);
              try {
                getClient().verifyEmailCode(code);
              } catch (e) {
                setPending(false);
                setError(
                  e instanceof Error
                    ? e.message
                    : "No se pudo verificar el código",
                );
              }
            }}
            className="flex min-h-[52px] w-full items-center justify-center rounded-xl bg-primary px-4 font-medium text-white disabled:opacity-60"
          >
            {pending ? "Verificando…" : "Verificar e entrar"}
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              getClient().cancelLogin();
              setStep("email");
              setCode("");
              setError(null);
              setInfo(null);
              setPending(false);
            }}
            className="flex min-h-[44px] w-full items-center justify-center text-sm text-text-secondary underline"
          >
            Usar otro correo
          </button>
        </>
      )}

      {info ? <p className="text-sm text-success">{info}</p> : null}
      {error ? (
        <p className="text-danger" role="alert">
          {error}
        </p>
      ) : null}
    </section>
  );
}

export function LoginForm({ pollarEnabled }: { pollarEnabled: boolean }) {
  return (
    <div className="space-y-6">
      {pollarEnabled ? (
        <PollarEmailLogin />
      ) : (
        <p className="rounded-xl border border-border bg-surface p-4 text-text-secondary">
          Falta configurar <code>NEXT_PUBLIC_POLLAR_PUBLISHABLE_KEY</code> en{" "}
          <a
            className="text-primary underline"
            href="https://dashboard.pollar.xyz"
            target="_blank"
            rel="noreferrer"
          >
            dashboard.pollar.xyz
          </a>
          .
        </p>
      )}
    </div>
  );
}
