"use client";

import { useEffect, useRef } from "react";
import { usePollar } from "@pollar/react";

/**
 * Tras login Pollar, sincroniza identidad a sesión Pulso (DB + cookie).
 */
export function PollarSessionBridge() {
  const apiKey = process.env.NEXT_PUBLIC_POLLAR_PUBLISHABLE_KEY;
  if (!apiKey) return null;
  return <PollarSessionBridgeInner />;
}

function PollarSessionBridgeInner() {
  const { isAuthenticated, wallet, getClient } = usePollar();
  const synced = useRef<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !wallet?.address) return;
    if (synced.current === wallet.address) return;

    const profile = getClient().getUserProfile();
    const email = profile?.mail || profile?.providers?.email?.address;
    if (!email) return;

    const displayName = [profile?.first_name, profile?.last_name]
      .filter(Boolean)
      .join(" ")
      .trim();

    synced.current = wallet.address;
    void fetch("/api/auth/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        pollarSubject: wallet.address,
        displayName: displayName || email.split("@")[0],
      }),
    }).then(async (res) => {
      if (!res.ok) {
        synced.current = null;
        console.error("Pollar sync failed", await res.text());
        return;
      }
      const data = (await res.json()) as {
        user?: { role?: string };
      };
      const role = data.user?.role;
      if (role === "FAMILY") {
        window.location.href = "/familiar";
      } else if (role === "ADMIN") {
        window.location.href = "/admin";
      } else {
        window.location.href = "/inicio";
      }
    });
  }, [isAuthenticated, wallet?.address, getClient]);

  return null;
}
