"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, Check } from "lucide-react";
import { timeAgo } from "@/lib/utils";

type Notif = {
  id: string;
  type: string;
  title: string;
  message?: string | null;
  href?: string | null;
  read: boolean;
  createdAt: string;
};

export function NotificationBell({ unread }: { unread: number }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notif[]>([]);
  const [count, setCount] = useState(unread);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => setCount(unread), [unread]);

  async function load() {
    const res = await fetch("/api/notifications?take=8");
    const data = await res.json();
    setItems(data.notifications ?? []);
  }

  async function markAll() {
    await fetch("/api/notifications", { method: "PATCH" });
    setCount(0);
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    router.refresh();
  }

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => {
          setOpen((o) => !o);
          if (!open) load();
        }}
        className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {count > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-500 px-1 text-[10px] font-semibold text-white">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-30 mt-2 w-80 overflow-hidden rounded-xl border border-white/10 bg-ink-850 shadow-card">
          <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
            <p className="text-sm font-semibold text-white">Notifications</p>
            {count > 0 && (
              <button
                onClick={markAll}
                className="flex items-center gap-1 text-xs text-brand-300 hover:text-brand-200"
              >
                <Check className="h-3.5 w-3.5" /> Tout marquer lu
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-slate-500">
                Aucune notification.
              </p>
            ) : (
              items.map((n) => (
                <Link
                  key={n.id}
                  href={n.href ?? "/notifications"}
                  onClick={() => setOpen(false)}
                  className="flex gap-3 border-b border-white/5 px-4 py-3 transition last:border-0 hover:bg-white/5"
                >
                  <span
                    className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                      n.read ? "bg-transparent" : "bg-brand-400"
                    }`}
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-100">
                      {n.title}
                    </p>
                    {n.message && (
                      <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">
                        {n.message}
                      </p>
                    )}
                    <p className="mt-1 text-[11px] text-slate-600">
                      {timeAgo(n.createdAt)}
                    </p>
                  </div>
                </Link>
              ))
            )}
          </div>
          <Link
            href="/notifications"
            onClick={() => setOpen(false)}
            className="block border-t border-white/5 px-4 py-2.5 text-center text-xs text-brand-300 hover:text-brand-200"
          >
            Voir toutes les notifications
          </Link>
        </div>
      )}
    </div>
  );
}
