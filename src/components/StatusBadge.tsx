import { Badge } from "./ui";
import {
  bienStatusMeta,
  unitStatusMeta,
  propertyTypeLabel,
} from "@/lib/enums";

export function BienStatusBadge({ status }: { status?: string | null }) {
  const m = bienStatusMeta(status);
  return (
    <Badge className={m.color} dot={m.dot}>
      {m.label}
    </Badge>
  );
}

export function UnitStatusBadge({ status }: { status?: string | null }) {
  const m = unitStatusMeta(status);
  return (
    <Badge className={m.color} dot={m.dot}>
      {m.label}
    </Badge>
  );
}

export function TypeBadge({ type }: { type?: string | null }) {
  return (
    <Badge className="border-white/10 bg-white/5 text-slate-300">
      {propertyTypeLabel(type)}
    </Badge>
  );
}
