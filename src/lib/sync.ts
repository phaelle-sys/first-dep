// Service de synchronisation Drive -> base locale.
//
// Deux entrées :
//   • syncBien(bienId)         : re-synchronise le dossier Drive d'un bien
//   • importFromRoot(folderId) : parcourt un dossier racine « immobilier »
//                                (un sous-dossier = une adresse = un bien) et
//                                crée/complète chaque bien automatiquement.
//
// À l'intérieur d'un dossier de bien, l'arborescence est explorée
// récursivement : les images -> photos, les autres fichiers -> documents.
// La catégorie du document est déduite du nom du sous-dossier (ex. « Devis
// Travaux » -> FINANCIER) puis, à défaut, du nom du fichier.

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

export type SyncResult = {
  configured: boolean;
  status: "SUCCESS" | "ERROR" | "SKIPPED";
  message: string;
  filesAdded: number;
  photosAdded: number;
};

export type ImportResult = SyncResult & {
  biensCreated: number;
  biensUpdated: number;
};

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

// ── Nom de dossier « CODE - Adresse » -> { reference, address } ──
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

// ── Collecte récursive d'un arbre de dossier ────────────────
type Collected = {
  documents: { fileId: string; name: string; url: string; mimeType: string; size?: number; category: DocumentCategory }[];
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

  for (const entry of entries) {
    if (isFolder(entry.mimeType)) {
      const childHint = folderCategory(entry.name) ?? categoryHint;
      await collectTree(entry.id, childHint, depth + 1, acc);
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
}

// ── Importe le contenu d'un dossier dans un bien existant ───
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

  let filesAdded = 0;
  let photosAdded = 0;

  for (const d of acc.documents) {
    if (knownDocs.has(d.fileId)) continue;
    await prisma.document.create({
      data: {
        name: d.name,
        url: d.url,
        mimeType: d.mimeType,
        size: d.size,
        category: d.category,
        source: "DRIVE",
        driveFileId: d.fileId,
        bienId,
      },
    });
    knownDocs.add(d.fileId);
    filesAdded++;
  }

  for (const p of acc.photos) {
    if (knownPhotos.has(p.fileId)) continue;
    await prisma.photo.create({
      data: {
        url: p.url,
        caption: p.name,
        source: "DRIVE",
        driveFileId: p.fileId,
        bienId,
      },
    });
    knownPhotos.add(p.fileId);
    photosAdded++;
  }

  return { filesAdded, photosAdded };
}

// ── Synchronise un bien (dossier Drive déjà associé) ────────
export async function syncBien(bienId: string): Promise<SyncResult> {
  if (!isDriveConfigured()) {
    await prisma.syncLog.create({
      data: {
        status: "SKIPPED",
        message: "Google Drive non configuré (variables d'environnement).",
      },
    });
    return {
      configured: false,
      status: "SKIPPED",
      message:
        "Google Drive n'est pas configuré. Renseignez les identifiants dans .env pour activer la synchronisation automatique.",
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
        message: `${filesAdded} document(s) et ${photosAdded} photo(s) importés depuis Google Drive.`,
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
          : "Déjà à jour — aucun nouveau fichier.",
      filesAdded,
      photosAdded,
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erreur inconnue";
    await prisma.syncLog.create({ data: { status: "ERROR", message } });
    return {
      configured: true,
      status: "ERROR",
      message: `Échec de la synchronisation : ${message}`,
      filesAdded: 0,
      photosAdded: 0,
    };
  }
}

// ── Import auto depuis le dossier racine « immobilier » ─────
export async function importFromRoot(
  rootFolderId: string
): Promise<ImportResult> {
  const base: ImportResult = {
    configured: isDriveConfigured(),
    status: "SUCCESS",
    message: "",
    filesAdded: 0,
    photosAdded: 0,
    biensCreated: 0,
    biensUpdated: 0,
  };

  if (!isDriveConfigured()) {
    await prisma.syncLog.create({
      data: {
        status: "SKIPPED",
        message: "Import racine ignoré : Google Drive non configuré.",
      },
    });
    return {
      ...base,
      status: "SKIPPED",
      message:
        "Google Drive n'est pas configuré. Renseignez les identifiants dans .env pour activer l'import automatique.",
    };
  }

  if (!rootFolderId.trim()) {
    return { ...base, status: "ERROR", message: "ID de dossier racine manquant." };
  }

  try {
    const addressFolders = await listSubfolders(rootFolderId.trim());

    for (const folder of addressFolders) {
      const { reference, address } = parseAddressFolder(folder.name);

      // Dédoublonnage : on retrouve le bien par son dossier Drive.
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
        base.biensCreated++;
        await createNotification({
          type: "NEW_BIEN",
          title: `Bien importé depuis Drive : ${bien.name}`,
          message: reference ? `Référence ${reference}.` : undefined,
          entityType: "BIEN",
          entityId: bien.id,
          href: `/biens/${bien.id}`,
        });
      } else {
        base.biensUpdated++;
      }

      const { filesAdded, photosAdded } = await importFolderIntoBien(
        bien.id,
        folder.id
      );
      base.filesAdded += filesAdded;
      base.photosAdded += photosAdded;
    }

    await prisma.syncLog.create({
      data: {
        status: "SUCCESS",
        message: `Import racine : ${base.biensCreated} bien(s) créé(s), ${base.biensUpdated} mis à jour, ${base.filesAdded} document(s), ${base.photosAdded} photo(s).`,
        filesAdded: base.filesAdded + base.photosAdded,
      },
    });

    if (base.biensCreated > 0 || base.filesAdded + base.photosAdded > 0) {
      await createNotification({
        type: "DRIVE_SYNC",
        title: "Import automatique Drive terminé",
        message: `${base.biensCreated} bien(s) créé(s), ${base.filesAdded} document(s) et ${base.photosAdded} photo(s) importés.`,
        href: "/biens",
      });
    }

    base.message = `${base.biensCreated} bien(s) créé(s), ${base.biensUpdated} mis à jour · ${base.filesAdded} document(s), ${base.photosAdded} photo(s) importés.`;
    return base;
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erreur inconnue";
    await prisma.syncLog.create({ data: { status: "ERROR", message } });
    return { ...base, status: "ERROR", message: `Échec de l'import : ${message}` };
  }
}
