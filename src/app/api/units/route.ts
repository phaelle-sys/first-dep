import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";

function num(v: unknown): number | null {
  if (v === "" || v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
function int(v: unknown): number | null {
  const n = num(v);
  return n == null ? null : Math.round(n);
}
function str(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const s = v.trim();
  return s.length ? s : null;
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  if (!str(body.bienId)) {
    return NextResponse.json({ error: "bienId requis." }, { status: 400 });
  }
  if (!str(body.name)) {
    return NextResponse.json({ error: "Le nom est requis." }, { status: 400 });
  }
  if (!str(body.type)) {
    return NextResponse.json({ error: "Le type est requis." }, { status: 400 });
  }

  const bien = await prisma.bien.findUnique({ where: { id: body.bienId } });
  if (!bien) {
    return NextResponse.json({ error: "Bien introuvable." }, { status: 404 });
  }

  const unit = await prisma.unit.create({
    data: {
      bienId: body.bienId,
      name: body.name.trim(),
      type: body.type,
      status: str(body.status) ?? "DISPONIBLE",
      reference: str(body.reference),
      floor: str(body.floor),
      surface: num(body.surface),
      rooms: int(body.rooms),
      bedrooms: int(body.bedrooms),
      bathrooms: int(body.bathrooms),
      price: num(body.price),
      rentPrice: num(body.rentPrice),
      charges: num(body.charges),
      epcScore: str(body.epcScore),
      description: str(body.description),
      coverImage: str(body.coverImage),
      driveFolderId: str(body.driveFolderId),
    },
  });

  await createNotification({
    type: "NEW_UNIT",
    title: `Nouvelle unité : ${unit.name}`,
    message: `Ajoutée au bien « ${bien.name} ».`,
    entityType: "UNIT",
    entityId: unit.id,
    href: `/biens/${bien.id}/unites/${unit.id}`,
  });

  return NextResponse.json({ unit });
}
