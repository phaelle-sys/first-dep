# ImmoCRM — Gestion de portefeuille immobilier

Application web pour centraliser vos **biens** et **unités** à vendre : une
sorte de CRM immobilier avec une interface simple, en thème sombre, qui
présente chaque bien, chaque unité, avec ses documents, informations, photos
et statuts.

Pensée pour la réalité du métier : **un immeuble peut être divisé en plusieurs
unités autonomes** (appartements, studios, commerces, garages…), chacune avec
sa propre fiche, son propre statut de vente et ses propres documents — pas
seulement une vue globale.

## ✨ Fonctionnalités

- **Tableau de bord** — vue d'ensemble : nombre de biens, d'unités,
  disponibilités, valeur du portefeuille, et un **tableau d'état des projets**
  avec barre de commercialisation (vendu / réservé / disponible).
- **Biens** — fiche complète par bien : type, statut, adresse, prix, surface,
  description, photos, documents. Vue **grille** ou **tableau**, filtres par
  type et statut.
- **Unités autonomes** — chaque unité possède **sa propre page** avec toutes
  ses caractéristiques (étage, surface, pièces, chambres, PEB, prix, loyer,
  charges), ses documents et ses photos dédiés.
- **Types de biens** — immeuble de rapport, immeuble, maison, appartement,
  studio, commerce, garage, entrepôt, terrain.
- **Statuts de vente** — au niveau bien (en préparation, en vente,
  partiellement vendu, sous compromis, vendu, archivé) et au niveau unité
  (disponible, réservé, sous compromis, vendu, loué, indisponible).
- **Documents & photos** — ajout manuel (téléversement ou URL), catégorisation,
  galerie avec lightbox.
- **Synchronisation Google Drive** — remplissage **automatique** des documents
  et photos depuis un dossier Drive associé à chaque bien, tout en gardant la
  possibilité d'ajouter/modifier manuellement.
- **Notifications** — alerte l'équipe à chaque nouveau bien, unité, document ou
  changement de statut. Dispatch optionnel vers un **webhook** (Slack / Teams /
  Discord).
- **Recherche globale** — barre de recherche instantanée sur les biens et
  unités.
- **Thème sombre** — design premium, responsive.

## 🧱 Stack technique

- **Next.js 14** (App Router) + **TypeScript**
- **Tailwind CSS** (thème sombre)
- **Prisma** + **SQLite** (base locale, migrable vers PostgreSQL)
- **googleapis** pour l'intégration Drive
- **lucide-react** pour les icônes

## 🚀 Démarrage

```bash
# 1. Installer les dépendances
npm install

# 2. Créer la base et charger des données de démonstration
npm run db:push
npm run db:seed

# 3. Lancer en développement
npm run dev
```

L'application est disponible sur http://localhost:3000.

### Scripts utiles

| Script              | Description                                       |
| ------------------- | ------------------------------------------------- |
| `npm run dev`       | Serveur de développement                          |
| `npm run build`     | Build de production (génère le client Prisma)     |
| `npm start`         | Serveur de production                             |
| `npm run db:push`   | Applique le schéma à la base                      |
| `npm run db:seed`   | Charge les données de démonstration               |
| `npm run db:reset`  | Réinitialise la base + reseed                     |

## ☁️ Configuration Google Drive (optionnelle)

L'application fonctionne **sans Drive** (saisie 100 % manuelle). Pour activer
la synchronisation automatique, renseignez dans `.env` l'un des deux modes :

**Compte de service** (recommandé)

```env
GOOGLE_SERVICE_ACCOUNT_JSON='{"type":"service_account", ...}'
```

**OAuth**

```env
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
GOOGLE_REFRESH_TOKEN="..."
```

Ensuite :

1. Partagez vos dossiers Drive avec le compte de service.
2. Sur chaque bien, renseignez l'**ID du dossier Drive**.
3. Cliquez sur **Synchroniser Drive** (fiche du bien) ou **Tout synchroniser**
   (page Synchronisation).

Les images deviennent des photos, les autres fichiers des documents
(catégorisés automatiquement d'après leur nom).

## 🔔 Notifications sortantes (optionnelles)

```env
NOTIFY_WEBHOOK_URL="https://hooks.slack.com/services/..."
```

Chaque événement (nouveau bien, unité, document, changement de statut, synchro)
est alors poussé vers ce webhook, en plus du flux interne.

## 🗂️ Structure du projet

```
prisma/
  schema.prisma      # Modèle : Bien → Unit → Document/Photo, Notification, SyncLog
  seed.ts            # Données de démonstration (biens liégeois)
src/
  app/
    page.tsx                         # Tableau de bord
    biens/                           # Liste, création, détail bien
    biens/[id]/unites/[unitId]/      # Fiche d'unité autonome
    unites/                          # Toutes les unités
    notifications/                   # Centre de notifications
    sync/                            # Synchronisation Drive
    api/                             # Routes REST (biens, units, documents, photos, sync…)
  components/        # UI (cartes, formulaires, managers, badges…)
  lib/
    enums.ts         # Types, statuts, catégories (labels FR + couleurs)
    drive.ts         # Client Google Drive
    sync.ts          # Logique de synchronisation
    notifications.ts # Création + dispatch des notifications
    prisma.ts        # Client Prisma
```

## 📝 Notes

- Les fichiers téléversés manuellement sont stockés dans `public/uploads/`.
  Pour la production, branchez un stockage objet (S3 / GCS).
- SQLite convient au démarrage ; pour un usage multi-utilisateurs, passez à
  PostgreSQL en changeant `provider` et `DATABASE_URL` dans `prisma/schema.prisma`.
