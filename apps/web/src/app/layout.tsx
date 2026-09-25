import type { Metadata } from "next";
import "./globals.css";
import { PulsoProviders } from "@/components/PulsoProviders";
import { PollarSessionBridge } from "@/components/PollarSessionBridge";

export const metadata: Metadata = {
  title: "Pulso — Tu red de apoyo en un toque",
  description:
    "Sistema de alerta familiar para emergencias médicas. Modo simulacro por defecto.",
  applicationName: "Pulso",
  manifest: "/manifest.webmanifest",
  themeColor: "#0d5c63",
  appleWebApp: {
    capable: true,
    title: "Pulso",
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-background text-text">
        <PulsoProviders>
          <PollarSessionBridge />
          {children}
        </PulsoProviders>
      </body>
    </html>
  );
}
