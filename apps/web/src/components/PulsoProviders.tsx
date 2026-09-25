"use client";

import { PollarProvider } from "@pollar/react";
import "@pollar/react/styles.css";

const apiKey = process.env.NEXT_PUBLIC_POLLAR_PUBLISHABLE_KEY;

export function PulsoProviders({ children }: { children: React.ReactNode }) {
  if (!apiKey) {
    return <>{children}</>;
  }

  // No pasar appConfig: deja que Pollar cargue Email OTP / Embedded wallets del dashboard.
  return (
    <PollarProvider
      client={{
        apiKey,
        stellarNetwork: "testnet",
      }}
    >
      {children}
    </PollarProvider>
  );
}
