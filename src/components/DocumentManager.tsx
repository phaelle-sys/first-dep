"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  Plus,
  Trash2,
  ExternalLink,
  Upload,
  Loader2,
  CloudDownload,
} from "lucide-react";
import { Modal } from "./Modal";
import { EmptyState } from "./ui";
import {
  documentCategoryOptions,
  documentCategoryLabel,
} from "@/lib/enums";
import { formatDate } from "@/lib/utils";

type Doc = {
  id: string;
  name: string;
  url: string;
  category?: string | null;
  source: string;
  createdAt: string | Date;
};

export function DocumentManager({
  documents,
  bienId,
  unitId,
}: {
  documents: Doc[];
  bienId?: string;
  unitId?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    url: "",
    category: "AUTRE",
    mimeType: "",
    size: 0,
  });

  async function upload(file: File) {
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Échec de l'upload");
      setForm((f) => ({
        ...f,
        name: f.name || data.name,
        url: data.url,
        mimeType: data.mimeType,
        size: data.size,
      }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setUploading(false);
    }
  }

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, bienId, unitId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur");
      setForm({ name: "", url: "", category: "AUTRE", mimeType: "", size: 0 });
      setOpen(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Supprimer ce document ?")) return;
    await fetch(`/api/documents?id=${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-300">
          <FileText className="h-4 w-4" /> Documents ({documents.length})
        </h2>
        <button onClick={() => setOpen(true)} className="btn-ghost text-xs">
          <Plus className="h-3.5 w-3.5" /> Ajouter
        </button>
      </div>

      {documents.length === 0 ? (
        <EmptyState
          icon={<FileText className="h-8 w-8" />}
          title="Aucun document"
          description="Ajoutez des plans, contrats, PEB… manuellement ou via la synchronisation Drive."
        />
      ) : (
        <ul className="space-y-2">
          {documents.map((d) => (
            <li
              key={d.id}
              className="group flex items-center gap-3 rounded-xl border border-white/5 bg-ink-900/40 px-3.5 py-2.5"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/5">
                {d.source === "DRIVE" ? (
                  <CloudDownload className="h-4 w-4 text-teal-400" />
                ) : (
                  <FileText className="h-4 w-4 text-brand-400" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-slate-100">{d.name}</p>
                <p className="text-xs text-slate-500">
                  {documentCategoryLabel(d.category)} · {formatDate(d.createdAt)}
                  {d.source === "DRIVE" && " · Drive"}
                </p>
              </div>
              <a
                href={d.url}
                target="_blank"
                rel="noreferrer"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white/10 hover:text-white"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
              <button
                onClick={() => remove(d.id)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 opacity-0 transition hover:bg-red-500/10 hover:text-red-300 group-hover:opacity-100"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Ajouter un document">
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
            {uploading ? "Envoi…" : "Téléverser un fichier"}
            <input
              type="file"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) upload(f);
              }}
            />
          </label>

          <div className="text-center text-xs text-slate-500">
            — ou renseignez une URL —
          </div>

          <div>
            <label className="label">Nom *</label>
            <input
              className="input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="PEB - Résidence.pdf"
              required
            />
          </div>
          <div>
            <label className="label">URL / lien *</label>
            <input
              className="input"
              value={form.url}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
              placeholder="https://… ou /uploads/…"
              required
            />
          </div>
          <div>
            <label className="label">Catégorie</label>
            <select
              className="input"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              {documentCategoryOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

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
    </div>
  );
}
