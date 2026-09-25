"use client";

export type PulsoSyncResult = {
  ok: boolean;
  role?: string;
  error?: string;
  redirectTo?: string;
};

function redirectForRole(role?: string): string {
  if (role === "FAMILY") return "/familiar";
  if (role === "ADMIN") return "/admin";
  return "/inicio";
}

function extractEmail(profile: {
  mail?: string;
  providers?: { email?: { address?: string } | null };
} | null): string | null {
  const fromMail = profile?.mail?.trim();
  if (fromMail) return fromMail;
  const fromProvider = profile?.providers?.email?.address?.trim();
  if (fromProvider) return fromProvider;
  return null;
}

function extractAddress(client: {
  getWallet?: () => { address?: string } | null;
  getWallets?: () => { address?: string }[];
  getAuthState?: () => { step?: string; session?: { wallet?: { address?: string } } };
}): string | null {
  const fromWallet = client.getWallet?.()?.address?.trim();
  if (fromWallet) return fromWallet;

  const wallets = client.getWallets?.() ?? [];
  const fromList = wallets.find((w) => w.address)?.address?.trim();
  if (fromList) return fromList;

  const auth = client.getAuthState?.();
  if (auth?.step === "authenticated") {
    const fromSession = auth.session?.wallet?.address?.trim();
    if (fromSession) return fromSession;
  }

  return null;
}

/**
 * Sincroniza sesión Pollar → cookie Pulso y devuelve a dónde ir.
 * Reintenta un momento si el perfil/wallet aún no están listos.
 */
export async function syncPollarToPulso(
  // PollarClient tipado de forma laxa: el SDK cambia campos opcionales.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getClient: () => any,
  opts?: { maxAttempts?: number; delayMs?: number; emailHint?: string },
): Promise<PulsoSyncResult> {
  const maxAttempts = opts?.maxAttempts ?? 8;
  const delayMs = opts?.delayMs ?? 400;
  const emailHint = opts?.emailHint?.trim();

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const client = getClient();
    const profile = client.getUserProfile?.() ?? null;
    const auth = client.getAuthState?.();
    const email =
      extractEmail(profile) ||
      emailHint ||
      (typeof auth?.email === "string" ? auth.email.trim() : null) ||
      null;
    const pollarSubject = extractAddress(client);

    if (!email || !pollarSubject) {
      await new Promise((r) => setTimeout(r, delayMs));
      continue;
    }

    const displayName = [profile?.first_name, profile?.last_name]
      .filter(Boolean)
      .join(" ")
      .trim();

    try {
      const res = await fetch("/api/auth/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          pollarSubject,
          displayName: displayName || email.split("@")[0],
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        user?: { role?: string };
      };
      if (!res.ok) {
        return {
          ok: false,
          error: data.error || "No se pudo crear la sesión de Pulso",
        };
      }
      const role = data.user?.role;
      return {
        ok: true,
        role,
        redirectTo: redirectForRole(role),
      };
    } catch (e) {
      return {
        ok: false,
        error: e instanceof Error ? e.message : "Error de red al sincronizar",
      };
    }
  }

  return {
    ok: false,
    error:
      "Pollar autenticó, pero aún no hay correo o wallet listos. Espera un momento o reintenta.",
  };
}
