"use client";

import { useEffect, useRef } from "react";
import { usePollar } from "@pollar/react";
import { syncPollarToPulso } from "@/lib/pollar-sync";

/**
 * Tras login Pollar, sincroniza identidad a sesión Pulso (DB + cookie)
 * y redirige al panel correspondiente.
 */
export function PollarSessionBridge() {
  const apiKey = process.env.NEXT_PUBLIC_POLLAR_PUBLISHABLE_KEY;
  if (!apiKey) return null;
  return <PollarSessionBridgeInner />;
}

function PollarSessionBridgeInner() {
  const { isAuthenticated, wallet, wallets, getClient } = usePollar();
  const inFlight = useRef(false);
  const doneFor = useRef<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      doneFor.current = null;
      return;
    }

    const subjectHint =
      wallet?.address ||
      wallets?.[0]?.address ||
      "authenticated";

    if (doneFor.current === subjectHint || inFlight.current) return;
    inFlight.current = true;

    void syncPollarToPulso(getClient)
      .then((result) => {
        if (!result.ok) {
          console.error("Pollar sync failed", result.error);
          inFlight.current = false;
          return;
        }
        doneFor.current = subjectHint;
        window.location.assign(result.redirectTo || "/inicio");
      })
      .catch((err) => {
        console.error("Pollar sync failed", err);
        inFlight.current = false;
      });
  }, [isAuthenticated, wallet?.address, wallets, getClient]);

  return null;
}
