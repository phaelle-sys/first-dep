// Service de synchronisation Drive -> base locale.
//
// Stratégie (adaptée aux limites de temps du serverless) :
//   • createBiensFromRoot(folderId) : crée/complète UN bien par sous-dossier
//     d'adresse — rapide (1 listing + quelques upserts). Ne lit pas les fichiers.
//   • syncBien(bienId)              : importe les fichiers d'UN bien, dans sa
//     propre requête. Lecture Drive parallélisée + insertions groupées.
//
// L'interface enchaîne : d'abord créer les biens, puis synchroniser chaque
// bien un par un (barre de progression côté client). Chaque requête reste
// courte et passe sous la limite Vercel.

import { prisma } from "./prisma";
import {
  isDriveConfigured,
  isImage,
  isFolder,
  listFolderFiles,
  listSubfolders,
  driveViewUrl,
  driveThumbUrl,
} from "./drive";
import { createNotification } from "./notifications";
import type { DocumentCategory } from "./enums";

const MAX_DEPTH = 6;
const WALK_CONCURRENCY = 10;
const INSERT_CHUNK = 500; // limite les paramètres par requête (limite Postgres)

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export type SyncResult = {
  configured: boolean;
  status: "SUCCESS" | "ERROR" | "SKIPPED";
  message: string;
  filesAdded: number;
  photosAdded: number;
};

// ── Petit pool de concurrence ───────────────────────────────
async function mapPool<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      results[idx] = await fn(items[idx]);
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, worker)
  );
  return results;
}

// ── Déduction de catégorie ──────────────────────────────────
function folderCategory(name: string): DocumentCategory | null {
  const n = name.toLowerCase();
  if (/photo|image|visuel/.test(n)) return "PHOTO";
  if (/devis|travaux|facture|financ|budget|estimation|compta/.test(n))
    return "FINANCIER";
  if (/urbanis|attestation|notaire|juridi|permis|acte|cadastr/.test(n))
    return "JURIDIQUE";
  if (/peb|energie|énergie|epc/.test(n)) return "PEB";
  if (/plan/.test(n)) return "PLAN";
  if (/compromis|bail|contrat|location/.test(n)) return "CONTRAT";
  return null;
}

function fileCategory(name: string): DocumentCategory {
  const n = name.toLowerCase();
  if (/plan|cadastr/.test(n)) return "PLAN";
  if (/peb|energie|énergie|epc/.test(n)) return "PEB";
  if (/compromis|bail|contrat|acte/.test(n)) return "CONTRAT";
  if (/facture|devis|financ|prix|budget|estim/.test(n)) return "FINANCIER";
  if (/juridi|notaire|urbanis|permis/.test(n)) return "JURIDIQUE";
  return "AUTRE";
}

export function parseAddressFolder(title: string): {
  reference: string | null;
  address: string;
} {
  const idx = title.indexOf(" - ");
  if (idx === -1) return { reference: null, address: title.trim() };
  const reference = title.slice(0, idx).trim() || null;
  const address = title.slice(idx + 3).trim();
  return { reference, address: address || title.trim() };
}

// ── Collecte récursive (parallélisée) d'un arbre de dossier ──
type Collected = {
  documents: {
    fileId: string;
    name: string;
    url: string;
    mimeType: string;
    size?: number;
    category: DocumentCategory;
  }[];
  photos: { fileId: string; name: string; url: string }[];
};

async function collectTree(
  folderId: string,
  categoryHint: DocumentCategory | null,
  depth: number,
  acc: Collected
): Promise<void> {
  if (depth > MAX_DEPTH) return;
  const entries = await listFolderFiles(folderId);

  const subfolders: { id: string; hint: DocumentCategory | null }[] = [];
  for (const entry of entries) {
    if (isFolder(entry.mimeType)) {
      subfolders.push({
        id: entry.id,
        hint: folderCategory(entry.name) ?? categoryHint,
      });
    } else if (isImage(entry.mimeType)) {
      acc.photos.push({
        fileId: entry.id,
        name: entry.name,
        url: driveThumbUrl(entry.id),
      });
    } else {
      const category =
        categoryHint && categoryHint !== "PHOTO"
          ? categoryHint
          : fileCategory(entry.name);
      acc.documents.push({
        fileId: entry.id,
        name: entry.name,
        url: driveViewUrl(entry.id, entry.webViewLink),
        mimeType: entry.mimeType,
        size: entry.size,
        category,
      });
    }
  }

  // Explore les sous-dossiers en parallèle (concurrence bornée).
  await mapPool(subfolders, WALK_CONCURRENCY, (sf) =>
    collectTree(sf.id, sf.hint, depth + 1, acc)
  );
}

