"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { NotifIcon, notifMeta } from "./NotifIcon";
import { timeAgo } from "@/lib/utils";
import { EmptyState } from "./ui";

type Notif = {
  id: string;
  type: string;
  title: string;
  message?: string | null;
  href?: string | null;
  read: boolean;
  createdAt: string | Date;
};

export function NotificationsList({ notifications }: { notifications: Notif[] }) {
  const router = useRouter();
  const hasUnread = notifications.some((n) => !n.read);

  async function markAll() {
    await fetch("/api/notifications", { method: "PATCH" });
    router.refresh();
  }

  if (notifications.length === 0) {
    return (
      <EmptyState
        title="Aucune notification"
        description="Les nouveaux biens, unités, documents et changements de statut apparaîtront ici."
      />
    );
  }

  return (
    <div>
      {hasUnread && (
        <div className="mb-4 flex justify-end">
          <button onClick={markAll} className="btn-ghost text-xs">
            <Check className="h-3.5 w-3.5" /> Tout marquer comme lu
          </button>
        </div>
      )}
      <div className="card divide-y divide-white/5 p-0">
        {notifications.map((n) => {
          const meta = notifMeta(n.type);
          return (
            <Link
              key={n.id}
              href={n.href ?? "#"}
              className="flex items-start gap-4 px-5 py-4 transition hover:bg-white/[0.03]"
            >
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5 ${meta.color}`}
              >
                <NotifIcon type={n.type} className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-slate-100">{n.title}</p>
                  {!n.read && (
                    <span className="h-2 w-2 shrink-0 rounded-full bg-brand-400" />
                  )}
                </div>
                {n.message && (
                  <p className="mt-0.5 text-sm text-slate-400">{n.message}</p>
                )}
                <p className="mt-1 text-xs text-slate-600">
                  {timeAgo(n.createdAt)}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
