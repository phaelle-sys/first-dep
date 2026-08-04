"use client";

import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import { UnitCard } from "./Cards";
import { EmptyState } from "./ui";
import { propertyTypeOptions, unitStatusOptions } from "@/lib/enums";

type Unit = {
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
  bien: { name: string };
};

export function UnitsExplorer({ units }: { units: Unit[] }) {
  const [q, setQ] = useState("");
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");

  const filtered = useMemo(() => {
    return units.filter((u) => {
      if (type && u.type !== type) return false;
      if (status && u.status !== status) return false;
      if (q) {
        const hay = `${u.name} ${u.reference ?? ""} ${u.bien.name}`.toLowerCase();
        if (!hay.includes(q.toLowerCase())) return false;
      }
      return true;
    });
  }, [units, q, type, status]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            className="input pl-9"
            placeholder="Rechercher une unité…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <select
          className="input sm:w-52"
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          <option value="">Tous les types</option>
          {propertyTypeOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <select
          className="input sm:w-52"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">Tous les statuts</option>
          {unitStatusOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <p className="text-xs text-slate-500">
        {filtered.length} unité{filtered.length > 1 ? "s" : ""}
      </p>

      {filtered.length === 0 ? (
        <EmptyState
          title="Aucune unité ne correspond"
          description="Ajustez vos filtres."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((u) => (
            <UnitCard key={u.id} unit={u} showBien bienName={u.bien.name} />
          ))}
        </div>
      )}
    </div>
  );
}
