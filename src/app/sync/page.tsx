import Link from "next/link";
import {
  CheckCircle2,
  AlertTriangle,
  CloudCog,
  FolderSync,
  XCircle,
  MinusCircle,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { isDriveConfigured } from "@/lib/drive";
import { SyncAllButton } from "@/components/SyncAllButton";
import { RootImport } from "@/components/RootImport";
import { PropertyIcon } from "@/components/PropertyIcon";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function SyncPage() {
  const configured = isDriveConfigured();
  const [biens, logs] = await Promise.all([
    prisma.bien.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        type: true,
        driveFolderId: true,
        city: true,
      },
    }),
    prisma.syncLog.findMany({ orderBy: { createdAt: "desc" }, take: 15 }),
  ]);

  const linked = biens.filter((b) => b.driveFolderId);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-white">
          Synchronisation Drive
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Importez automatiquement documents et photos depuis vos dossiers
          Google Drive.
        </p>
      </div>

      {/* État de la configuration */}
      <div
        className={`card flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between ${
          configured
            ? "border-emerald-500/20"
            : "border-amber-500/20"
        }`}
      >
        <div className="flex items-start gap-4">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
              configured
                ? "bg-emerald-500/10 text-emerald-400"
                : "bg-amber-500/10 text-amber-400"
            }`}
          >
            {configured ? (
              <CheckCircle2 className="h-6 w-6" />
            ) : (
              <AlertTriangle className="h-6 w-6" />
            )}
          </div>
          <div>
            <p className="font-semibold text-white">
              {configured
                ? "Google Drive connecté"
                : "Google Drive non configuré"}
            </p>
            <p className="mt-0.5 max-w-xl text-sm text-slate-400">
              {configured
                ? "La synchronisation est active. Associez un dossier Drive à chaque bien pour importer ses fichiers."
                : "Renseignez vos identifiants dans le fichier .env (compte de service ou OAuth) pour activer la synchronisation automatique. L'application reste pleinement utilisable en saisie manuelle."}
            </p>
          </div>
        </div>
        {configured && linked.length > 0 && (
          <SyncAllButton bienIds={linked.map((b) => b.id)} />
        )}
      </div>

      {/* Import automatique depuis le dossier racine */}
      <RootImport
        defaultFolderId={process.env.DRIVE_ROOT_FOLDER_ID ?? ""}
        disabled={!configured}
      />

      {!configured && (
        <div className="card p-5">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-300">
            <CloudCog className="h-4 w-4" /> Configuration
          </h2>
          <ol className="space-y-2 text-sm text-slate-400">
            <li>
              1. Créez un compte de service Google Cloud avec l&apos;API Drive
              activée (ou un client OAuth).
            </li>
            <li>
              2. Partagez vos dossiers Drive avec l&apos;adresse du compte de
              service.
            </li>
            <li>
              3. Renseignez{" "}
              <code className="rounded bg-ink-700 px-1.5 py-0.5 text-xs text-brand-300">
                GOOGLE_SERVICE_ACCOUNT_JSON
              </code>{" "}
              dans{" "}
              <code className="rounded bg-ink-700 px-1.5 py-0.5 text-xs text-brand-300">
                .env
              </code>{" "}
              puis redémarrez.
            </li>
            <li>
              4. Ajoutez l&apos;ID du dossier Drive sur chaque bien (champ
              « Dossier Google Drive »).
            </li>
          </ol>
        </div>
      )}

      {/* Biens & leur liaison Drive */}
      <section>
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-300">
          <FolderSync className="h-4 w-4" /> Biens & dossiers Drive
        </h2>
        <div className="card divide-y divide-white/5 p-0">
          {biens.map((b) => (
            <div
              key={b.id}
              className="flex items-center gap-4 px-5 py-3.5"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5">
                <PropertyIcon type={b.type} className="h-4 w-4 text-brand-400" />
              </div>
              <div className="min-w-0 flex-1">
                <Link
                  href={`/biens/${b.id}`}
                  className="font-medium text-slate-100 hover:text-brand-200"
                >
                  {b.name}
                </Link>
                <p className="truncate text-xs text-slate-500">
                  {b.driveFolderId
                    ? `Dossier : ${b.driveFolderId}`
                    : "Aucun dossier Drive associé"}
                </p>
              </div>
              {b.driveFolderId ? (
                <span className="badge border-emerald-500/30 bg-emerald-500/15 text-emerald-300">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Lié
                </span>
              ) : (
                <span className="badge border-slate-500/30 bg-slate-500/15 text-slate-400">
                  <MinusCircle className="h-3.5 w-3.5" /> Non lié
                </span>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Journal de synchronisation */}
      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-300">
          Journal de synchronisation
        </h2>
        {logs.length === 0 ? (
          <p className="text-sm text-slate-500">
            Aucune synchronisation effectuée pour le moment.
          </p>
        ) : (
          <div className="card divide-y divide-white/5 p-0">
            {logs.map((l) => (
              <div key={l.id} className="flex items-start gap-3 px-5 py-3">
                {l.status === "SUCCESS" ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                ) : l.status === "ERROR" ? (
                  <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                ) : (
                  <MinusCircle className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-slate-200">{l.message}</p>
                  <p className="text-xs text-slate-600">
                    {formatDateTime(l.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
