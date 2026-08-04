import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";

function str(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const s = v.trim();
  return s.length ? s : null;
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!str(body.name) || !str(body.url)) {
    return NextResponse.json(
      { error: "Nom et URL requis." },
      { status: 400 }
    );
  }
  if (!str(body.bienId) && !str(body.unitId)) {
    return NextResponse.json(
      { error: "bienId ou unitId requis." },
      { status: 400 }
    );
  }

  const doc = await prisma.document.create({
    data: {
      name: body.name.trim(),
      url: body.url.trim(),
      mimeType: str(body.mimeType),
      size: typeof body.size === "number" ? body.size : null,
      category: str(body.category) ?? "AUTRE",
      source: "MANUAL",
      bienId: str(body.bienId),
      unitId: str(body.unitId),
    },
  });

  // Contexte pour la notification + le lien.
  let href = "/";
  let context = "";
  if (doc.unitId) {
    const unit = await prisma.unit.findUnique({ where: { id: doc.unitId } });
    if (unit) {
      href = `/biens/${unit.bienId}/unites/${unit.id}`;
      context = unit.name;
    }
  } else if (doc.bienId) {
    const bien = await prisma.bien.findUnique({ where: { id: doc.bienId } });
    if (bien) {
      href = `/biens/${bien.id}`;
      context = bien.name;
    }
  }

  await createNotification({
    type: "NEW_DOCUMENT",
    title: `Document ajouté : ${doc.name}`,
    message: context ? `Sur « ${context} ».` : undefined,
    entityType: "DOCUMENT",
    entityId: doc.id,
    href,
  });

  return NextResponse.json({ document: doc });
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id requis." }, { status: 400 });
  await prisma.document.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
