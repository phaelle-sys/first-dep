import Link from "next/link";
import { notFound } from "next/navigation";
import { Building2, ArrowUpRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Breadcrumb, Field } from "@/components/ui";
import { PropertyIcon } from "@/components/PropertyIcon";
import { UnitStatusBadge, TypeBadge } from "@/components/StatusBadge";
import { UnitActions } from "@/components/UnitActions";
import { DocumentManager } from "@/components/DocumentManager";
import { PhotoManager } from "@/components/PhotoManager";
import { formatPrice, formatSurface, formatNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function UnitPage({
  params,
}: {
  params: { id: string; unitId: string };
}) {
  const unit = await prisma.unit.findUnique({
    where: { id: params.unitId },
    include: {
      bien: true,
      documents: { orderBy: { createdAt: "desc" } },
      photos: { orderBy: { position: "asc" } },
    },
  });

  if (!unit || unit.bienId !== params.id) notFound();

  return (
    <div className="space-y-8">
      <Breadcrumb
        items={[
          { label: "Biens", href: "/biens" },
          { label: unit.bien.name, href: `/biens/${unit.bien.id}` },
          { label: unit.name },
        ]}
      />

      {/* En-tête unité */}
      <div className="card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            {unit.coverImage ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={unit.coverImage}
                alt={unit.name}
                className="h-20 w-20 rounded-2xl object-cover"
              />
            ) : (
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-white/5">
                <PropertyIcon
                  type={unit.type}
                  className="h-9 w-9 text-brand-400"
                />
              </div>
            )}
            <div>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <UnitStatusBadge status={unit.status} />
                <TypeBadge type={unit.type} />
                {unit.reference && (
                  <span className="text-xs text-slate-500">
                    Réf. {unit.reference}
                  </span>
                )}
              </div>
              <h1 className="text-2xl font-semibold tracking-tight text-white">
                {unit.name}
              </h1>
              <Link
                href={`/biens/${unit.bien.id}`}
                className="mt-1 inline-flex items-center gap-1.5 text-sm text-slate-400 transition hover:text-brand-300"
              >
                <Building2 className="h-3.5 w-3.5" />
                {unit.bien.name}
                <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
          <UnitActions
            unit={unit}
            redirectAfterDelete={`/biens/${unit.bien.id}`}
          />
        </div>

        {/* Prix mis en avant */}
        <div className="mt-6 flex flex-wrap gap-6 border-t border-white/5 pt-5">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Prix de vente
            </p>
            <p className="text-2xl font-semibold text-gold-400">
              {formatPrice(unit.price)}
            </p>
          </div>
          {unit.rentPrice != null && (
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Loyer
              </p>
              <p className="text-2xl font-semibold text-teal-300">
                {formatPrice(unit.rentPrice)}
                <span className="text-sm text-slate-500"> /mois</span>
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Caractéristiques */}
      <div className="card p-5">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-300">
          Caractéristiques
        </h2>
        <div className="grid grid-cols-2 gap-x-8 gap-y-5 sm:grid-cols-3 lg:grid-cols-4">
          <Field label="Étage">{unit.floor ?? "—"}</Field>
          <Field label="Surface">{formatSurface(unit.surface)}</Field>
          <Field label="Pièces">{formatNumber(unit.rooms)}</Field>
          <Field label="Chambres">{formatNumber(unit.bedrooms)}</Field>
          <Field label="Salles de bain">{formatNumber(unit.bathrooms)}</Field>
          <Field label="PEB">{unit.epcScore ?? "—"}</Field>
          <Field label="Charges">
            {unit.charges != null ? `${formatPrice(unit.charges)}/mois` : "—"}
          </Field>
          <Field label="Type">{<TypeBadge type={unit.type} />}</Field>
        </div>
      </div>

      {unit.description && (
        <div className="card p-5">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-300">
            Description
          </h2>
          <p className="whitespace-pre-line text-sm leading-relaxed text-slate-300">
            {unit.description}
          </p>
        </div>
      )}

      {/* Documents & photos propres à l'unité */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="card p-5">
          <DocumentManager documents={unit.documents} unitId={unit.id} />
        </div>
        <div className="card p-5">
          <PhotoManager photos={unit.photos} unitId={unit.id} />
        </div>
      </div>
    </div>
  );
}
