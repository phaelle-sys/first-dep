import {
  Building2,
  Building,
  Home,
  DoorOpen,
  BedDouble,
  Store,
  Car,
  Warehouse,
  Trees,
  type LucideProps,
} from "lucide-react";
import { PROPERTY_TYPES, type PropertyType } from "@/lib/enums";

const ICONS: Record<string, React.ComponentType<LucideProps>> = {
  Building2,
  Building,
  Home,
  DoorOpen,
  BedDouble,
  Store,
  Car,
  Warehouse,
  Trees,
};

export function PropertyIcon({
  type,
  ...props
}: { type?: string | null } & LucideProps) {
  const meta = PROPERTY_TYPES[type as PropertyType];
  const Icon = meta ? ICONS[meta.icon] ?? Building : Building;
  return <Icon {...props} />;
}
