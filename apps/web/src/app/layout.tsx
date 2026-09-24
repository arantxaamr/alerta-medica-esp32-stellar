import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pulso — Tu red de apoyo en un toque",
  description:
    "Sistema de alerta familiar para emergencias médicas. Modo simulacro por defecto.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-background text-text">
        {children}
      </body>
    </html>
  );
}
