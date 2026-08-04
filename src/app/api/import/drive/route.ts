import { NextRequest, NextResponse } from "next/server";
import { importFromRoot } from "@/lib/sync";

// Import automatique depuis un dossier racine « immobilier »
// (un sous-dossier = une adresse = un bien).
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const rootFolderId =
    (typeof body.rootFolderId === "string" && body.rootFolderId.trim()) ||
    process.env.DRIVE_ROOT_FOLDER_ID?.trim() ||
    "";

  if (!rootFolderId) {
    return NextResponse.json(
      {
        status: "ERROR",
        message:
          "Aucun dossier racine fourni (champ rootFolderId ou DRIVE_ROOT_FOLDER_ID).",
      },
      { status: 400 }
    );
  }

  const result = await importFromRoot(rootFolderId);
  const httpStatus = result.status === "ERROR" ? 502 : 200;
  return NextResponse.json(result, { status: httpStatus });
}
