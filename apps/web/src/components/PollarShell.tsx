"use client";

import { PollarProvider } from "@pollar/react";
import { PollarClient } from "@pollar/core";
import { useSyncExternalStore, type ReactNode } from "react";

const subscribe = () => () => {};
let sharedClient: PollarClient | null = null;

export function PollarShell({ apiKey, children }: { apiKey?: string; children: ReactNode }) {
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);
  if (!apiKey || !mounted) return <p className="form-hint">Preparando acceso seguro…</p>;
  sharedClient ??= new PollarClient({ apiKey, stellarNetwork: "testnet" });
  return <PollarProvider client={sharedClient}>{children}</PollarProvider>;
}
