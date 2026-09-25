"use client";

import { PollarProvider } from "@pollar/react";
import "@pollar/react/styles.css";

export function PollarClientProvider({ apiKey, children }: { apiKey: string; children: React.ReactNode }) {
  return <PollarProvider client={{ apiKey, stellarNetwork: "testnet" }}>{children}</PollarProvider>;
}
