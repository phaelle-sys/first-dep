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

export async function POST(req: NextRequest) {
  const body = await req.json();

  if (!str(body.name)) {
    return NextResponse.json({ error: "Le nom est requis." }, { status: 400 });
  }
  if (!str(body.type)) {
    return NextResponse.json({ error: "Le type est requis." }, { status: 400 });
  }

  const bien = await prisma.bien.create({
    data: {
      name: body.name.trim(),
      type: body.type,
      status: str(body.status) ?? "EN_PREPARATION",
      reference: str(body.reference),
      address: str(body.address),
      city: str(body.city),
      postalCode: str(body.postalCode),
      country: str(body.country) ?? "Belgique",
      description: str(body.description),
      price: num(body.price),
      surface: num(body.surface),
      yearBuilt: num(body.yearBuilt),
      coverImage: str(body.coverImage),
      driveFolderId: str(body.driveFolderId),
    },
  });

  await createNotification({
    type: "NEW_BIEN",
    title: `Nouveau bien : ${bien.name}`,
    message: [bien.city, bien.address].filter(Boolean).join(", ") || undefined,
    entityType: "BIEN",
    entityId: bien.id,
    href: `/biens/${bien.id}`,
  });

  return NextResponse.json({ bien });
}
