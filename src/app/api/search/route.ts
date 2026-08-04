import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { propertyTypeLabel } from "@/lib/enums";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json({ results: [] });

  const [biens, units] = await Promise.all([
    prisma.bien.findMany({
      where: {
        OR: [
          { name: { contains: q } },
          { city: { contains: q } },
          { address: { contains: q } },
          { reference: { contains: q } },
        ],
      },
      take: 6,
    }),
    prisma.unit.findMany({
      where: {
        OR: [
          { name: { contains: q } },
          { reference: { contains: q } },
        ],
      },
      include: { bien: true },
      take: 6,
    }),
  ]);

  const results = [
    ...biens.map((b) => ({
      id: b.id,
      name: b.name,
      type: b.type,
      kind: "bien" as const,
      href: `/biens/${b.id}`,
      subtitle: [propertyTypeLabel(b.type), b.city].filter(Boolean).join(" · "),
    })),
    ...units.map((u) => ({
      id: u.id,
      name: u.name,
      type: u.type,
      kind: "unit" as const,
      href: `/biens/${u.bienId}/unites/${u.id}`,
      subtitle: `${u.bien.name} · ${propertyTypeLabel(u.type)}`,
    })),
  ];

  return NextResponse.json({ results });
}
