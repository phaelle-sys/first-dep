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

### Import automatique par dossier racine (recommandé)

Si votre Drive est organisé avec **un dossier racine** (ex. `immobilier`)
contenant **un sous-dossier par adresse** (`CODE - Adresse`), l'app peut tout
importer d'un coup :

1. Partagez le dossier racine avec le compte de service.
2. Renseignez son ID dans `DRIVE_ROOT_FOLDER_ID` (ou saisissez-le sur la page
   **Synchronisation**).
3. Cliquez sur **Importer le portefeuille**.

Pour chaque sous-dossier d'adresse, un **bien** est créé (référence + adresse
déduites du nom `CODE - Adresse`), et son arborescence est parcourue
récursivement : les images deviennent des **photos**, les autres fichiers des
**documents** dont la catégorie est déduite du nom du sous-dossier (ex.
`Devis Travaux` → Financier, `Attestation Urbanistique` → Juridique). L'import
est **ré-exécutable** sans créer de doublons.

### Import par bien (manuel)

1. Partagez le dossier du bien avec le compte de service.
2. Sur la fiche du bien, renseignez l'**ID du dossier Drive**.
3. Cliquez sur **Synchroniser Drive** (fiche du bien) ou **Tout synchroniser**
   (page Synchronisation).

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

## 🌐 Déploiement en ligne (gratuit)

L'app se déploie sur **Vercel** (hébergement gratuit) avec une base
**PostgreSQL Neon** (offre gratuite). Étapes :

1. **Base de données** — créez un compte sur [neon.tech](https://neon.tech),
   créez un projet, copiez la chaîne de connexion (`postgresql://…?sslmode=require`).
2. **Schéma** — en local, mettez cette chaîne dans `.env` (`DATABASE_URL`) puis :
   ```bash
   npm run db:push       # crée les tables sur Neon
   # npm run db:seed     # (optionnel) données de démo ; inutile si import Drive
   ```
3. **Hébergement** — sur [vercel.com](https://vercel.com), importez ce dépôt
   GitHub. Dans **Settings → Environment Variables**, ajoutez :
   - `DATABASE_URL` (la chaîne Neon)
   - `GOOGLE_SERVICE_ACCOUNT_JSON`, `DRIVE_ROOT_FOLDER_ID` (pour la synchro Drive)
   - `NOTIFY_WEBHOOK_URL` (optionnel)
4. **Déployez.** Vercel exécute `npm run build` (qui génère le client Prisma).
   L'app est en ligne, accessible à toute l'équipe.

> **Téléversement de fichiers en ligne** : l'hébergement serverless a un système
> de fichiers en lecture seule. Le téléversement local est donc désactivé sur
> Vercel — ajoutez les fichiers via une **URL** ou via la **synchronisation
> Drive**. Pour réactiver l'upload en ligne, branchez un stockage objet
> (Vercel Blob, S3, GCS).

## 📝 Notes

- **Base de données** : PostgreSQL par défaut (déploiement). Pour un usage
  100 % local sans Postgres, repassez `provider` à `sqlite` et
  `DATABASE_URL="file:./dev.db"` dans `prisma/schema.prisma`.
- Les fichiers téléversés en local sont stockés dans `public/uploads/`.
  En production, préférez un stockage objet (Vercel Blob / S3 / GCS).
- **Unités** : créées manuellement pour l'instant (les dossiers Drive n'ont pas
  tous la même structure). L'interface gère type (appartement, duplex, studio,
  commerce…), étage, statut de vente et caractéristiques par unité.
