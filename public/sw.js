// Service worker minimal — sa seule fonction est de rendre l'application
// « installable » (icône bureau / fenêtre dédiée). Il ne met rien en cache :
// chaque requête part au réseau, l'app affiche donc toujours des données à jour.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});
// Un gestionnaire "fetch" (même en simple passe-plat) est requis par les
// navigateurs pour proposer l'installation.
self.addEventListener("fetch", () => {
  // passe-plat : on laisse le navigateur gérer la requête normalement.
});
