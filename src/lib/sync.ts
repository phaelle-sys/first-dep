// Service de synchronisation Drive -> base locale.
//
// Stratégie (adaptée aux limites de temps du serverless) :
//   • createBiensFromRoot(folderId) : crée/complète UN bien par sous-dossier
//     d'adresse — rapide (1 listing + quelques upserts). Ne lit pas les fichiers.
//   • syncBien(bienId)              : RÉCONCILIE les fichiers d'UN bien (ajoute
//     les nouveaux, retire ceux disparus du Drive), dans sa propre requête.
//   • fullSync(folderId)            : synchro complète (tous les biens) — pour
//     le Cron quotidien.
//
// Réconciliation : seuls les enregistrements issus du Drive (source = "DRIVE")
// sont concernés — les ajouts manuels sont préservés. Si un dossier est
// illisible (erreur réseau, dossier supprimé), on n'efface RIEN par sécurité.

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
const BIEN_CONCURRENCY = 3;
const CHUNK = 500; // limite les paramètres par requête (limite Postgres)

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

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

  await mapPool(subfolders, WALK_CONCURRENCY, (sf) =>
    collectTree(sf.id, sf.hint, depth + 1, acc)
  );
}

export type ReconcileCounts = {
  filesAdded: number;
  photosAdded: number;
  filesRemoved: number;
  photosRemoved: number;
};

