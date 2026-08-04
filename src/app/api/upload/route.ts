import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

// Upload local : enregistre le fichier dans /public/uploads et renvoie l'URL.
// (Pour la production, brancher un stockage objet type S3/GCS.)
export async function POST(req: NextRequest) {
  // Les hébergements serverless (Vercel…) ont un système de fichiers en
  // lecture seule : le téléversement local n'y est pas persistant. Dans ce cas,
  // on invite à coller une URL (ou à passer par la synchronisation Drive).
  if (process.env.VERCEL || process.env.DISABLE_LOCAL_UPLOAD) {
    return NextResponse.json(
      {
        error:
          "Téléversement local indisponible en ligne. Collez une URL, ou importez le fichier via Google Drive.",
      },
      { status: 501 }
    );
  }

  const form = await req.formData();
  const file = form.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Aucun fichier." }, { status: 400 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const filename = `${Date.now()}-${safeName}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads");

  await mkdir(uploadDir, { recursive: true });
  await writeFile(path.join(uploadDir, filename), bytes);

  return NextResponse.json({
    url: `/uploads/${filename}`,
    name: file.name,
    mimeType: file.type,
    size: file.size,
  });
}
