"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FolderInput, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";

export function RootImport({
  defaultFolderId,
  disabled,
}: {
  defaultFolderId?: string;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [folderId, setFolderId] = useState(defaultFolderId ?? "");
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(
    null
  );

  async function run() {
    setRunning(true);
    setResult(null);
    try {
      const res = await fetch("/api/import/drive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rootFolderId: folderId }),
      });
      const data = await res.json();
      setResult({ ok: res.ok && data.status !== "ERROR", text: data.message });
      router.refresh();
    } catch {
      setResult({ ok: false, text: "Échec de l'import." });
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="card p-5">
      <h2 className="mb-1 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-300">
        <FolderInput className="h-4 w-4" /> Import automatique du portefeuille
      </h2>
      <p className="mb-4 max-w-2xl text-sm text-slate-400">
        Indiquez l&apos;ID du dossier racine <code className="rounded bg-ink-700 px-1.5 py-0.5 text-xs text-brand-300">immobilier</code>.
        L&apos;app parcourt chaque sous-dossier d&apos;adresse, crée un bien
        (référence + adresse déduites du nom <code className="rounded bg-ink-700 px-1 text-xs text-brand-300">CODE - Adresse</code>)
        et importe ses documents et photos. Relançable à tout moment : les
        fichiers déjà importés ne sont pas dupliqués.
      </p>

      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          className="input flex-1 font-mono text-xs"
          value={folderId}
          onChange={(e) => setFolderId(e.target.value)}
          placeholder="ID du dossier Drive racine (ex. 1bWvmA6jJqlvY2q-uaFww2D-q-3vi5gAt)"
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
          Importer le portefeuille
        </button>
      </div>

      {disabled && (
        <p className="mt-3 text-xs text-amber-400">
          Configurez d&apos;abord Google Drive (ci-dessus) pour lancer
          l&apos;import.
        </p>
      )}

      {result && (
        <div
          className={`mt-4 flex items-start gap-2 rounded-xl border px-4 py-3 text-sm ${
            result.ok
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
              : "border-amber-500/30 bg-amber-500/10 text-amber-300"
          }`}
        >
          {result.ok ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          ) : (
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          )}
          <span>{result.text}</span>
        </div>
      )}
    </div>
  );
}
