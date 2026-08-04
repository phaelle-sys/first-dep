import { prisma } from "@/lib/prisma";
import { UnitsExplorer } from "@/components/UnitsExplorer";

export const dynamic = "force-dynamic";

export default async function UnitesPage() {
  const units = await prisma.unit.findMany({
    include: { bien: { select: { name: true } } },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-white">
          Unités
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Toutes les unités du portefeuille, tous biens confondus. Chaque unité
          possède sa propre fiche autonome.
        </p>
      </div>
      <UnitsExplorer units={units} />
    </div>
  );
}
