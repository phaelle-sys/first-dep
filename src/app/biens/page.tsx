import Link from "next/link";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { BiensExplorer } from "@/components/BiensExplorer";

export const dynamic = "force-dynamic";

export default async function BiensPage() {
  const biens = await prisma.bien.findMany({
    include: {
      _count: { select: { units: true } },
      units: { select: { status: true, price: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">
            Biens
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Votre portefeuille immobilier — immeubles, maisons, commerces…
          </p>
        </div>
        <Link href="/biens/new" className="btn-primary">
          <Plus className="h-4 w-4" /> Nouveau bien
        </Link>
      </div>

      <BiensExplorer biens={biens} />
    </div>
  );
}
