"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CloudDownload, Loader2 } from "lucide-react";

export function SyncAllButton({
  bienIds,
}: {
  bienIds: string[];
}) {
  const router = useRouter();
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function run() {
    setRunning(true);
    setResult(null);
    let added = 0;
    let errors = 0;
    for (const id of bienIds) {
      try {
        const res = await fetch(`/api/biens/${id}/sync`, { method: "POST" });
        const data = await res.json();
        added += (data.filesAdded ?? 0) + (data.photosAdded ?? 0);
        if (data.status === "ERROR") errors++;
      } catch {
        errors++;
      }
    }
    setResult(
      `Synchronisation terminée : ${added} fichier(s) importé(s)` +
        (errors ? `, ${errors} erreur(s).` : ".")
    );
    setRunning(false);
    router.refresh();
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        onClick={run}
        className="btn-primary"
        disabled={running || bienIds.length === 0}
      >
        {running ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <CloudDownload className="h-4 w-4" />
        )}
        Tout synchroniser
      </button>
      {result && <span className="text-sm text-emerald-400">{result}</span>}
    </div>
  );
}
