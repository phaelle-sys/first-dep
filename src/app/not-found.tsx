import Link from "next/link";
import { Building2 } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <Building2 className="mb-4 h-14 w-14 text-slate-700" />
      <h1 className="text-2xl font-semibold text-white">Page introuvable</h1>
      <p className="mt-2 max-w-sm text-sm text-slate-400">
        Le bien ou l&apos;unité que vous cherchez n&apos;existe pas ou a été
        supprimé.
      </p>
      <Link href="/" className="btn-primary mt-6">
        Retour au tableau de bord
      </Link>
    </div>
  );
}
