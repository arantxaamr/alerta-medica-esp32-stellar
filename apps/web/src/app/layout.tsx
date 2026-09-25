import type { Metadata, Viewport } from "next";
import "./globals.css";
import { PulsoProviders } from "@/components/PulsoProviders";

export const metadata: Metadata = {
  title: "Pulso | Tu red de apoyo en dos toques",
  description:
    "Alerta familiar y seguimiento cotidiano para hogares de Latinoamérica. Piloto en Ciudad de México.",
  applicationName: "Pulso",
  manifest: "/manifest.webmanifest",
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

export const viewport: Viewport = {
  themeColor: "#0d5c63",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-MX" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-background text-text">
        <PulsoProviders>
          {children}
        </PulsoProviders>
      </body>
    </html>
  );
}
