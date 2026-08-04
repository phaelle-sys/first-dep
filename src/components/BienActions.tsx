"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, CloudDownload, Loader2 } from "lucide-react";
import { Modal } from "./Modal";
import { BienForm, type BienFormValues } from "./BienForm";

export function BienActions({ bien }: { bien: BienFormValues }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<{ ok: boolean; text: string } | null>(
    null
  );

  async function sync() {
    setSyncing(true);
    setSyncMsg(null);
    try {
      const res = await fetch(`/api/biens/${bien.id}/sync`, { method: "POST" });
      const data = await res.json();
      setSyncMsg({ ok: res.ok && data.status !== "ERROR", text: data.message });
      router.refresh();
    } catch {
      setSyncMsg({ ok: false, text: "Échec de la synchronisation." });
    } finally {
      setSyncing(false);
    }
  }

  async function remove() {
    if (!confirm(`Supprimer définitivement « ${bien.name} » et toutes ses unités ?`))
      return;
    await fetch(`/api/biens/${bien.id}`, { method: "DELETE" });
    router.push("/biens");
    router.refresh();
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button onClick={sync} className="btn-ghost" disabled={syncing}>
        {syncing ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <CloudDownload className="h-4 w-4" />
        )}
        Synchroniser Drive
      </button>
      <button onClick={() => setEditing(true)} className="btn-ghost">
        <Pencil className="h-4 w-4" /> Modifier
      </button>
      <button onClick={remove} className="btn-danger">
        <Trash2 className="h-4 w-4" /> Supprimer
      </button>

      {syncMsg && (
        <span
          className={`w-full text-xs sm:w-auto ${
            syncMsg.ok ? "text-emerald-400" : "text-amber-400"
          }`}
        >
          {syncMsg.text}
        </span>
      )}

      <Modal
        open={editing}
        onClose={() => setEditing(false)}
        title="Modifier le bien"
        wide
      >
        <BienForm initial={bien} onDone={() => setEditing(false)} />
      </Modal>
    </div>
  );
}
