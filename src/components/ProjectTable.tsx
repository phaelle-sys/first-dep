import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { PropertyIcon } from "./PropertyIcon";
import { BienStatusBadge } from "./StatusBadge";
import { propertyTypeLabel } from "@/lib/enums";
import { formatPrice } from "@/lib/utils";
import { EmptyState } from "./ui";

type Row = {
  id: string;
  name: string;
  type: string;
  status: string;
  city?: string | null;
  price?: number | null;
  units: { status: string; price?: number | null }[];
};

function progress(units: { status: string }[]) {
  const total = units.length || 1;
  const sold = units.filter((u) => u.status === "VENDU").length;
  const reserved = units.filter((u) =>
    ["RESERVE", "SOUS_COMPROMIS"].includes(u.status)
  ).length;
  return {
    soldPct: (sold / total) * 100,
    reservedPct: (reserved / total) * 100,
    sold,
    reserved,
    available: units.filter((u) => u.status === "DISPONIBLE").length,
  };
}

export function ProjectTable({ biens }: { biens: Row[] }) {
  if (biens.length === 0) {
    return (
      <EmptyState
        title="Aucun bien enregistré"
        description="Commencez par ajouter un bien à votre portefeuille."
        action={
          <Link href="/biens/new" className="btn-primary">
            + Nouveau bien
          </Link>
        }
      />
    );
  }

  return (
    <div className="card overflow-hidden p-0">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-white/5 text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3 font-medium">Bien</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Statut</th>
              <th className="px-4 py-3 font-medium">Commercialisation</th>
              <th className="px-4 py-3 text-right font-medium">Valeur</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {biens.map((b) => {
              const p = progress(b.units);
              return (
                <tr
                  key={b.id}
                  className="group border-b border-white/5 transition last:border-0 hover:bg-white/[0.03]"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/biens/${b.id}`}
                      className="flex items-center gap-3"
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5">
                        <PropertyIcon
                          type={b.type}
                          className="h-4 w-4 text-brand-400"
                        />
                      </div>
                      <div>
                        <p className="font-medium text-slate-100 group-hover:text-brand-200">
                          {b.name}
                        </p>
                        {b.city && (
                          <p className="text-xs text-slate-500">{b.city}</p>
                        )}
                      </div>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-400">
                    {propertyTypeLabel(b.type)}
                  </td>
                  <td className="px-4 py-3">
                    <BienStatusBadge status={b.status} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="w-40">
                      <div className="flex h-2 overflow-hidden rounded-full bg-ink-700">
                        <div
                          className="bg-emerald-500"
                          style={{ width: `${p.soldPct}%` }}
                        />
                        <div
                          className="bg-amber-500"
                          style={{ width: `${p.reservedPct}%` }}
                        />
                      </div>
                      <p className="mt-1 text-[11px] text-slate-500">
                        {p.sold} vendu · {p.reserved} réservé ·{" "}
                        {p.available} dispo
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-gold-400">
                    {formatPrice(b.price)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/biens/${b.id}`}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-white/10 hover:text-white"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
