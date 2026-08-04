"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { propertyTypeOptions, unitStatusOptions } from "@/lib/enums";

export type UnitFormValues = {
  id?: string;
  bienId: string;
  name?: string;
  reference?: string | null;
  type?: string;
  status?: string;
  floor?: string | null;
  surface?: number | null;
  rooms?: number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  price?: number | null;
  rentPrice?: number | null;
  charges?: number | null;
  epcScore?: string | null;
  description?: string | null;
  coverImage?: string | null;
  driveFolderId?: string | null;
};

export function UnitForm({
  initial,
  onDone,
}: {
  initial: UnitFormValues;
  onDone: () => void;
}) {
  const router = useRouter();
  const isEdit = Boolean(initial.id);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [v, setV] = useState<UnitFormValues>({
    type: "APPARTEMENT",
    status: "DISPONIBLE",
    ...initial,
  });

  function set<K extends keyof UnitFormValues>(k: K, val: UnitFormValues[K]) {
    setV((prev) => ({ ...prev, [k]: val }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const res = await fetch(
        isEdit ? `/api/units/${initial.id}` : "/api/units",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(v),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur");
      router.refresh();
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Nom de l&apos;unité *</label>
          <input
            className="input"
            value={v.name ?? ""}
            onChange={(e) => set("name", e.target.value)}
            placeholder="Appartement 1A"
            required
          />
        </div>
        <div>
          <label className="label">Référence</label>
          <input
            className="input"
            value={v.reference ?? ""}
            onChange={(e) => set("reference", e.target.value)}
            placeholder="A-101"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Type *</label>
          <select
            className="input"
            value={v.type}
            onChange={(e) => set("type", e.target.value)}
          >
            {propertyTypeOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Statut de vente</label>
          <select
            className="input"
            value={v.status}
            onChange={(e) => set("status", e.target.value)}
          >
            {unitStatusOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div>
          <label className="label">Étage</label>
          <input
            className="input"
            value={v.floor ?? ""}
            onChange={(e) => set("floor", e.target.value)}
            placeholder="1er"
          />
        </div>
        <div>
          <label className="label">Surface (m²)</label>
          <input
            type="number"
            className="input"
            value={v.surface ?? ""}
            onChange={(e) => set("surface", e.target.value as never)}
          />
        </div>
        <div>
          <label className="label">Pièces</label>
          <input
            type="number"
            className="input"
            value={v.rooms ?? ""}
            onChange={(e) => set("rooms", e.target.value as never)}
          />
        </div>
        <div>
          <label className="label">PEB</label>
          <input
            className="input"
            value={v.epcScore ?? ""}
            onChange={(e) => set("epcScore", e.target.value)}
            placeholder="B"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div>
          <label className="label">Chambres</label>
          <input
            type="number"
            className="input"
            value={v.bedrooms ?? ""}
            onChange={(e) => set("bedrooms", e.target.value as never)}
          />
        </div>
        <div>
          <label className="label">Salles de bain</label>
          <input
            type="number"
            className="input"
            value={v.bathrooms ?? ""}
            onChange={(e) => set("bathrooms", e.target.value as never)}
          />
        </div>
        <div>
          <label className="label">Charges (€/mois)</label>
          <input
            type="number"
            className="input"
            value={v.charges ?? ""}
            onChange={(e) => set("charges", e.target.value as never)}
          />
        </div>
        <div>
          <label className="label">Loyer (€/mois)</label>
          <input
            type="number"
            className="input"
            value={v.rentPrice ?? ""}
            onChange={(e) => set("rentPrice", e.target.value as never)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Prix de vente (€)</label>
          <input
            type="number"
            className="input"
            value={v.price ?? ""}
            onChange={(e) => set("price", e.target.value as never)}
            placeholder="245000"
          />
        </div>
        <div>
          <label className="label">Image de couverture (URL)</label>
          <input
            className="input"
            value={v.coverImage ?? ""}
            onChange={(e) => set("coverImage", e.target.value)}
            placeholder="https://…"
          />
        </div>
      </div>

      <div>
        <label className="label">Description</label>
        <textarea
          className="input min-h-[90px] resize-y"
          value={v.description ?? ""}
          onChange={(e) => set("description", e.target.value)}
          placeholder="Descriptif de l'unité, agencement, particularités…"
        />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button type="button" className="btn-ghost" onClick={onDone}>
          Annuler
        </button>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          {isEdit ? "Enregistrer" : "Ajouter l'unité"}
        </button>
      </div>
    </form>
  );
}
