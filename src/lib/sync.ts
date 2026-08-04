// Service de synchronisation Drive -> base locale.
// Parcourt le dossier Drive d'un bien (ou d'une unité) et importe les
// fichiers manquants en tant que documents/photos, puis notifie l'équipe.

import { prisma } from "./prisma";
import {
  isDriveConfigured,
  isImage,
  listFolderFiles,
  driveViewUrl,
  driveThumbUrl,
} from "./drive";
import { createNotification } from "./notifications";
import type { DocumentCategory } from "./enums";

export type SyncResult = {
  configured: boolean;
  status: "SUCCESS" | "ERROR" | "SKIPPED";
  message: string;
  filesAdded: number;
  photosAdded: number;
};

function guessCategory(name: string): DocumentCategory {
  const n = name.toLowerCase();
  if (/plan|cadastr/.test(n)) return "PLAN";
  if (/peb|energie|énergie|epc/.test(n)) return "PEB";
  if (/compromis|bail|contrat|acte/.test(n)) return "CONTRAT";
  if (/facture|financ|prix|budget|estim/.test(n)) return "FINANCIER";
  if (/juridi|notaire|urbanis/.test(n)) return "JURIDIQUE";
  return "AUTRE";
}

/** Synchronise un bien et (optionnellement) ses unités possédant un dossier. */
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

  const bien = await prisma.bien.findUnique({
    where: { id: bienId },
    include: { units: true, documents: true, photos: true },
  });
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

  let filesAdded = 0;
  let photosAdded = 0;

  try {
    const files = await listFolderFiles(bien.driveFolderId);

    const knownDocIds = new Set(
      bien.documents.map((d) => d.driveFileId).filter(Boolean)
    );
    const knownPhotoIds = new Set(
      bien.photos.map((p) => p.driveFileId).filter(Boolean)
    );

    for (const f of files) {
      if (isImage(f.mimeType)) {
        if (knownPhotoIds.has(f.id)) continue;
        await prisma.photo.create({
          data: {
            url: driveThumbUrl(f.id),
            caption: f.name,
            source: "DRIVE",
            driveFileId: f.id,
            bienId: bien.id,
          },
        });
        photosAdded++;
      } else {
        if (knownDocIds.has(f.id)) continue;
        await prisma.document.create({
          data: {
            name: f.name,
            url: driveViewUrl(f.id, f.webViewLink),
            mimeType: f.mimeType,
            size: f.size,
            category: guessCategory(f.name),
            source: "DRIVE",
            driveFileId: f.id,
            bienId: bien.id,
          },
        });
        filesAdded++;
      }
    }

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
    await prisma.syncLog.create({
      data: { status: "ERROR", message },
    });
    return {
      configured: true,
      status: "ERROR",
      message: `Échec de la synchronisation : ${message}`,
      filesAdded,
      photosAdded,
    };
  }
}
