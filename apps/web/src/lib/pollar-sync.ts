"use client";

export type PulsoSyncResult = {
  ok: boolean;
  role?: string;
  error?: string;
  redirectTo?: string;
  needsCode?: boolean;
  attemptId?: string;
  displayName?: string;
};

function redirectForRole(role?: string): string {
  if (role === "FAMILY") return "/familiar";
  if (role === "ADMIN") return "/admin";
  return "/inicio";
}

function extractEmail(profile: { mail?: string; providers?: { email?: { address?: string } | null } } | null): string | null {
  return profile?.mail?.trim() || profile?.providers?.email?.address?.trim() || null;
}

function extractAddress(client: {
  getWallet?: () => { address?: string } | null;
  getWallets?: () => { address?: string }[];
  getAuthState?: () => { step?: string; session?: { wallet?: { address?: string } } };
}): string | null {
  return client.getWallet?.()?.address?.trim() || client.getWallets?.().find((wallet) => wallet.address)?.address?.trim() || (client.getAuthState?.().step === "authenticated" ? client.getAuthState?.().session?.wallet?.address?.trim() : null) || null;
}

export async function syncPollarToPulso(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getClient: () => any,
  opts?: { maxAttempts?: number; delayMs?: number; emailHint?: string; attemptId?: string; code?: string; displayName?: string },
): Promise<PulsoSyncResult> {
  if (opts?.attemptId && opts.code) {
    const res = await fetch("/api/auth/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ attemptId: opts.attemptId, code: opts.code, displayName: opts.displayName }),
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string; user?: { role?: string } };
    if (!res.ok) return { ok: false, error: data.error || "No se pudo crear la sesión de Pulso" };
    return { ok: true, role: data.user?.role, redirectTo: redirectForRole(data.user?.role) };
  }

  const maxAttempts = opts?.maxAttempts ?? 8;
  const delayMs = opts?.delayMs ?? 400;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const client = getClient();
    const profile = client.getUserProfile?.() ?? null;
    const auth = client.getAuthState?.();
    const email = extractEmail(profile) || opts?.emailHint?.trim() || (typeof auth?.email === "string" ? auth.email.trim() : null);
    const pollarSubject = extractAddress(client);
    if (!email || !pollarSubject) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      continue;
    }
    const displayName = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ").trim() || email.split("@")[0];
    try {
      const start = await fetch("/api/auth/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, walletAddress: pollarSubject }),
      });
      const challengeData = (await start.json().catch(() => ({}))) as { attemptId?: string; challenge?: string; error?: string };
      if (!start.ok || !challengeData.attemptId || !challengeData.challenge) return { ok: false, error: challengeData.error || "No se pudo iniciar la comprobación de Pollar" };
      const proof = await client.stellar?.sep53?.signMessage(challengeData.challenge);
      if (proof?.status !== "signed" || !proof.signature || !proof.signerAddress) return { ok: false, error: proof?.details || "Pollar no pudo firmar la comprobación de identidad" };
      const proved = await fetch("/api/auth/prove", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attemptId: challengeData.attemptId, signature: proof.signature, signerAddress: proof.signerAddress }),
      });
      const proofData = (await proved.json().catch(() => ({}))) as { error?: string };
      if (!proved.ok) return { ok: false, error: proofData.error || "No se pudo enviar el código de seguridad" };
      return { ok: false, needsCode: true, attemptId: challengeData.attemptId, displayName };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : "Error de red al sincronizar" };
    }
  }
  return { ok: false, error: "Pollar autenticó, pero aún no hay correo o cartera listos. Espera un momento o reintenta." };
}
