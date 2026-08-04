"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FolderInput, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";

type Phase = "idle" | "biens" | "files" | "done" | "error";

export function RootImport({
  defaultFolderId,
  disabled,
}: {
  defaultFolderId?: string;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [folderId, setFolderId] = useState(defaultFolderId ?? "");
  const [phase, setPhase] = useState<Phase>("idle");
  const [progress, setProgress] = useState({ done: 0, total: 0, current: "" });
  const [summary, setSummary] = useState<{
    docs: number;
    photos: number;
    failed: string[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const running = phase === "biens" || phase === "files";

  async function run() {
    setError(null);
    setSummary(null);
    setPhase("biens");
    setProgress({ done: 0, total: 0, current: "Création des biens…" });

    try {
      // Phase 1 — créer/compléter les biens depuis le dossier racine.
      const res = await fetch("/api/import/drive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rootFolderId: folderId }),
      });
      const data = await res.json();
      if (!res.ok || data.status === "ERROR") {
        throw new Error(data.message ?? "Échec de la création des biens.");
      }
      const biens: { id: string; name: string }[] = data.biens ?? [];
      router.refresh();

      // Phase 2 — synchroniser les fichiers, bien par bien.
      setPhase("files");
      let docs = 0;
      let photos = 0;
      const failed: string[] = [];

      for (let i = 0; i < biens.length; i++) {
        const b = biens[i];
        setProgress({ done: i, total: biens.length, current: b.name });
        try {
          const r = await fetch(`/api/biens/${b.id}/sync`, { method: "POST" });
          const d = await r.json();
          if (r.ok && d.status !== "ERROR") {
            docs += d.filesAdded ?? 0;
            photos += d.photosAdded ?? 0;
          } else {
            failed.push(b.name);
          }
        } catch {
          failed.push(b.name);
        }
        setProgress({ done: i + 1, total: biens.length, current: b.name });
        router.refresh();
      }

      setSummary({ docs, photos, failed });
      setPhase("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue.");
      setPhase("error");
    }
  }

  const pct =
    progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0;

  return (
    <div className="card p-5">
      <h2 className="mb-1 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-300">
        <FolderInput className="h-4 w-4" /> Import automatique du portefeuille
      </h2>
      <p className="mb-4 max-w-2xl text-sm text-slate-400">
        Indiquez l&apos;ID du dossier racine{" "}
        <code className="rounded bg-ink-700 px-1.5 py-0.5 text-xs text-brand-300">
          immobilier
        </code>
        . L&apos;app crée un bien par sous-dossier d&apos;adresse (
        <code className="rounded bg-ink-700 px-1 text-xs text-brand-300">
          CODE - Adresse
        </code>
        ), puis importe les documents et photos de chaque bien, un par un.
        Relançable à tout moment, sans doublon.
      </p>

      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          className="input flex-1 font-mono text-xs"
          value={folderId}
          onChange={(e) => setFolderId(e.target.value)}
          placeholder="ID du dossier Drive racine"
          disabled={running}
        />
        <button
          onClick={run}
          className="btn-primary shrink-0"
          disabled={running || disabled || !folderId.trim()}
        >
          {running ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <FolderInput className="h-4 w-4" />
          )}
          {running ? "Import en cours…" : "Importer le portefeuille"}
        </button>
      </div>

      {disabled && (
        <p className="mt-3 text-xs text-amber-400">
          Configurez d&apos;abord Google Drive pour lancer l&apos;import.
        </p>
      )}

      {/* Progression */}
      {running && (
        <div className="mt-4">
          <div className="mb-1.5 flex justify-between text-xs text-slate-400">
            <span>
              {phase === "biens"
                ? "Création des biens…"
                : `Import des fichiers — ${progress.current}`}
            </span>
            {progress.total > 0 && (
              <span>
                {progress.done}/{progress.total}
              </span>
            )}
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-ink-700">
            <div
              className="h-full bg-brand-500 transition-all duration-300"
              style={{ width: `${phase === "biens" ? 8 : pct}%` }}
            />
          </div>
        </div>
      )}

      {/* Résultat */}
      {phase === "done" && summary && (
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p>
              Import terminé : {summary.docs} document(s) et {summary.photos}{" "}
              photo(s) importés.
            </p>
            {summary.failed.length > 0 && (
              <p className="mt-1 text-amber-300">
                À relancer pour : {summary.failed.join(", ")}.
              </p>
            )}
          </div>
        </div>
      )}

      {phase === "error" && error && (
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
