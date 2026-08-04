"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ImageIcon, Plus, Trash2, Upload, Loader2 } from "lucide-react";
import { Modal } from "./Modal";
import { EmptyState } from "./ui";

type Photo = {
  id: string;
  url: string;
  caption?: string | null;
  source: string;
};

export function PhotoManager({
  photos,
  bienId,
  unitId,
}: {
  photos: Photo[];
  bienId?: string;
  unitId?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ url: "", caption: "" });
  const [lightbox, setLightbox] = useState<string | null>(null);

  async function upload(file: File) {
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Échec de l'upload");
      setForm((f) => ({ ...f, url: data.url }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setUploading(false);
    }
  }

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/photos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, bienId, unitId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur");
      setForm({ url: "", caption: "" });
      setOpen(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Supprimer cette photo ?")) return;
    await fetch(`/api/photos?id=${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-300">
          <ImageIcon className="h-4 w-4" /> Photos ({photos.length})
        </h2>
        <button onClick={() => setOpen(true)} className="btn-ghost text-xs">
          <Plus className="h-3.5 w-3.5" /> Ajouter
        </button>
      </div>

      {photos.length === 0 ? (
        <EmptyState
          icon={<ImageIcon className="h-8 w-8" />}
          title="Aucune photo"
          description="Ajoutez des visuels du bien ou de l'unité."
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {photos.map((p) => (
            <div
              key={p.id}
              className="group relative aspect-[4/3] overflow-hidden rounded-xl border border-white/5 bg-ink-900"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.url}
                alt={p.caption ?? "Photo"}
                className="h-full w-full cursor-pointer object-cover transition group-hover:scale-105"
                onClick={() => setLightbox(p.url)}
              />
              <button
                onClick={() => remove(p.id)}
                className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-lg bg-black/60 text-white opacity-0 backdrop-blur transition hover:bg-red-500/80 group-hover:opacity-100"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
              {p.caption && (
                <p className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/80 to-transparent px-2 py-1.5 text-xs text-white">
                  {p.caption}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Ajouter une photo">
        <form onSubmit={add} className="space-y-4">
          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-300">
              {error}
            </div>
          )}
          <label className="btn-ghost flex cursor-pointer items-center justify-center gap-2">
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            {uploading ? "Envoi…" : "Téléverser une image"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) upload(f);
              }}
            />
          </label>
          <div className="text-center text-xs text-slate-500">— ou URL —</div>
          <div>
            <label className="label">URL de l&apos;image *</label>
            <input
              className="input"
              value={form.url}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
              placeholder="https://…"
              required
            />
          </div>
          <div>
            <label className="label">Légende</label>
            <input
              className="input"
              value={form.caption}
              onChange={(e) => setForm({ ...form, caption: e.target.value })}
              placeholder="Façade avant"
            />
          </div>
          {form.url && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={form.url}
              alt="Aperçu"
              className="max-h-48 w-full rounded-xl object-cover"
            />
          )}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" className="btn-ghost" onClick={() => setOpen(false)}>
              Annuler
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Ajouter
            </button>
          </div>
        </form>
      </Modal>

      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-6"
          onClick={() => setLightbox(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightbox}
            alt="Photo"
            className="max-h-full max-w-full rounded-xl object-contain"
          />
        </div>
      )}
    </div>
  );
}
