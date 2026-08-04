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

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await req.json();
  const existing = await prisma.unit.findUnique({
    where: { id: params.id },
    include: { bien: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Unité introuvable." }, { status: 404 });
  }

  const unit = await prisma.unit.update({
    where: { id: params.id },
    data: {
      name: str(body.name) ?? existing.name,
      type: str(body.type) ?? existing.type,
      status: str(body.status) ?? existing.status,
      reference: body.reference !== undefined ? str(body.reference) : existing.reference,
      floor: body.floor !== undefined ? str(body.floor) : existing.floor,
      surface: body.surface !== undefined ? num(body.surface) : existing.surface,
      rooms: body.rooms !== undefined ? int(body.rooms) : existing.rooms,
      bedrooms: body.bedrooms !== undefined ? int(body.bedrooms) : existing.bedrooms,
      bathrooms: body.bathrooms !== undefined ? int(body.bathrooms) : existing.bathrooms,
      price: body.price !== undefined ? num(body.price) : existing.price,
      rentPrice: body.rentPrice !== undefined ? num(body.rentPrice) : existing.rentPrice,
      charges: body.charges !== undefined ? num(body.charges) : existing.charges,
      epcScore: body.epcScore !== undefined ? str(body.epcScore) : existing.epcScore,
      description: body.description !== undefined ? str(body.description) : existing.description,
      coverImage: body.coverImage !== undefined ? str(body.coverImage) : existing.coverImage,
      driveFolderId: body.driveFolderId !== undefined ? str(body.driveFolderId) : existing.driveFolderId,
    },
  });

  if (str(body.status) && body.status !== existing.status) {
    await createNotification({
      type: "STATUS_CHANGE",
      title: `${unit.name} — ${existing.bien.name}`,
      message: `Statut de vente mis à jour.`,
      entityType: "UNIT",
      entityId: unit.id,
      href: `/biens/${existing.bienId}/unites/${unit.id}`,
    });
  }

  return NextResponse.json({ unit });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  await prisma.unit.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
