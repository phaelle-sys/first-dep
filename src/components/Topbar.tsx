import Link from "next/link";
import { Gem } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { NotificationBell } from "./NotificationBell";
import { GlobalSearch } from "./GlobalSearch";

export async function Topbar() {
  const unread = await prisma.notification.count({ where: { read: false } });

  return (
    <header className="sticky top-0 z-20 border-b border-white/5 bg-ink-950/70 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
        {/* Logo mobile */}
        <Link href="/" className="flex items-center gap-2 lg:hidden">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700">
            <Gem className="h-4 w-4 text-white" />
          </div>
          <span className="text-sm font-semibold text-white">ImmoCRM</span>
        </Link>

        <div className="flex-1">
          <GlobalSearch />
        </div>

        <NotificationBell unread={unread} />

        <Link
          href="/biens/new"
          className="btn-primary hidden sm:inline-flex"
        >
          + Nouveau bien
        </Link>
      </div>
    </header>
  );
}
