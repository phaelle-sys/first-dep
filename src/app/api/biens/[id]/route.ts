import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";

function num(v: unknown): number | null {
  if (v === "" || v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
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
  const existing = await prisma.bien.findUnique({ where: { id: params.id } });
  if (!existing) {
    return NextResponse.json({ error: "Bien introuvable." }, { status: 404 });
  }

  const bien = await prisma.bien.update({
    where: { id: params.id },
    data: {
      name: str(body.name) ?? existing.name,
      type: str(body.type) ?? existing.type,
      status: str(body.status) ?? existing.status,
      reference: body.reference !== undefined ? str(body.reference) : existing.reference,
      address: body.address !== undefined ? str(body.address) : existing.address,
      city: body.city !== undefined ? str(body.city) : existing.city,
      postalCode: body.postalCode !== undefined ? str(body.postalCode) : existing.postalCode,
      country: body.country !== undefined ? str(body.country) : existing.country,
      description: body.description !== undefined ? str(body.description) : existing.description,
      price: body.price !== undefined ? num(body.price) : existing.price,
      surface: body.surface !== undefined ? num(body.surface) : existing.surface,
      yearBuilt: body.yearBuilt !== undefined ? num(body.yearBuilt) : existing.yearBuilt,
      coverImage: body.coverImage !== undefined ? str(body.coverImage) : existing.coverImage,
      driveFolderId: body.driveFolderId !== undefined ? str(body.driveFolderId) : existing.driveFolderId,
    },
  });

  if (str(body.status) && body.status !== existing.status) {
    await createNotification({
      type: "STATUS_CHANGE",
      title: `Statut mis à jour : ${bien.name}`,
      message: `Nouveau statut du bien.`,
      entityType: "BIEN",
      entityId: bien.id,
      href: `/biens/${bien.id}`,
    });
  }

  return NextResponse.json({ bien });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  await prisma.bien.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
