"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  DoorOpen,
  Bell,
  CloudCog,
  Gem,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Tableau de bord", icon: LayoutDashboard, exact: true },
  { href: "/biens", label: "Biens", icon: Building2 },
  { href: "/unites", label: "Unités", icon: DoorOpen },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/sync", label: "Synchronisation", icon: CloudCog },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-white/5 bg-ink-900/60 backdrop-blur-sm lg:flex">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 shadow-glow">
          <Gem className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white">ImmoCRM</p>
          <p className="text-[11px] text-slate-500">Portefeuille immobilier</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-2">
        {NAV.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                active
                  ? "bg-brand-500/15 text-brand-200"
                  : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
              )}
            >
              <Icon className="h-[18px] w-[18px]" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/5 p-4">
        <Link
          href="/biens/new"
          className="btn-primary w-full"
        >
          + Nouveau bien
        </Link>
      </div>
    </aside>
  );
}
