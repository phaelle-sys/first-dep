// Création de notifications + dispatch optionnel vers un webhook externe
// (Slack / Teams / Discord). Sert de point central pour alerter l'équipe.

import { prisma } from "./prisma";
import type { NotificationType } from "./enums";

type CreateNotificationInput = {
  type: NotificationType;
  title: string;
  message?: string;
  entityType?: "BIEN" | "UNIT" | "DOCUMENT";
  entityId?: string;
  href?: string;
};

export async function createNotification(input: CreateNotificationInput) {
  const notif = await prisma.notification.create({
    data: {
      type: input.type,
      title: input.title,
      message: input.message,
      entityType: input.entityType,
      entityId: input.entityId,
      href: input.href,
    },
  });

  // Dispatch externe (best-effort, n'interrompt jamais le flux principal).
  void dispatchWebhook(input).catch((e) =>
    console.error("[notifications] webhook error:", e)
  );

  return notif;
}

async function dispatchWebhook(input: CreateNotificationInput) {
  const url = process.env.NOTIFY_WEBHOOK_URL?.trim();
  if (!url) return;

  const text = `🏢 *${input.title}*${input.message ? `\n${input.message}` : ""}`;

  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    // Format "text" compatible Slack/Discord/Teams (webhook entrant).
    body: JSON.stringify({ text, content: text }),
  });
}

export async function markAllRead() {
  await prisma.notification.updateMany({
    where: { read: false },
    data: { read: true },
  });
}

export async function unreadCount(): Promise<number> {
  return prisma.notification.count({ where: { read: false } });
}
