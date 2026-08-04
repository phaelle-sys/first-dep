// Enumérations métier centralisées (labels FR + couleurs).

export type PropertyType =
  | "IMMEUBLE_RAPPORT"
  | "IMMEUBLE"
  | "MAISON"
  | "APPARTEMENT"
  | "STUDIO"
  | "COMMERCE"
  | "GARAGE"
  | "ENTREPOT"
  | "TERRAIN";

export const PROPERTY_TYPES: Record<
  PropertyType,
  { label: string; icon: string }
> = {
  IMMEUBLE_RAPPORT: { label: "Immeuble de rapport", icon: "Building2" },
  IMMEUBLE: { label: "Immeuble", icon: "Building" },
  MAISON: { label: "Maison", icon: "Home" },
  APPARTEMENT: { label: "Appartement", icon: "DoorOpen" },
  STUDIO: { label: "Studio", icon: "BedDouble" },
  COMMERCE: { label: "Commerce", icon: "Store" },
  GARAGE: { label: "Garage", icon: "Car" },
  ENTREPOT: { label: "Entrepôt", icon: "Warehouse" },
  TERRAIN: { label: "Terrain", icon: "Trees" },
};

export function propertyTypeLabel(t?: string | null): string {
  if (!t) return "—";
  return PROPERTY_TYPES[t as PropertyType]?.label ?? t;
}

// ── Statut d'un BIEN (avancement du projet) ─────────────────
export type BienStatus =
  | "EN_PREPARATION"
  | "EN_VENTE"
  | "PARTIELLEMENT_VENDU"
  | "SOUS_COMPROMIS"
  | "VENDU"
  | "ARCHIVE";

export const BIEN_STATUS: Record<
  BienStatus,
  { label: string; color: string; dot: string }
> = {
  EN_PREPARATION: {
    label: "En préparation",
    color: "bg-slate-500/15 text-slate-300 border-slate-500/30",
    dot: "bg-slate-400",
  },
  EN_VENTE: {
    label: "En vente",
    color: "bg-brand-500/15 text-brand-300 border-brand-500/30",
    dot: "bg-brand-400",
  },
  PARTIELLEMENT_VENDU: {
    label: "Partiellement vendu",
    color: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    dot: "bg-amber-400",
  },
  SOUS_COMPROMIS: {
    label: "Sous compromis",
    color: "bg-violet-500/15 text-violet-300 border-violet-500/30",
    dot: "bg-violet-400",
  },
  VENDU: {
    label: "Vendu",
    color: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    dot: "bg-emerald-400",
  },
  ARCHIVE: {
    label: "Archivé",
    color: "bg-slate-600/15 text-slate-400 border-slate-600/30",
    dot: "bg-slate-500",
  },
};

export function bienStatusMeta(s?: string | null) {
  return (
    BIEN_STATUS[s as BienStatus] ?? {
      label: s ?? "—",
      color: "bg-slate-500/15 text-slate-300 border-slate-500/30",
      dot: "bg-slate-400",
    }
  );
}

// ── Statut d'une UNITÉ (statut de vente) ────────────────────
export type UnitStatus =
  | "DISPONIBLE"
  | "RESERVE"
  | "SOUS_COMPROMIS"
  | "VENDU"
  | "LOUE"
  | "INDISPONIBLE";

export const UNIT_STATUS: Record<
  UnitStatus,
  { label: string; color: string; dot: string }
> = {
  DISPONIBLE: {
    label: "Disponible",
    color: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    dot: "bg-emerald-400",
  },
  RESERVE: {
    label: "Réservé",
    color: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    dot: "bg-amber-400",
  },
  SOUS_COMPROMIS: {
    label: "Sous compromis",
    color: "bg-violet-500/15 text-violet-300 border-violet-500/30",
    dot: "bg-violet-400",
  },
  VENDU: {
    label: "Vendu",
    color: "bg-brand-500/15 text-brand-300 border-brand-500/30",
    dot: "bg-brand-400",
  },
  LOUE: {
    label: "Loué",
    color: "bg-teal-500/15 text-teal-300 border-teal-500/30",
    dot: "bg-teal-400",
  },
  INDISPONIBLE: {
    label: "Indisponible",
    color: "bg-slate-500/15 text-slate-400 border-slate-500/30",
    dot: "bg-slate-500",
  },
};

export function unitStatusMeta(s?: string | null) {
  return (
    UNIT_STATUS[s as UnitStatus] ?? {
      label: s ?? "—",
      color: "bg-slate-500/15 text-slate-300 border-slate-500/30",
      dot: "bg-slate-400",
    }
  );
}

// ── Catégories de documents ─────────────────────────────────
export type DocumentCategory =
  | "PLAN"
  | "CONTRAT"
  | "PEB"
  | "FINANCIER"
  | "JURIDIQUE"
  | "PHOTO"
  | "AUTRE";

export const DOCUMENT_CATEGORIES: Record<DocumentCategory, string> = {
  PLAN: "Plan",
  CONTRAT: "Contrat",
  PEB: "PEB / Énergie",
  FINANCIER: "Financier",
  JURIDIQUE: "Juridique",
  PHOTO: "Photo",
  AUTRE: "Autre",
};

export function documentCategoryLabel(c?: string | null): string {
  if (!c) return "Autre";
  return DOCUMENT_CATEGORIES[c as DocumentCategory] ?? c;
}

// ── Types de notification ───────────────────────────────────
export type NotificationType =
  | "NEW_BIEN"
  | "NEW_UNIT"
  | "NEW_DOCUMENT"
  | "STATUS_CHANGE"
  | "DRIVE_SYNC"
  | "INFO";

export const NOTIFICATION_META: Record<
  NotificationType,
  { icon: string; color: string }
> = {
  NEW_BIEN: { icon: "Building2", color: "text-brand-400" },
  NEW_UNIT: { icon: "DoorOpen", color: "text-emerald-400" },
  NEW_DOCUMENT: { icon: "FileText", color: "text-amber-400" },
  STATUS_CHANGE: { icon: "RefreshCw", color: "text-violet-400" },
  DRIVE_SYNC: { icon: "CloudDownload", color: "text-teal-400" },
  INFO: { icon: "Info", color: "text-slate-400" },
};

// Listes prêtes pour les <select>
export const propertyTypeOptions = (
  Object.keys(PROPERTY_TYPES) as PropertyType[]
).map((v) => ({ value: v, label: PROPERTY_TYPES[v].label }));

export const bienStatusOptions = (
  Object.keys(BIEN_STATUS) as BienStatus[]
).map((v) => ({ value: v, label: BIEN_STATUS[v].label }));

export const unitStatusOptions = (
  Object.keys(UNIT_STATUS) as UnitStatus[]
).map((v) => ({ value: v, label: UNIT_STATUS[v].label }));

export const documentCategoryOptions = (
  Object.keys(DOCUMENT_CATEGORIES) as DocumentCategory[]
).map((v) => ({ value: v, label: DOCUMENT_CATEGORIES[v] }));
