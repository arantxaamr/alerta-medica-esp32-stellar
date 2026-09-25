"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function AdminLoginForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/auth/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "No se pudo entrar");
        return;
      }
      router.push("/admin");
      router.refresh();
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="self-start text-xs text-text-secondary underline decoration-transparent underline-offset-2 hover:text-text hover:decoration-current"
      >
        Entrar como administrador
      </button>
    );
  }

  return (
    <form onSubmit={onSubmit} className="max-w-xs space-y-2">
      <label className="block text-xs text-text-secondary" htmlFor="admin-email">
        Correo
      </label>
      <input
        id="admin-email"
        type="email"
        autoComplete="username"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="min-h-9 w-full rounded-lg border border-border px-2 text-sm text-text"
        required
      />
      <label
        className="block text-xs text-text-secondary"
        htmlFor="admin-password"
      >
        Contraseña
      </label>
      <input
        id="admin-password"
        type="password"
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="min-h-9 w-full rounded-lg border border-border px-2 text-sm text-text"
        required
      />
      <div className="flex items-center gap-2 pt-1">
        <button
          type="submit"
          disabled={pending}
          className="min-h-9 rounded-lg bg-text px-3 text-xs font-medium text-white disabled:opacity-60"
        >
          Entrar
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setError(null);
          }}
          className="text-xs text-text-secondary underline"
        >
          Cancelar
        </button>
      </div>
      {error ? (
        <p className="text-xs text-danger" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  );
}
