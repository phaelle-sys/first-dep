// Intégration Google Drive.
//
// L'app fonctionne SANS Drive (mode "non configuré") : les fonctions
// renvoient alors un état explicite plutôt que de planter. Dès que des
// identifiants sont fournis via les variables d'environnement, la
// synchronisation réelle s'active.
//
// Deux modes d'authentification :
//   1. Compte de service  -> GOOGLE_SERVICE_ACCOUNT_JSON
//   2. OAuth (refresh)    -> GOOGLE_CLIENT_ID / SECRET / REFRESH_TOKEN

import { google, type drive_v3 } from "googleapis";

export type DriveFile = {
  id: string;
  name: string;
  mimeType: string;
  size?: number;
  webViewLink?: string;
  thumbnailLink?: string;
  modifiedTime?: string;
};

const IMAGE_MIME = /^image\//;

export function isDriveConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim() ||
      (process.env.GOOGLE_CLIENT_ID &&
        process.env.GOOGLE_CLIENT_SECRET &&
        process.env.GOOGLE_REFRESH_TOKEN)
  );
}

function getAuth() {
  const saJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim();
  if (saJson) {
    const credentials = JSON.parse(saJson);
    return new google.auth.GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/drive.readonly"],
    });
  }

  if (
    process.env.GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_SECRET &&
    process.env.GOOGLE_REFRESH_TOKEN
  ) {
    const oauth2 = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );
    oauth2.setCredentials({
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
    });
    return oauth2;
  }

  throw new Error("Google Drive non configuré");
}

async function driveClient(): Promise<drive_v3.Drive> {
  const auth = getAuth();
  return google.drive({ version: "v3", auth: auth as never });
}

/** Liste les fichiers d'un dossier Drive donné. */
export async function listFolderFiles(folderId: string): Promise<DriveFile[]> {
  const drive = await driveClient();
  const files: DriveFile[] = [];
  let pageToken: string | undefined;

  do {
    const res = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      fields:
        "nextPageToken, files(id, name, mimeType, size, webViewLink, thumbnailLink, modifiedTime)",
      pageSize: 200,
      pageToken,
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });
    for (const f of res.data.files ?? []) {
      if (!f.id || !f.name) continue;
      files.push({
        id: f.id,
        name: f.name,
        mimeType: f.mimeType ?? "application/octet-stream",
        size: f.size ? Number(f.size) : undefined,
        webViewLink: f.webViewLink ?? undefined,
        thumbnailLink: f.thumbnailLink ?? undefined,
        modifiedTime: f.modifiedTime ?? undefined,
      });
    }
    pageToken = res.data.nextPageToken ?? undefined;
  } while (pageToken);

  return files;
}

export function isImage(mimeType: string): boolean {
  return IMAGE_MIME.test(mimeType);
}

/** URL de visualisation stable pour un fichier Drive. */
export function driveViewUrl(fileId: string, webViewLink?: string): string {
  return webViewLink ?? `https://drive.google.com/file/d/${fileId}/view`;
}

/** URL d'aperçu image (thumbnail) pour un fichier Drive. */
export function driveThumbUrl(fileId: string): string {
  return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;
}