// ── Importe le contenu d'un dossier dans un bien (insertions groupées) ──
async function importFolderIntoBien(
  bienId: string,
  folderId: string
): Promise<{ filesAdded: number; photosAdded: number }> {
  const [existingDocs, existingPhotos] = await Promise.all([
    prisma.document.findMany({
      where: { bienId, source: "DRIVE" },
      select: { driveFileId: true },
    }),
    prisma.photo.findMany({
      where: { bienId, source: "DRIVE" },
      select: { driveFileId: true },
    }),
  ]);
  const knownDocs = new Set(existingDocs.map((d) => d.driveFileId));
  const knownPhotos = new Set(existingPhotos.map((p) => p.driveFileId));

  const acc: Collected = { documents: [], photos: [] };
  await collectTree(folderId, null, 0, acc);

  // Dédoublonnage (vs base + au sein du lot).
  const seenDocs = new Set<string>();
  const newDocs = acc.documents.filter(
    (d) => !knownDocs.has(d.fileId) && !seenDocs.has(d.fileId) && seenDocs.add(d.fileId)
  );
  const seenPhotos = new Set<string>();
  const newPhotos = acc.photos.filter(
    (p) =>
      !knownPhotos.has(p.fileId) && !seenPhotos.has(p.fileId) && seenPhotos.add(p.fileId)
  );

  for (const batch of chunk(newDocs, INSERT_CHUNK)) {
    await prisma.document.createMany({
      data: batch.map((d) => ({
        name: d.name,
        url: d.url,
        mimeType: d.mimeType,
        size: d.size,
        category: d.category,
        source: "DRIVE",
        driveFileId: d.fileId,
        bienId,
      })),
    });
  }
  for (const batch of chunk(newPhotos, INSERT_CHUNK)) {
    await prisma.photo.createMany({
      data: batch.map((p) => ({
        url: p.url,
        caption: p.name,
        source: "DRIVE",
        driveFileId: p.fileId,
        bienId,
      })),
    });
  }

  return { filesAdded: newDocs.length, photosAdded: newPhotos.length };
}

// ── Phase 1 : créer/compléter les biens depuis le dossier racine ──
export type CreateBiensResult = {
  configured: boolean;
  status: "SUCCESS" | "ERROR" | "SKIPPED";
  message: string;
  created: number;
  updated: number;
  biens: { id: string; name: string; reference: string | null }[];
};

export async function createBiensFromRoot(
  rootFolderId: string
): Promise<CreateBiensResult> {
  const base: CreateBiensResult = {
    configured: isDriveConfigured(),
    status: "SUCCESS",
    message: "",
    created: 0,
    updated: 0,
    biens: [],
  };

  if (!isDriveConfigured()) {
    return {
      ...base,
      status: "SKIPPED",
      message:
        "Google Drive n'est pas configuré. Renseignez les identifiants pour activer l'import.",
    };
  }
  if (!rootFolderId.trim()) {
    return { ...base, status: "ERROR", message: "ID de dossier racine manquant." };
  }

  try {
    const folders = await listSubfolders(rootFolderId.trim());

    for (const folder of folders) {
      const { reference, address } = parseAddressFolder(folder.name);
      let bien = await prisma.bien.findFirst({
        where: { driveFolderId: folder.id },
      });
      if (!bien) {
        bien = await prisma.bien.create({
          data: {
            name: address,
            reference: reference ?? undefined,
            type: "IMMEUBLE",
            status: "EN_PREPARATION",
            address,
            country: "Belgique",
            driveFolderId: folder.id,
          },
        });
        base.created++;
        await createNotification({
          type: "NEW_BIEN",
          title: `Bien importé depuis Drive : ${bien.name}`,
          message: reference ? `Référence ${reference}.` : undefined,
          entityType: "BIEN",
          entityId: bien.id,
          href: `/biens/${bien.id}`,
        });
      } else {
        base.updated++;
      }
      base.biens.push({
        id: bien.id,
        name: bien.name,
        reference: bien.reference,
      });
    }

    await prisma.syncLog.create({
      data: {
        status: "SUCCESS",
        message: `Import racine : ${base.created} bien(s) créé(s), ${base.updated} déjà présent(s).`,
        filesAdded: 0,
      },
    });
    base.message = `${base.created} bien(s) créé(s), ${base.updated} déjà présent(s).`;
    return base;
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erreur inconnue";
    await prisma.syncLog.create({ data: { status: "ERROR", message } });
    return { ...base, status: "ERROR", message: `Échec : ${message}` };
  }
}

// ── Phase 2 : synchroniser les fichiers d'un bien ───────────
export async function syncBien(bienId: string): Promise<SyncResult> {
  if (!isDriveConfigured()) {
    return {
      configured: false,
      status: "SKIPPED",
      message: "Google Drive n'est pas configuré.",
      filesAdded: 0,
      photosAdded: 0,
    };
  }

  const bien = await prisma.bien.findUnique({ where: { id: bienId } });
  if (!bien) {
    return {
      configured: true,
      status: "ERROR",
      message: "Bien introuvable.",
      filesAdded: 0,
      photosAdded: 0,
    };
  }
  if (!bien.driveFolderId) {
    return {
      configured: true,
      status: "SKIPPED",
      message: "Aucun dossier Drive associé à ce bien.",
      filesAdded: 0,
      photosAdded: 0,
    };
  }

  try {
    const { filesAdded, photosAdded } = await importFolderIntoBien(
      bien.id,
      bien.driveFolderId
    );
    const total = filesAdded + photosAdded;

    await prisma.syncLog.create({
      data: {
        status: "SUCCESS",
        message: `Bien « ${bien.name} » : ${filesAdded} document(s), ${photosAdded} photo(s).`,
        filesAdded: total,
      },
    });

    if (total > 0) {
      await createNotification({
        type: "DRIVE_SYNC",
        title: `Synchronisation Drive — ${bien.name}`,
        message: `${filesAdded} document(s) et ${photosAdded} photo(s) importés.`,
        entityType: "BIEN",
        entityId: bien.id,
        href: `/biens/${bien.id}`,
      });
    }

    return {
      configured: true,
      status: "SUCCESS",
      message:
        total > 0
          ? `${filesAdded} document(s) et ${photosAdded} photo(s) importés.`
          : "Déjà à jour.",
      filesAdded,
      photosAdded,
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erreur inconnue";
    await prisma.syncLog.create({ data: { status: "ERROR", message } });
    return {
      configured: true,
      status: "ERROR",
      message: `Échec : ${message}`,
      filesAdded: 0,
      photosAdded: 0,
    };
  }
}
