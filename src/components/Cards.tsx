import Link from "next/link";
import { MapPin, Layers, Maximize2, BedDouble } from "lucide-react";
import { PropertyIcon } from "./PropertyIcon";
import { BienStatusBadge, UnitStatusBadge } from "./StatusBadge";
import { propertyTypeLabel } from "@/lib/enums";
import { formatPrice, formatSurface } from "@/lib/utils";

type BienCardData = {
  id: string;
  name: string;
  type: string;
  status: string;
  city?: string | null;
  address?: string | null;
  price?: number | null;
  coverImage?: string | null;
  _count?: { units: number };
  units?: { status: string }[];
};

export function BienCard({ bien }: { bien: BienCardData }) {
  const unitCount = bien._count?.units ?? bien.units?.length ?? 0;
  const sold =
    bien.units?.filter((u) => u.status === "VENDU").length ?? 0;

  return (
    <Link
      href={`/biens/${bien.id}`}
      className="card card-hover group overflow-hidden p-0"
    >
      <div className="relative aspect-[16/9] overflow-hidden bg-ink-900">
        {bien.coverImage ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={bien.coverImage}
            alt={bien.name}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <PropertyIcon
              type={bien.type}
              className="h-12 w-12 text-slate-700"
            />
          </div>
        )}
        <div className="absolute left-3 top-3">
          <BienStatusBadge status={bien.status} />
        </div>
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/70 to-transparent" />
      </div>

      <div className="p-4">
        <div className="mb-1 flex items-center gap-2 text-xs text-slate-500">
          <PropertyIcon type={bien.type} className="h-3.5 w-3.5" />
          {propertyTypeLabel(bien.type)}
        </div>
        <h3 className="truncate text-base font-semibold text-white group-hover:text-brand-200">
          {bien.name}
        </h3>
        {(bien.city || bien.address) && (
          <p className="mt-0.5 flex items-center gap-1 truncate text-sm text-slate-400">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            {[bien.address, bien.city].filter(Boolean).join(", ")}
          </p>
        )}
        <div className="mt-3 flex items-center justify-between">
          <span className="text-sm font-semibold text-gold-400">
            {formatPrice(bien.price)}
          </span>
          <span className="text-xs text-slate-500">
            {unitCount} unité{unitCount > 1 ? "s" : ""}
            {sold > 0 && ` · ${sold} vendu${sold > 1 ? "s" : ""}`}
          </span>
        </div>
      </div>
    </Link>
  );
}

type UnitCardData = {
  id: string;
  bienId: string;
  name: string;
  type: string;
  status: string;
  floor?: string | null;
  surface?: number | null;
  bedrooms?: number | null;
  price?: number | null;
  reference?: string | null;
};

export function UnitCard({
  unit,
  showBien,
  bienName,
}: {
  unit: UnitCardData;
  showBien?: boolean;
  bienName?: string;
}) {
  return (
    <Link
      href={`/biens/${unit.bienId}/unites/${unit.id}`}
      className="card card-hover group block p-4"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5">
            <PropertyIcon type={unit.type} className="h-5 w-5 text-brand-400" />
          </div>
          <div className="min-w-0">
            <p className="truncate font-medium text-white group-hover:text-brand-200">
              {unit.name}
            </p>
            <p className="truncate text-xs text-slate-500">
              {showBien && bienName
                ? bienName
                : propertyTypeLabel(unit.type)}
              {unit.reference && ` · ${unit.reference}`}
            </p>
          </div>
        </div>
        <UnitStatusBadge status={unit.status} />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
        {unit.floor && (
          <span className="flex items-center gap-1">
            <Layers className="h-3.5 w-3.5" /> {unit.floor}
          </span>
        )}
        {unit.surface != null && (
          <span className="flex items-center gap-1">
            <Maximize2 className="h-3.5 w-3.5" /> {formatSurface(unit.surface)}
          </span>
        )}
        {unit.bedrooms != null && unit.bedrooms > 0 && (
          <span className="flex items-center gap-1">
            <BedDouble className="h-3.5 w-3.5" /> {unit.bedrooms} ch.
          </span>
        )}
      </div>

      <p className="mt-3 text-sm font-semibold text-gold-400">
        {formatPrice(unit.price)}
      </p>
    </Link>
  );
}