// ── Réconcilie le contenu d'un dossier avec un bien ─────────
async function reconcileBienFiles(
  bienId: string,
  folderId: string
): Promise<ReconcileCounts> {
  // Lecture Drive (peut lever une exception -> propagée, aucune suppression).
  const acc: Collected = { documents: [], photos: [] };
  await collectTree(folderId, null, 0, acc);

  const currentDocIds = new Set(acc.documents.map((d) => d.fileId));
  const currentPhotoIds = new Set(acc.photos.map((p) => p.fileId));

  const [existingDocs, existingPhotos] = await Promise.all([
    prisma.document.findMany({
      where: { bienId, source: "DRIVE" },
      select: { id: true, driveFileId: true },
    }),
    prisma.photo.findMany({
      where: { bienId, source: "DRIVE" },
      select: { id: true, driveFileId: true },
    }),
  ]);
  const knownDocIds = new Set(existingDocs.map((d) => d.driveFileId));
  const knownPhotoIds = new Set(existingPhotos.map((p) => p.driveFileId));

  // AJOUTS (dédoublonnés vs base + au sein du lot).
  const seenD = new Set<string>();
  const newDocs = acc.documents.filter(
    (d) => !knownDocIds.has(d.fileId) && !seenD.has(d.fileId) && seenD.add(d.fileId)
  );
  const seenP = new Set<string>();
  const newPhotos = acc.photos.filter(
    (p) => !knownPhotoIds.has(p.fileId) && !seenP.has(p.fileId) && seenP.add(p.fileId)
  );

  for (const batch of chunk(newDocs, CHUNK)) {
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
  for (const batch of chunk(newPhotos, CHUNK)) {
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

  // SUPPRESSIONS (fichiers Drive disparus). Uniquement source = DRIVE.
  const docIdsToDelete = existingDocs
    .filter((d) => !d.driveFileId || !currentDocIds.has(d.driveFileId))
    .map((d) => d.id);
  const photoIdsToDelete = existingPhotos
    .filter((p) => !p.driveFileId || !currentPhotoIds.has(p.driveFileId))
    .map((p) => p.id);

  for (const batch of chunk(docIdsToDelete, CHUNK)) {
    await prisma.document.deleteMany({ where: { id: { in: batch } } });
  }
  for (const batch of chunk(photoIdsToDelete, CHUNK)) {
    await prisma.photo.deleteMany({ where: { id: { in: batch } } });
  }

  return {
    filesAdded: newDocs.length,
    photosAdded: newPhotos.length,
    filesRemoved: docIdsToDelete.length,
    photosRemoved: photoIdsToDelete.length,
  };
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

    base.message = `${base.created} bien(s) créé(s), ${base.updated} déjà présent(s).`;
    return base;
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erreur inconnue";
    await prisma.syncLog.create({ data: { status: "ERROR", message } });
    return { ...base, status: "ERROR", message: `Échec : ${message}` };
  }
}

export type SyncResult = {
  configured: boolean;
  status: "SUCCESS" | "ERROR" | "SKIPPED";
  message: string;
  filesAdded: number;
  photosAdded: number;
  filesRemoved: number;
  photosRemoved: number;
};

// ── Synchronise (réconcilie) UN bien ────────────────────────
export async function syncBien(bienId: string): Promise<SyncResult> {
  const zero = { filesAdded: 0, photosAdded: 0, filesRemoved: 0, photosRemoved: 0 };
  if (!isDriveConfigured()) {
    return {
      configured: false,
      status: "SKIPPED",
      message: "Google Drive n'est pas configuré.",
      ...zero,
    };
  }

  const bien = await prisma.bien.findUnique({ where: { id: bienId } });
  if (!bien) {
    return { configured: true, status: "ERROR", message: "Bien introuvable.", ...zero };
  }
  if (!bien.driveFolderId) {
    return {
      configured: true,
      status: "SKIPPED",
      message: "Aucun dossier Drive associé à ce bien.",
      ...zero,
    };
  }

  try {
    const c = await reconcileBienFiles(bien.id, bien.driveFolderId);
    const changed =
      c.filesAdded + c.photosAdded + c.filesRemoved + c.photosRemoved;

    await prisma.syncLog.create({
      data: {
        status: "SUCCESS",
        message: `Bien « ${bien.name} » : +${c.filesAdded} doc / +${c.photosAdded} photo · -${c.filesRemoved} doc / -${c.photosRemoved} photo.`,
        filesAdded: c.filesAdded + c.photosAdded,
      },
    });

    if (changed > 0) {
      await createNotification({
        type: "DRIVE_SYNC",
        title: `Synchronisation Drive — ${bien.name}`,
        message: `Ajouts : ${c.filesAdded} doc, ${c.photosAdded} photo. Retraits : ${c.filesRemoved} doc, ${c.photosRemoved} photo.`,
        entityType: "BIEN",
        entityId: bien.id,
        href: `/biens/${bien.id}`,
      });
    }

    return {
      configured: true,
      status: "SUCCESS",
      message: changed > 0 ? "Synchronisé." : "Déjà à jour.",
      ...c,
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erreur inconnue";
    await prisma.syncLog.create({ data: { status: "ERROR", message } });
    return { configured: true, status: "ERROR", message: `Échec : ${message}`, ...zero };
  }
}

// ── Synchro complète (Cron quotidien) ───────────────────────
export type FullSyncResult = {
  configured: boolean;
  status: "SUCCESS" | "ERROR" | "SKIPPED";
  message: string;
  biensCreated: number;
  filesAdded: number;
  photosAdded: number;
  filesRemoved: number;
  photosRemoved: number;
  errors: string[];
};

export async function fullSync(rootFolderId: string): Promise<FullSyncResult> {
  const res: FullSyncResult = {
    configured: isDriveConfigured(),
    status: "SUCCESS",
    message: "",
    biensCreated: 0,
    filesAdded: 0,
    photosAdded: 0,
    filesRemoved: 0,
    photosRemoved: 0,
    errors: [],
  };

  if (!isDriveConfigured()) {
    return { ...res, status: "SKIPPED", message: "Google Drive non configuré." };
  }
  if (!rootFolderId.trim()) {
    return { ...res, status: "ERROR", message: "Dossier racine manquant." };
  }

  // 1) Créer les biens des nouveaux dossiers d'adresse.
  const create = await createBiensFromRoot(rootFolderId);
  if (create.status === "ERROR") {
    return { ...res, status: "ERROR", message: create.message };
  }
  res.biensCreated = create.created;

  // 2) Réconcilier les fichiers de chaque bien lié (en parallèle borné).
  const biens = await prisma.bien.findMany({
    where: { driveFolderId: { not: null } },
    select: { id: true, name: true, driveFolderId: true },
  });

  await mapPool(biens, BIEN_CONCURRENCY, async (b) => {
    try {
      const c = await reconcileBienFiles(b.id, b.driveFolderId!);
      res.filesAdded += c.filesAdded;
      res.photosAdded += c.photosAdded;
      res.filesRemoved += c.filesRemoved;
      res.photosRemoved += c.photosRemoved;
    } catch (e) {
      // Erreur de lecture d'un bien : on l'ignore (aucune suppression).
      res.errors.push(b.name);
    }
  });

  res.message = `${res.biensCreated} bien(s) créé(s) · +${res.filesAdded} doc / +${res.photosAdded} photo · -${res.filesRemoved} doc / -${res.photosRemoved} photo${
    res.errors.length ? ` · ${res.errors.length} bien(s) en erreur` : ""
  }.`;

  await prisma.syncLog.create({
    data: {
      status: res.errors.length ? "ERROR" : "SUCCESS",
      message: `Synchro auto — ${res.message}`,
      filesAdded: res.filesAdded + res.photosAdded,
    },
  });

  const changed =
    res.biensCreated +
    res.filesAdded +
    res.photosAdded +
    res.filesRemoved +
    res.photosRemoved;
  if (changed > 0) {
    await createNotification({
      type: "DRIVE_SYNC",
      title: "Synchronisation automatique Drive",
      message: res.message,
      href: "/sync",
    });
  }

  return res;
}
