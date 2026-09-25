import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Pulso — Red de apoyo",
    short_name: "Pulso",
    description:
      "Pide ayuda a tus familiares verificados desde el teléfono. No sustituye al 911.",
    start_url: "/inicio",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#f7fafc",
    theme_color: "#0d5c63",
    lang: "es-MX",
    categories: ["health", "medical", "lifestyle"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Necesito ayuda",
        short_name: "Ayuda",
        description: "Enviar alerta a familiares verificados",
        url: "/ayuda",
        icons: [
          {
            src: "/icons/ayuda-192.png",
            sizes: "192x192",
            type: "image/png",
          },
        ],
      },
    ],
  };
}
