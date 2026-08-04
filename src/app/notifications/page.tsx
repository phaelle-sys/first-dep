import { prisma } from "@/lib/prisma";
import { NotificationsList } from "@/components/NotificationsList";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const notifications = await prisma.notification.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-white">
          Notifications
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Alertes de l&apos;équipe : nouveaux biens, unités, documents et
          changements de statut.
        </p>
      </div>
      <NotificationsList notifications={notifications} />
    </div>
  );
}
