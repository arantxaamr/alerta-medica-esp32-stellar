"use client";

import { useEffect, useState, useTransition } from "react";
import { useParams, useRouter } from "next/navigation";
import { PRIVACY_SUMMARY } from "@/lib/kyc";

export default function FamiliarUnirPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const [info, setInfo] = useState<{
    name: string;
    email: string;
    relationship: string;
    personName: string;
    kycStatus: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState({
    name: "",
    phone: "",
    acceptsAlerts: false,
    acceptsCall911: false,
    acceptsPrivacy: false,
  });

  useEffect(() => {
    fetch(`/api/familiar/unir/${token}`)
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || "Invitación inválida");
        setInfo(d.contact);
        setForm((f) => ({ ...f, name: d.contact.name }));
      })
      .catch((e) => setError(e.message));
  }, [token]);

  if (error) {
    return (
      <main className="mx-auto max-w-lg px-4 py-8">
        <h1 className="text-[28px] font-semibold text-text">Invitación</h1>
        <p className="mt-4 text-danger">{error}</p>
      </main>
    );
  }

  if (!info) {
    return (
      <main className="mx-auto max-w-lg px-4 py-8">
        <p className="text-text-secondary">Cargando invitación…</p>
      </main>
    );
  }

  if (info.kycStatus === "completed") {
    return (
      <main className="mx-auto max-w-lg px-4 py-8">
        <h1 className="text-[28px] font-semibold text-text">Ya estás registrado</h1>
        <p className="mt-2 text-text-secondary">
          Tu KYC familiar para ayudar a {info.personName} ya está completo.
        </p>
        <button
          type="button"
          className="mt-6 flex min-h-[52px] w-full items-center justify-center rounded-xl bg-primary text-white"
          onClick={() => {
            router.push("/familiar");
            router.refresh();
          }}
        >
          Ir al panel familiar
        </button>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-lg px-4 py-8">
      <p className="text-sm font-medium text-primary">Pulso · familiar</p>
      <h1 className="mt-2 text-[28px] font-semibold text-text">
        Alta como contacto de ayuda
      </h1>
      <p className="mt-2 text-text-secondary">
        {info.personName} te invita como {info.relationship} ({info.email}).
      </p>

      <form
        className="mt-6 space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          setError(null);
          startTransition(async () => {
            const res = await fetch(`/api/familiar/unir/${token}`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(form),
            });
            const data = await res.json();
            if (!res.ok) {
              setError(data.error || "No se pudo completar el alta");
              return;
            }
            router.push("/familiar");
            router.refresh();
          });
        }}
      >
        <label className="block space-y-1">
          <span className="text-sm text-text-secondary">Tu nombre</span>
          <input
            required
            className="min-h-[52px] w-full rounded-xl border border-border px-3"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </label>
        <label className="block space-y-1">
          <span className="text-sm text-text-secondary">Tu teléfono</span>
          <input
            required
            className="min-h-[52px] w-full rounded-xl border border-border px-3"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
        </label>

        <div className="rounded-xl border border-border bg-surface p-4 text-sm text-text-secondary">
          <p className="whitespace-pre-line">{PRIVACY_SUMMARY}</p>
          <p className="mt-3">
            <a href="/privacidad" className="text-primary underline">
              Leer aviso completo
            </a>
            {" · "}
            <a href="/protocolo" className="text-primary underline">
              Protocolo familiar (15 min / 911)
            </a>
          </p>
        </div>

        <label className="flex gap-3">
          <input
            type="checkbox"
            className="mt-1 h-5 w-5"
            checked={form.acceptsAlerts}
            onChange={(e) => setForm({ ...form, acceptsAlerts: e.target.checked })}
          />
          <span>Acepto recibir alertas de monitoreo y emergencia de {info.personName}.</span>
        </label>
        <label className="flex gap-3">
          <input
            type="checkbox"
            className="mt-1 h-5 w-5"
            checked={form.acceptsCall911}
            onChange={(e) => setForm({ ...form, acceptsCall911: e.target.checked })}
          />
          <span>
            Me comprometo a seguir el protocolo: confirmar recepción, contactar a
            la persona y llamar al 911 cuando corresponda. Pulso no avisa solo a
            autoridades.
          </span>
        </label>
        <label className="flex gap-3">
          <input
            type="checkbox"
            className="mt-1 h-5 w-5"
            checked={form.acceptsPrivacy}
            onChange={(e) => setForm({ ...form, acceptsPrivacy: e.target.checked })}
          />
          <span>Acepto el aviso de privacidad de Pulso.</span>
        </label>

        {error ? (
          <p className="text-danger" role="alert">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className="flex min-h-[52px] w-full items-center justify-center rounded-xl bg-primary font-semibold text-white disabled:opacity-60"
        >
          Completar mi KYC familiar
        </button>
      </form>
    </main>
  );
}
