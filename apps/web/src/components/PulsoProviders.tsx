"use client";

import dynamic from "next/dynamic";

const apiKey = process.env.NEXT_PUBLIC_POLLAR_PUBLISHABLE_KEY;
const PollarClientProvider = dynamic(
  () => import("@/components/PollarClientProvider").then((module) => module.PollarClientProvider),
  { ssr: false },
);

export function PulsoProviders({ children }: { children: React.ReactNode }) {
  if (!apiKey) {
    return <>{children}</>;
  }

  return <PollarClientProvider apiKey={apiKey}>{children}</PollarClientProvider>;
}
