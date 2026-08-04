import { UNIT_STATUS, type UnitStatus } from "@/lib/enums";

export function UnitStatusBreakdown({
  units,
}: {
  units: { status: string }[];
}) {
  const counts = units.reduce<Record<string, number>>((acc, u) => {
    acc[u.status] = (acc[u.status] ?? 0) + 1;
    return acc;
  }, {});

  const order: UnitStatus[] = [
    "DISPONIBLE",
    "RESERVE",
    "SOUS_COMPROMIS",
    "VENDU",
    "LOUE",
    "INDISPONIBLE",
  ];
  const present = order.filter((s) => counts[s]);
  const total = units.length || 1;

  return (
    <div className="card p-4">
      <div className="mb-3 flex h-2.5 overflow-hidden rounded-full bg-ink-700">
        {present.map((s) => (
          <div
            key={s}
            className={UNIT_STATUS[s].dot}
            style={{ width: `${(counts[s] / total) * 100}%` }}
            title={`${UNIT_STATUS[s].label}: ${counts[s]}`}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-5 gap-y-2">
        {present.map((s) => (
          <div key={s} className="flex items-center gap-1.5 text-xs">
            <span
              className={`h-2 w-2 rounded-full ${UNIT_STATUS[s].dot}`}
            />
            <span className="text-slate-400">{UNIT_STATUS[s].label}</span>
            <span className="font-semibold text-slate-200">{counts[s]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
