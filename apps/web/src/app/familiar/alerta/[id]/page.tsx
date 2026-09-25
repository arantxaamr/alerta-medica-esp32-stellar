"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";

type IncidentView = {
  id: string;
  status: string;
  isSimulation: boolean;
  openedAtUtc: string;
  anchors?: {
    status: string;
    eventCode: string | null;
    explorerUrl: string | null;
    txHash: string | null;
  }[];
  ui: {
    familyAck: boolean;
    chainAnchored?: boolean;
    chainPending?: boolean;
  };
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

  useEffect(() => {
    if (!incident?.id) return;
    if (incident.ui.chainAnchored && !incident.ui.chainPending) return;
    const t = setInterval(() => {
      load().catch(() => undefined);
    }, 4000);
    return () => clearInterval(t);
  }, [incident?.id, incident?.ui.chainAnchored, incident?.ui.chainPending, load]);

  function ack() {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/incidents/${id}/ack`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ actorLabel: "Familiar" }),
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

  function close(kind: "CLOSED" | "FALSE_ALARM") {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/incidents/${id}/close`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ kind, actorLabel: "Familiar" }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "No se pudo cerrar");
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
        <h1 className="text-[28px] font-semibold text-text">
          No encontramos la alerta
        </h1>
        <p className="mt-2 text-text-secondary">{error}</p>
        <a
          href="tel:911"
          className="mt-6 inline-flex min-h-[52px] items-center rounded-xl bg-danger px-4 font-semibold text-white"
        >
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

  const closed =
    incident.status === "resolved" || incident.status === "false_alarm";

  return (
    <main className="mx-auto max-w-lg px-4 py-8">
      <p className="text-sm font-medium text-primary">Pulso · panel familiar</p>
      <h1 className="mt-2 text-[28px] font-semibold text-text">
        {closed
          ? "Alerta cerrada"
          : done
            ? "Confirmaste que recibiste la alerta"
            : "Alerta de ayuda"}
      </h1>
      {incident.isSimulation ? (
        <p className="mt-2 font-medium text-danger">
          Simulacro — no es una emergencia real del sistema.
        </p>
      ) : null}
      <p className="mt-4 text-text-secondary">
        Abierta:{" "}
        {new Date(incident.openedAtUtc).toLocaleString("es-MX", {
          timeZone: "America/Mexico_City",
        })}{" "}
        (CDMX)
      </p>
      <p className="mt-2 text-text">Estado: {incident.status}</p>
      <div className="mt-4 rounded-xl border border-border bg-surface p-4 text-sm text-text-secondary">
        <p className="font-medium text-text">Protocolo (piloto CDMX)</p>
        <ol className="mt-2 list-decimal space-y-1 pl-5">
          <li>Confirma recepción en Pulso.</li>
          <li>Llama a la persona usuaria.</li>
          <li>Si hay urgencia o no responde: llama al 911.</li>
          <li>Cierra la alerta o marca falsa alarma.</li>
        </ol>
        <p className="mt-2">
          Si el principal no confirma en 15 minutos, interviene el suplente.{" "}
          <Link href="/protocolo" className="text-primary underline">
            Ver protocolo completo
          </Link>
        </p>
      </div>
      <p className="mt-2 text-sm text-text-secondary">
        {incident.ui.chainAnchored
          ? "Registro en Stellar confirmado."
          : incident.ui.chainPending
            ? "Anclaje en Stellar en proceso…"
            : "Anclaje en Stellar pendiente."}
      </p>
      {incident.anchors?.some((a) => a.explorerUrl) ? (
        <ul className="mt-3 space-y-1 text-sm">
          {incident.anchors
            .filter((a) => a.explorerUrl)
            .map((a) => (
              <li key={a.txHash || a.explorerUrl}>
                <a
                  href={a.explorerUrl!}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary underline"
                >
                  Ver {a.eventCode || "evento"} en Stellar Expert
                </a>
              </li>
            ))}
        </ul>
      ) : null}

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
        {done && !closed ? (
          <>
            <button
              type="button"
              disabled={isPending}
              onClick={() => close("CLOSED")}
              className="flex min-h-[52px] items-center justify-center rounded-xl bg-primary px-4 font-medium text-white disabled:opacity-60"
            >
              Cerrar alerta (atendida)
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => close("FALSE_ALARM")}
              className="flex min-h-[52px] items-center justify-center rounded-xl border border-border px-4 font-medium text-text disabled:opacity-60"
            >
              Marcar falsa alarma
            </button>
          </>
        ) : null}
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
