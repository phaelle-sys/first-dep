import {
  Building2,
  DoorOpen,
  FileText,
  RefreshCw,
  CloudDownload,
  Info,
  type LucideProps,
} from "lucide-react";
import { NOTIFICATION_META, type NotificationType } from "@/lib/enums";

const ICONS: Record<string, React.ComponentType<LucideProps>> = {
  Building2,
  DoorOpen,
  FileText,
  RefreshCw,
  CloudDownload,
  Info,
};

export function notifMeta(type: string) {
  return NOTIFICATION_META[type as NotificationType] ?? NOTIFICATION_META.INFO;
}

export function NotifIcon({
  type,
  ...props
}: { type: string } & LucideProps) {
  const meta = notifMeta(type);
  const Icon = ICONS[meta.icon] ?? Info;
  return <Icon {...props} />;
}
