"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";

type IncidentView = {
  id: string;
  status: string;
  isSimulation: boolean;
  openedAtUtc: string;
  ui: { familyAck: boolean };
};

export default function FamiliarAlertaPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [incident, setIncident] = useState<IncidentView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [isPending, startTransition] = useTransition();

  const load = useCallback(async () => {
    const res = await fetch(`/api/incidents/${id}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "No se encontró la alerta");
    setIncident(data.incident);
    if (data.incident.ui.familyAck) setDone(true);
  }, [id]);

  useEffect(() => {
    load().catch((e) => setError(e instanceof Error ? e.message : "Error"));
  }, [load]);

  function ack() {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/incidents/${id}/ack`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ actorLabel: "Familiar demo" }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "No se pudo confirmar");
        setIncident(data.incident);
        setDone(true);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error");
      }
    });
  }

  if (error) {
    return (
      <main className="mx-auto max-w-lg px-4 py-8">
        <h1 className="text-[28px] font-semibold text-text">No encontramos la alerta</h1>
        <p className="mt-2 text-text-secondary">{error}</p>
        <a href="tel:911" className="mt-6 inline-flex min-h-[52px] items-center rounded-xl bg-danger px-4 font-semibold text-white">
          Llamar al 911
        </a>
      </main>
    );
  }

  if (!incident) {
    return (
      <main className="mx-auto max-w-lg px-4 py-8">
        <p className="text-text-secondary">Cargando alerta…</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-lg px-4 py-8">
      <p className="text-sm font-medium text-primary">Pulso · panel familiar</p>
      <h1 className="mt-2 text-[28px] font-semibold text-text">
        {done ? "Confirmaste que recibiste la alerta" : "Alerta de ayuda"}
      </h1>
      {incident.isSimulation ? (
        <p className="mt-2 font-medium text-danger">Simulacro — no es una emergencia real del sistema.</p>
      ) : null}
      <p className="mt-4 text-text-secondary">
        Abierta:{" "}
        {new Date(incident.openedAtUtc).toLocaleString("es-MX", {
          timeZone: "America/Mexico_City",
        })}{" "}
        (CDMX)
      </p>
      <p className="mt-2 text-text">Estado: {incident.status}</p>

      <div className="mt-8 flex flex-col gap-3">
        {!done ? (
          <button
            type="button"
            disabled={isPending}
            onClick={ack}
            className="flex min-h-[52px] items-center justify-center rounded-xl bg-success px-4 font-semibold text-white disabled:opacity-60"
          >
            Confirmo que recibí la alerta
          </button>
        ) : null}
        <a
          href="tel:911"
          className="flex min-h-[52px] items-center justify-center rounded-xl bg-danger px-4 font-semibold text-white"
        >
          Llamar al 911
        </a>
        <Link
          href="/familiar"
          className="flex min-h-[52px] items-center justify-center rounded-xl border border-border px-4 font-medium text-text"
        >
          Ir al inicio
        </Link>
      </div>
    </main>
  );
}
