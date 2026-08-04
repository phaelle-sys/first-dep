"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import {
  propertyTypeOptions,
  bienStatusOptions,
} from "@/lib/enums";

export type BienFormValues = {
  id?: string;
  name?: string;
  reference?: string | null;
  type?: string;
  status?: string;
  address?: string | null;
  city?: string | null;
  postalCode?: string | null;
  country?: string | null;
  description?: string | null;
  price?: number | null;
  surface?: number | null;
  yearBuilt?: number | null;
  coverImage?: string | null;
  driveFolderId?: string | null;
};

export function BienForm({
  initial,
  onDone,
}: {
  initial?: BienFormValues;
  onDone?: () => void;
}) {
  const router = useRouter();
  const isEdit = Boolean(initial?.id);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [v, setV] = useState<BienFormValues>({
    name: "",
    type: "IMMEUBLE",
    status: "EN_PREPARATION",
    country: "Belgique",
    ...initial,
  });

  function set<K extends keyof BienFormValues>(k: K, val: BienFormValues[K]) {
    setV((prev) => ({ ...prev, [k]: val }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const res = await fetch(
        isEdit ? `/api/biens/${initial!.id}` : "/api/biens",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(v),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur");
      router.refresh();
      if (onDone) onDone();
      else router.push(`/biens/${data.bien.id}`);
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

      <div>
        <label className="label">Nom du bien *</label>
        <input
          className="input"
          value={v.name ?? ""}
          onChange={(e) => set("name", e.target.value)}
          placeholder="Ex : Résidence des Terrasses"
          required
        />
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
          <label className="label">Statut</label>
          <select
            className="input"
            value={v.status}
            onChange={(e) => set("status", e.target.value)}
          >
            {bienStatusOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Référence</label>
          <input
            className="input"
            value={v.reference ?? ""}
            onChange={(e) => set("reference", e.target.value)}
            placeholder="IMM-2024-001"
          />
        </div>
        <div>
          <label className="label">Année de construction</label>
          <input
            type="number"
            className="input"
            value={v.yearBuilt ?? ""}
            onChange={(e) => set("yearBuilt", e.target.value as never)}
            placeholder="1962"
          />
        </div>
      </div>

      <div>
        <label className="label">Adresse</label>
        <input
          className="input"
          value={v.address ?? ""}
          onChange={(e) => set("address", e.target.value)}
          placeholder="Rue Saint-Gilles 84"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label className="label">Code postal</label>
          <input
            className="input"
            value={v.postalCode ?? ""}
            onChange={(e) => set("postalCode", e.target.value)}
            placeholder="4000"
          />
        </div>
        <div>
          <label className="label">Ville</label>
          <input
            className="input"
            value={v.city ?? ""}
            onChange={(e) => set("city", e.target.value)}
            placeholder="Liège"
          />
        </div>
        <div>
          <label className="label">Pays</label>
          <input
            className="input"
            value={v.country ?? ""}
            onChange={(e) => set("country", e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Prix global (€)</label>
          <input
            type="number"
            className="input"
            value={v.price ?? ""}
            onChange={(e) => set("price", e.target.value as never)}
            placeholder="1450000"
          />
        </div>
        <div>
          <label className="label">Surface totale (m²)</label>
          <input
            type="number"
            className="input"
            value={v.surface ?? ""}
            onChange={(e) => set("surface", e.target.value as never)}
            placeholder="620"
          />
        </div>
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

      <div>
        <label className="label">Dossier Google Drive (ID)</label>
        <input
          className="input"
          value={v.driveFolderId ?? ""}
          onChange={(e) => set("driveFolderId", e.target.value)}
          placeholder="1AbCdEf… (pour la synchro automatique)"
        />
      </div>

      <div>
        <label className="label">Description</label>
        <textarea
          className="input min-h-[100px] resize-y"
          value={v.description ?? ""}
          onChange={(e) => set("description", e.target.value)}
          placeholder="Descriptif du bien, travaux réalisés, particularités…"
        />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        {onDone && (
          <button type="button" className="btn-ghost" onClick={onDone}>
            Annuler
          </button>
        )}
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          {isEdit ? "Enregistrer" : "Créer le bien"}
        </button>
      </div>
    </form>
  );
}
