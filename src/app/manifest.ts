import type { MetadataRoute } from "next";

// Manifeste PWA : permet d'« installer » l'application (icône Windows / menu
// Démarrer, fenêtre dédiée sans barre de navigateur). Next.js le sert sur
// /manifest.webmanifest et ajoute automatiquement la balise <link rel="manifest">.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ImmoCRM — Gestion de portefeuille immobilier",
    short_name: "ImmoCRM",
    description:
      "Centralisez vos biens et unités : documents, photos, statuts de vente et synchronisation Drive.",
    lang: "fr",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#0f1115",
    theme_color: "#0f1115",
    categories: ["business", "productivity"],
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
        src: "/icons/maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
