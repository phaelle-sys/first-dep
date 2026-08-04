"use client";

import { useState, useMemo } from "react";
import { LayoutGrid, List, Search } from "lucide-react";
import { BienCard } from "./Cards";
import { ProjectTable } from "./ProjectTable";
import { EmptyState } from "./ui";
import {
  propertyTypeOptions,
  bienStatusOptions,
} from "@/lib/enums";

type Bien = {
  id: string;
  name: string;
  type: string;
  status: string;
  city?: string | null;
  address?: string | null;
  price?: number | null;
  coverImage?: string | null;
  _count?: { units: number };
  units: { status: string; price?: number | null }[];
};

export function BiensExplorer({ biens }: { biens: Bien[] }) {
  const [q, setQ] = useState("");
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const [view, setView] = useState<"grid" | "table">("grid");

  const filtered = useMemo(() => {
    return biens.filter((b) => {
      if (type && b.type !== type) return false;
      if (status && b.status !== status) return false;
      if (q) {
        const hay = `${b.name} ${b.city ?? ""} ${b.address ?? ""}`.toLowerCase();
        if (!hay.includes(q.toLowerCase())) return false;
      }
      return true;
    });
  }, [biens, q, type, status]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            className="input pl-9"
            placeholder="Rechercher par nom, ville…"
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
          {bienStatusOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <div className="flex overflow-hidden rounded-xl border border-white/10">
          <button
            onClick={() => setView("grid")}
            className={`flex h-11 w-11 items-center justify-center transition ${
              view === "grid"
                ? "bg-brand-500/15 text-brand-300"
                : "text-slate-400 hover:bg-white/5"
            }`}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setView("table")}
            className={`flex h-11 w-11 items-center justify-center transition ${
              view === "table"
                ? "bg-brand-500/15 text-brand-300"
                : "text-slate-400 hover:bg-white/5"
            }`}
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      <p className="text-xs text-slate-500">
        {filtered.length} bien{filtered.length > 1 ? "s" : ""}
      </p>

      {filtered.length === 0 ? (
        <EmptyState
          title="Aucun bien ne correspond"
          description="Ajustez vos filtres ou ajoutez un nouveau bien."
        />
      ) : view === "grid" ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((b) => (
            <BienCard key={b.id} bien={b} />
          ))}
        </div>
      ) : (
        <ProjectTable biens={filtered} />
      )}
    </div>
  );
}
