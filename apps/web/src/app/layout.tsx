import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pulso | Tu red de apoyo en dos toques",
  description:
    "Conoce la demostración de Pulso: una propuesta de alerta familiar con botón ESP32 y seguimiento cotidiano para hogares de Latinoamérica. Piloto en CDMX.",
  applicationName: "Pulso",
  icons: { icon: "/pulso-mark.svg" },
  openGraph: {
    type: "website",
    locale: "es_MX",
    siteName: "Pulso",
    title: "Pulso | Tu red de apoyo en dos toques",
    description: "Dos pulsaciones para pedir apoyo familiar desde casa. Conoce el proyecto Pulso y su piloto propuesto en CDMX.",
  },
  twitter: { card: "summary", title: "Pulso | Tu red de apoyo en dos toques" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-MX" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-background text-text">
        {children}
      </body>
    </html>
  );
}
