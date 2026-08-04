"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Modal } from "./Modal";
import { UnitForm } from "./UnitForm";

export function AddUnitButton({ bienId }: { bienId: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-primary text-xs">
        <Plus className="h-3.5 w-3.5" /> Ajouter une unité
      </button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Nouvelle unité"
        wide
      >
        <UnitForm initial={{ bienId }} onDone={() => setOpen(false)} />
      </Modal>
    </>
  );
}
