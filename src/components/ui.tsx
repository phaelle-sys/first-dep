import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

// ── Card ────────────────────────────────────────────────────
export function Card({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("card p-5", className)} {...props}>
      {children}
    </div>
  );
}

// ── Badge (statut / type) ───────────────────────────────────
export function Badge({
  className,
  dot,
  children,
}: {
  className?: string;
  dot?: string;
  children: React.ReactNode;
}) {
  return (
    <span className={cn("badge", className)}>
      {dot && <span className={cn("h-1.5 w-1.5 rounded-full", dot)} />}
      {children}
    </span>
  );
}

// ── Section title ───────────────────────────────────────────
export function SectionTitle({
  icon,
  title,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-300">
        {icon}
        {title}
      </h2>
      {action}
    </div>
  );
}

// ── Empty state ─────────────────────────────────────────────
export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-ink-900/40 px-6 py-14 text-center">
      {icon && <div className="mb-3 text-slate-500">{icon}</div>}
      <p className="text-sm font-medium text-slate-300">{title}</p>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// ── Stat tile ───────────────────────────────────────────────
export function StatTile({
  label,
  value,
  sub,
  icon,
  accent = "brand",
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
  icon?: React.ReactNode;
  accent?: "brand" | "emerald" | "amber" | "violet" | "gold";
}) {
  const accents: Record<string, string> = {
    brand: "text-brand-400 bg-brand-500/10",
    emerald: "text-emerald-400 bg-emerald-500/10",
    amber: "text-amber-400 bg-amber-500/10",
    violet: "text-violet-400 bg-violet-500/10",
    gold: "text-gold-400 bg-gold-500/10",
  };
  return (
    <div className="card card-hover flex items-center gap-4 p-4">
      {icon && (
        <div
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
            accents[accent]
          )}
        >
          {icon}
        </div>
      )}
      <div className="min-w-0">
        <p className="truncate text-xs uppercase tracking-wide text-slate-400">
          {label}
        </p>
        <p className="stat-value">{value}</p>
        {sub && <p className="truncate text-xs text-slate-500">{sub}</p>}
      </div>
    </div>
  );
}

// ── Field (détail label/valeur) ─────────────────────────────
export function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-0.5 text-sm text-slate-100">{children}</p>
    </div>
  );
}

// ── Breadcrumb ──────────────────────────────────────────────
export function Breadcrumb({
  items,
}: {
  items: { label: string; href?: string }[];
}) {
  return (
    <nav className="mb-4 flex flex-wrap items-center gap-1.5 text-sm text-slate-400">
      {items.map((it, i) => (
        <React.Fragment key={i}>
          {i > 0 && <span className="text-slate-600">/</span>}
          {it.href ? (
            <Link
              href={it.href}
              className="transition hover:text-brand-300"
            >
              {it.label}
            </Link>
          ) : (
            <span className="text-slate-200">{it.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}
