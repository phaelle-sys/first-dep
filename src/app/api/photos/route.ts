import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function str(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const s = v.trim();
  return s.length ? s : null;
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!str(body.url)) {
    return NextResponse.json({ error: "URL requise." }, { status: 400 });
  }
  if (!str(body.bienId) && !str(body.unitId)) {
    return NextResponse.json(
      { error: "bienId ou unitId requis." },
      { status: 400 }
    );
  }

  const photo = await prisma.photo.create({
    data: {
      url: body.url.trim(),
      caption: str(body.caption),
      source: "MANUAL",
      bienId: str(body.bienId),
      unitId: str(body.unitId),
    },
  });

  return NextResponse.json({ photo });
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id requis." }, { status: 400 });
  await prisma.photo.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
