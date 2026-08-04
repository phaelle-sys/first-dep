import { NextRequest, NextResponse } from "next/server";
import { createBiensFromRoot } from "@/lib/sync";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

// Phase 1 de l'import : crée/complète un bien par sous-dossier d'adresse du
// dossier racine, puis renvoie la liste des biens. La synchronisation des
// fichiers se fait ensuite bien par bien (voir /api/biens/[id]/sync), pour
// que chaque requête reste courte.
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

  const result = await createBiensFromRoot(rootFolderId);
  const httpStatus = result.status === "ERROR" ? 502 : 200;
  return NextResponse.json(result, { status: httpStatus });
}
