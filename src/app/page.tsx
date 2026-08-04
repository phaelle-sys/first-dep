import Link from "next/link";
import {
  Building2,
  DoorOpen,
  CheckCircle2,
  Wallet,
  ArrowRight,
  Bell,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { StatTile } from "@/components/ui";
import { BienCard } from "@/components/Cards";
import { ProjectTable } from "@/components/ProjectTable";
import { NotifIcon, notifMeta } from "@/components/NotifIcon";
import { formatPrice, timeAgo } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [biens, unitStats, notifications] = await Promise.all([
    prisma.bien.findMany({
      include: {
        _count: { select: { units: true } },
        units: { select: { status: true, price: true } },
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.unit.groupBy({
      by: ["status"],
      _count: { _all: true },
      _sum: { price: true },
    }),
    prisma.notification.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
  ]);

  const totalUnits = unitStats.reduce((s, r) => s + r._count._all, 0);
  const available =
    unitStats.find((r) => r.status === "DISPONIBLE")?._count._all ?? 0;

  // Valeur du portefeuille = somme des prix d'unités non vendues.
  const portfolioValue = unitStats
    .filter((r) => r.status !== "VENDU")
    .reduce((s, r) => s + (r._sum.price ?? 0), 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-white">
          Tableau de bord
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Vue d&apos;ensemble de votre portefeuille immobilier.
        </p>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Biens"
          value={biens.length}
          icon={<Building2 className="h-5 w-5" />}
          accent="brand"
        />
        <StatTile
          label="Unités"
          value={totalUnits}
          icon={<DoorOpen className="h-5 w-5" />}
          accent="violet"
        />
        <StatTile
          label="Disponibles"
          value={available}
          icon={<CheckCircle2 className="h-5 w-5" />}
          accent="emerald"
        />
        <StatTile
          label="Valeur portefeuille"
          value={formatPrice(portfolioValue)}
          sub="unités non vendues"
          icon={<Wallet className="h-5 w-5" />}
          accent="gold"
        />
      </div>

      {/* État des projets */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-300">
            État des projets
          </h2>
          <Link
            href="/biens"
            className="flex items-center gap-1 text-xs text-brand-300 hover:text-brand-200"
          >
            Tous les biens <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <ProjectTable biens={biens} />
      </section>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Biens récents */}
        <section className="lg:col-span-2">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-300">
            Biens récents
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {biens.slice(0, 4).map((b) => (
              <BienCard key={b.id} bien={b} />
            ))}
          </div>
        </section>

        {/* Activité */}
        <section>
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-300">
            <Bell className="h-4 w-4" /> Activité récente
          </h2>
          <div className="card space-y-1 p-2">
            {notifications.length === 0 ? (
              <p className="px-3 py-8 text-center text-sm text-slate-500">
                Aucune activité pour le moment.
              </p>
            ) : (
              notifications.map((n) => {
                const meta = notifMeta(n.type);
                return (
                  <Link
                    key={n.id}
                    href={n.href ?? "/notifications"}
                    className="flex gap-3 rounded-xl px-3 py-2.5 transition hover:bg-white/5"
                  >
                    <NotifIcon
                      type={n.type}
                      className={`mt-0.5 h-4 w-4 shrink-0 ${meta.color}`}
                    />
                    <div className="min-w-0">
                      <p className="text-sm text-slate-100">{n.title}</p>
                      <p className="text-[11px] text-slate-500">
                        {timeAgo(n.createdAt)}
                      </p>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
