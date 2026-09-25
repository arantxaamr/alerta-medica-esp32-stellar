"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";

type Contact = {
  id: string;
  name: string;
  email: string;
  relationship: string;
  kycStatus: string;
  verifiedAt: string | null;
  isPrimary: boolean;
};

export function ContactosClient({ showAltaHint }: { showAltaHint?: boolean }) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState<boolean | null>(null);
  const [emailTo, setEmailTo] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    relationship: "familiar",
    isPrimary: true,
  });

  function load() {
    fetch("/api/contacts")
      .then((r) => r.json())
      .then((d) => setContacts(d.contacts || []))
      .catch(() => setError("No se pudieron cargar contactos"));
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-6">
      {showAltaHint ? (
        <p className="rounded-xl border border-success/30 bg-surface p-4 text-success">
          Alta personal lista. Ahora invita a tu familiar (paso 2).
        </p>
      ) : null}

      <ul className="space-y-3">
        {contacts.length === 0 ? (
          <li className="text-text-secondary">Aún no hay familiares verificados.</li>
        ) : (
          contacts.map((c) => (
            <li key={c.id} className="rounded-xl border border-border bg-surface p-4">
              <p className="font-medium text-text">
                {c.name} {c.isPrimary ? "(principal)" : ""}
              </p>
              <p className="text-sm text-text-secondary">
                {c.email} · {c.relationship}
              </p>
              <p className="text-sm text-text-secondary">
                KYC familiar: {c.kycStatus}
                {c.verifiedAt ? " · verificado" : " · pendiente de aceptar invitación"}
              </p>
            </li>
          ))
        )}
      </ul>

      <form
        className="space-y-3 rounded-xl border border-border bg-surface p-4"
        onSubmit={(e) => {
          e.preventDefault();
          setError(null);
          setInviteLink(null);
          setEmailSent(null);
          setEmailTo(null);
          setEmailError(null);
          startTransition(async () => {
            const res = await fetch("/api/contacts", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(form),
            });
            const data = await res.json();
            if (!res.ok) {
              setError(data.error || "No se pudo invitar");
              return;
            }
            setInviteLink(data.inviteLink);
            setEmailSent(Boolean(data.emailSent));
            setEmailTo(data.emailTo || form.email);
            setEmailError(data.emailError || null);
            setForm({
              name: "",
              email: "",
              phone: "",
              relationship: "familiar",
              isPrimary: contacts.length === 0,
            });
            load();
          });
        }}
      >
        <h2 className="text-lg font-semibold text-text">Invitar familiar</h2>
        <p className="text-sm text-text-secondary">
          Le enviaremos al correo un enlace para completar su alta y unirse a tu
          red de apoyo.
        </p>
        <input
          className="min-h-[52px] w-full rounded-xl border border-border px-3"
          placeholder="Nombre"
          required
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <input
          className="min-h-[52px] w-full rounded-xl border border-border px-3"
          placeholder="Correo"
          type="email"
          required
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <input
          className="min-h-[52px] w-full rounded-xl border border-border px-3"
          placeholder="Teléfono"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
        />
        <input
          className="min-h-[52px] w-full rounded-xl border border-border px-3"
          placeholder="Parentesco (hija, hijo, cuidador…)"
          required
          value={form.relationship}
          onChange={(e) => setForm({ ...form, relationship: e.target.value })}
        />
        <label className="flex gap-2 text-text">
          <input
            type="checkbox"
            checked={form.isPrimary}
            onChange={(e) => setForm({ ...form, isPrimary: e.target.checked })}
          />
          Contacto principal
        </label>
        <button
          type="submit"
          disabled={pending}
          className="flex min-h-[52px] w-full items-center justify-center rounded-xl bg-primary font-medium text-white disabled:opacity-60"
        >
          Enviar invitación
        </button>
      </form>

      {inviteLink ? (
        <div className="space-y-2 rounded-xl border border-border bg-surface p-4 text-sm">
          {emailSent ? (
            <p className="text-success">
              Correo de invitación enviado a <strong>{emailTo}</strong>.
            </p>
          ) : (
            <p className="text-danger">
              La invitación se creó, pero el correo no se pudo enviar
              {emailError ? `: ${emailError}` : ""}. Comparte el enlace a mano:
            </p>
          )}
          <p className="break-all text-text-secondary">
            <a className="text-primary underline" href={inviteLink}>
              {inviteLink}
            </a>
          </p>
        </div>
      ) : null}
      {error ? (
        <p className="text-danger" role="alert">
          {error}
        </p>
      ) : null}

      <Link href="/inicio" className="block text-center text-primary underline">
        Volver al inicio
      </Link>
    </div>
  );
}
