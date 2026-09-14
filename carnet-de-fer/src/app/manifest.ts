import type { MetadataRoute } from "next";

// Permet d'ajouter le site à l'écran d'accueil du téléphone et de l'ouvrir
// en plein écran, sans la barre du navigateur — utile pour s'en servir
// pendant une séance.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Carnet de Fer",
    short_name: "Carnet de Fer",
    description: "Programme de musculation et journal de séances.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0D0E10",
    theme_color: "#0D0E10",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
