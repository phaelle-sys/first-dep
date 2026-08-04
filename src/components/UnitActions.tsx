"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import { Modal } from "./Modal";
import { UnitForm, type UnitFormValues } from "./UnitForm";

export function UnitActions({
  unit,
  redirectAfterDelete,
}: {
  unit: UnitFormValues;
  redirectAfterDelete?: string;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);

  async function remove() {
    if (!confirm(`Supprimer l'unité « ${unit.name} » ?`)) return;
    await fetch(`/api/units/${unit.id}`, { method: "DELETE" });
    if (redirectAfterDelete) router.push(redirectAfterDelete);
    router.refresh();
  }

  return (
    <div className="flex items-center gap-2">
      <button onClick={() => setEditing(true)} className="btn-ghost">
        <Pencil className="h-4 w-4" /> Modifier
      </button>
      <button onClick={remove} className="btn-danger">
        <Trash2 className="h-4 w-4" /> Supprimer
      </button>
      <Modal
        open={editing}
        onClose={() => setEditing(false)}
        title="Modifier l'unité"
        wide
      >
        <UnitForm initial={unit} onDone={() => setEditing(false)} />
      </Modal>
    </div>
  );
}
