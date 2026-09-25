"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { PRIVACY_SUMMARY } from "@/lib/kyc";

export function AltaUserForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    displayName: "",
    phone: "",
    address: "",
    colonia: "",
    alcaldia: "",
    birthYear: "",
    acceptsNot911: false,
    acceptsPrivacy: false,
    acceptsHealthData: false,
  });

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        startTransition(async () => {
          const res = await fetch("/api/kyc/user", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...form,
              birthYear: form.birthYear ? Number(form.birthYear) : undefined,
            }),
          });
          const data = await res.json();
          if (!res.ok) {
            setError(data.error || "No se pudo guardar el alta");
            return;
          }
          router.push("/contactos?alta=1");
          router.refresh();
        });
      }}
    >
      <Field label="Nombre completo" value={form.displayName} onChange={(v) => update("displayName", v)} required />
      <Field label="Teléfono" value={form.phone} onChange={(v) => update("phone", v)} required />
      <Field label="Domicilio de atención" value={form.address} onChange={(v) => update("address", v)} required />
      <Field label="Colonia" value={form.colonia} onChange={(v) => update("colonia", v)} />
      <Field label="Alcaldía" value={form.alcaldia} onChange={(v) => update("alcaldia", v)} />
      <Field
        label="Año de nacimiento"
        value={form.birthYear}
        onChange={(v) => update("birthYear", v)}
        type="number"
      />

      <div className="rounded-xl border border-border bg-surface p-4 text-sm text-text-secondary">
        <p className="whitespace-pre-line">{PRIVACY_SUMMARY}</p>
        <p className="mt-3">
          <a href="/privacidad" className="text-primary underline">
            Leer aviso completo y matriz de acceso
          </a>
          {" · "}
          <a href="/protocolo" className="text-primary underline">
            Protocolo familiar
          </a>
        </p>
      </div>

      <Check
        checked={form.acceptsNot911}
        onChange={(v) => update("acceptsNot911", v)}
        label="Entiendo que Pulso no sustituye al 911 ni a atención médica de urgencia."
      />
      <Check
        checked={form.acceptsPrivacy}
        onChange={(v) => update("acceptsPrivacy", v)}
        label="Acepto el aviso de privacidad de Pulso (versión del piloto)."
      />
      <Check
        checked={form.acceptsHealthData}
        onChange={(v) => update("acceptsHealthData", v)}
        label="Autorizo el tratamiento de datos de salud/bienestar necesarios para alertas y chequeo."
      />

      {error ? (
        <p className="text-danger" role="alert">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="flex min-h-[52px] w-full items-center justify-center rounded-xl bg-primary px-4 font-semibold text-white disabled:opacity-60"
      >
        Guardar mi alta y continuar
      </button>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  required,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  type?: string;
}) {
  return (
    <label className="block space-y-1">
      <span className="text-sm text-text-secondary">{label}</span>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-[52px] w-full rounded-xl border border-border px-3 text-text"
      />
    </label>
  );
}

function Check({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex gap-3 text-text">
      <input
        type="checkbox"
        className="mt-1 h-5 w-5"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span>{label}</span>
    </label>
  );
}
