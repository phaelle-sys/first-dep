import { notFound } from "next/navigation";
import { MapPin, DoorOpen } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Breadcrumb, Field } from "@/components/ui";
import { PropertyIcon } from "@/components/PropertyIcon";
import { BienStatusBadge, TypeBadge } from "@/components/StatusBadge";
import { BienActions } from "@/components/BienActions";
import { AddUnitButton } from "@/components/AddUnitButton";
import { UnitCard } from "@/components/Cards";
import { DocumentManager } from "@/components/DocumentManager";
import { PhotoManager } from "@/components/PhotoManager";
import { UnitStatusBreakdown } from "@/components/UnitStatusBreakdown";
import { formatPrice, formatSurface } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function BienPage({
  params,
}: {
  params: { id: string };
}) {
  const bien = await prisma.bien.findUnique({
    where: { id: params.id },
    include: {
      units: { orderBy: { createdAt: "asc" } },
      documents: { orderBy: { createdAt: "desc" } },
      photos: { orderBy: { position: "asc" } },
    },
  });

  if (!bien) notFound();

  return (
    <div className="space-y-8">
      <Breadcrumb
        items={[{ label: "Biens", href: "/biens" }, { label: bien.name }]}
      />

      {/* En-tête */}
      <div className="card overflow-hidden p-0">
        <div className="relative h-52 bg-ink-900 sm:h-64">
          {bien.coverImage ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={bien.coverImage}
              alt={bien.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <PropertyIcon
                type={bien.type}
                className="h-16 w-16 text-slate-700"
              />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-ink-850 via-ink-850/30 to-transparent" />
          <div className="absolute bottom-4 left-5 right-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <BienStatusBadge status={bien.status} />
                <TypeBadge type={bien.type} />
              </div>
              <h1 className="text-2xl font-semibold tracking-tight text-white drop-shadow">
                {bien.name}
              </h1>
              {(bien.address || bien.city) && (
                <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-300">
                  <MapPin className="h-4 w-4" />
                  {[bien.address, bien.postalCode, bien.city]
                    .filter(Boolean)
                    .join(", ")}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/5 px-5 py-4">
          <div className="grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-4">
            <Field label="Prix global">{formatPrice(bien.price)}</Field>
            <Field label="Surface">{formatSurface(bien.surface)}</Field>
            <Field label="Unités">{bien.units.length}</Field>
            <Field label="Référence">{bien.reference ?? "—"}</Field>
          </div>
          <BienActions bien={bien} />
        </div>
      </div>

      {bien.description && (
        <div className="card p-5">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-300">
            Description
          </h2>
          <p className="whitespace-pre-line text-sm leading-relaxed text-slate-300">
            {bien.description}
          </p>
        </div>
      )}

      {/* Unités */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-300">
            <DoorOpen className="h-4 w-4" /> Unités ({bien.units.length})
          </h2>
          <AddUnitButton bienId={bien.id} />
        </div>

        {bien.units.length > 0 && (
          <div className="mb-4">
            <UnitStatusBreakdown units={bien.units} />
          </div>
        )}

        {bien.units.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-ink-900/40 px-6 py-12 text-center">
            <DoorOpen className="mx-auto mb-3 h-8 w-8 text-slate-600" />
            <p className="text-sm font-medium text-slate-300">
              Aucune unité pour ce bien
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Un immeuble peut être divisé en plusieurs unités autonomes
              (appartements, studios, commerces…).
            </p>
            <div className="mt-4">
              <AddUnitButton bienId={bien.id} />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {bien.units.map((u) => (
              <UnitCard key={u.id} unit={u} />
            ))}
          </div>
        )}
      </section>

      {/* Documents & photos du bien */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="card p-5">
          <DocumentManager documents={bien.documents} bienId={bien.id} />
        </div>
        <div className="card p-5">
          <PhotoManager photos={bien.photos} bienId={bien.id} />
        </div>
      </div>
    </div>
  );
}
