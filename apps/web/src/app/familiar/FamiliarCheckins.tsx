"use client";

import { useEffect, useState } from "react";

type SharedPayload = {
  checkins: {
    id: string;
    localDay: string;
    score0100: number | null;
    personName: string;
  }[];
  contactRequests: {
    id: string;
    createdAtUtc: string;
    personName: string;
    status: string;
  }[];
};

export function FamiliarCheckins() {
  const [data, setData] = useState<SharedPayload | null>(null);

  useEffect(() => {
    fetch("/api/checkins/shared")
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => setData({ checkins: [], contactRequests: [] }));
  }, []);

  if (!data) {
    return (
      <p className="mt-6 text-sm text-text-secondary">Cargando chequeos…</p>
    );
  }

  const hasContent =
    data.contactRequests.length > 0 || data.checkins.length > 0;
  if (!hasContent) return null;

  return (
    <section className="mt-8 space-y-4">
      {data.contactRequests.length > 0 ? (
        <div>
          <h2 className="text-lg font-semibold text-text">
            Piden que les llamen
          </h2>
          <ul className="mt-2 space-y-2">
            {data.contactRequests.map((r) => (
              <li
                key={r.id}
                className="rounded-xl border border-border bg-surface p-4 text-text"
              >
                <p className="font-medium">{r.personName}</p>
                <p className="text-sm text-text-secondary">
                  Solicitud abierta ·{" "}
                  {new Date(r.createdAtUtc).toLocaleString("es-MX", {
                    timeZone: "America/Mexico_City",
                  })}
                </p>
                <p className="mt-1 text-sm text-text-secondary">
                  No es una emergencia. Llama cuando puedas.
                </p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {data.checkins.length > 0 ? (
        <div>
          <h2 className="text-lg font-semibold text-text">
            Bienestar compartido
          </h2>
          <ul className="mt-2 space-y-2 text-sm text-text-secondary">
            {data.checkins.map((c) => (
              <li
                key={c.id}
                className="rounded-xl border border-border bg-surface px-4 py-3"
              >
                <span className="font-medium text-text">{c.personName}</span>
                {" · "}
                {c.localDay}
                {": "}
                {c.score0100 === null
                  ? "sin puntaje"
                  : `${c.score0100}/100 reportado`}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
