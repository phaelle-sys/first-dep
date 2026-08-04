import { NextRequest, NextResponse } from "next/server";
import { fullSync } from "@/lib/sync";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

// Endpoint déclenché par le Cron Vercel (voir vercel.json) — synchro complète
// quotidienne : ajoute les nouveaux fichiers et retire ceux supprimés du Drive.
//
// Protection : si la variable CRON_SECRET est définie, on exige l'en-tête
// « Authorization: Bearer <CRON_SECRET> » que Vercel envoie automatiquement.
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim();
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
    }
  }

  const rootFolderId = process.env.DRIVE_ROOT_FOLDER_ID?.trim() ?? "";
  const result = await fullSync(rootFolderId);
  const httpStatus = result.status === "ERROR" ? 502 : 200;
  return NextResponse.json(result, { status: httpStatus });
}
