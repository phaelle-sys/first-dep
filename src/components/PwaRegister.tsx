"use client";

import { useEffect } from "react";

// Enregistre le service worker côté client (nécessaire pour proposer
// l'installation de l'app). Silencieux en cas d'échec ou en environnement
// non compatible.
export function PwaRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      /* installation impossible : on ignore silencieusement */
    });
  }, []);
  return null;
}
