"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";

type IncidentView = {
  id: string;
  status: string;
  isSimulation: boolean;
  openedAtUtc: string;
  ui: {
    systemReceived: boolean;
    familyNotify: "queued" | "sent" | "failed" | "done";
    familyAck: boolean;
  };
  notifications: { status: string; contactName?: string }[];
};

type Phase = "idle" | "sending" | "ready" | "error";

function Step({
  done,
  pending,
  label,
}: {
  done: boolean;
  pending?: boolean;
  label: string;
}) {
  const mark = done ? "✓" : pending ? "…" : "○";
  return (
    <li className="flex gap-2 text-lg text-text">
      <span className="w-6 shrink-0" aria-hidden>
        {mark}
      </span>
      <span>{label}</span>
    </li>
  );
}

export default function AyudaPage() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [incident, setIncident] = useState<IncidentView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const started = useRef(false);

  const sendAlert = useCallback(() => {
    if (started.current) return;
    started.current = true;
    setPhase("sending");
    setError(null);

    startTransition(async () => {
      try {
        const res = await fetch("/api/incidents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });
        const data = await res.json();
        if (!res.ok || !data.accepted) {
          throw new Error(data.error || "No pudimos confirmar el envío");
        }
        setIncident(data.incident);
        setPhase("ready");
      } catch (e) {
        started.current = false;
        setPhase("error");
        setError(e instanceof Error ? e.message : "Error desconocido");
      }
    });
  }, []);

  useEffect(() => {
    sendAlert();
  }, [sendAlert]);

  useEffect(() => {
    if (!incident?.id || phase !== "ready") return;
    const t = setInterval(async () => {
      try {
        const res = await fetch(`/api/incidents/${incident.id}`);
        if (!res.ok) return;
        const data = await res.json();
        setIncident(data.incident);
      } catch {
        /* ignore poll errors */
      }
    }, 4000);
    return () => clearInterval(t);
  }, [incident?.id, phase]);

  const busy = phase === "sending" || isPending;

  return (
    <main className="mx-auto w-full max-w-lg px-4 py-8">
      <h1 className="text-[28px] font-semibold text-text">
        {phase === "error"
          ? "No pudimos confirmar el envío"
          : phase === "ready"
            ? "Alerta enviada"
            : "Estamos enviando tu alerta…"}
      </h1>

      {phase === "error" ? (
        <p className="mt-4 text-text-secondary" role="alert">
          {error}. Intenta de nuevo o llama al 911.
        </p>
      ) : (
        <ul className="mt-6 space-y-3">
          <Step
            done={Boolean(incident?.ui.systemReceived)}
            pending={busy}
            label={
              incident
                ? `Recibida por el sistema · ${incident.id.slice(0, 8)}…`
                : "Recibida por el sistema"
            }
          />
          <Step
            done={
              incident?.ui.familyNotify === "sent" ||
              incident?.ui.familyNotify === "done"
            }
            pending={incident?.ui.familyNotify === "queued"}
            label={
              incident?.ui.familyNotify === "queued"
                ? "Familiares: aviso en cola"
                : incident?.ui.familyNotify === "sent" ||
                    incident?.ui.familyNotify === "done"
                  ? "Familiares: correo enviado"
                  : incident?.ui.familyNotify === "failed"
                    ? "Familiares: no se pudo enviar el correo"
                    : "Familiares: aviso en proceso"
            }
          />
          <Step
            done={Boolean(incident?.ui.familyAck)}
            label="Familiar: pendiente de confirmar"
          />
        </ul>
      )}

      <div className="mt-8 flex flex-col gap-3">
        <a
          href="tel:911"
          className="flex min-h-[52px] items-center justify-center rounded-xl bg-danger px-4 font-semibold text-white"
        >
          Llamar al 911
        </a>
        {phase === "error" ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              started.current = false;
              sendAlert();
            }}
            className="flex min-h-[52px] items-center justify-center rounded-xl bg-primary px-4 font-medium text-white disabled:opacity-60"
          >
            Intentar de nuevo
          </button>
        ) : null}
        <Link
          href="/inicio"
          className="flex min-h-[52px] items-center justify-center rounded-xl border border-border px-4 font-medium text-text"
        >
          Volver al inicio
        </Link>
      </div>

      <p className="mt-6 text-sm text-text-secondary">
        {incident?.isSimulation !== false
          ? "Simulacro: no sustituye al 911."
          : "Si puedes, llama también al 911."}
      </p>
    </main>
  );
}
