"use client";

import { useRouter } from "next/navigation";
import { useEmployee } from "@/lib/hooks/useEmployee";
import { useNotifications } from "@/lib/hooks/useNotifications";
import { markAllRead } from "@/lib/utils/notifications";
import NSOTopbar from "@/components/layout/NSOTopbar";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";
import { formatIST } from "@/lib/utils/dates";
import {
  ClipboardDocumentCheckIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  BellIcon,
} from "@heroicons/react/24/outline";

const typeConfig: Record<string, { color: string; icon: typeof BellIcon }> = {
  audit_submitted: { color: "border-l-brand-500", icon: ClipboardDocumentCheckIcon },
  resubmission: { color: "border-l-brand-500", icon: ArrowPathIcon },
  deadline_warning: { color: "border-l-warning-700", icon: ExclamationTriangleIcon },
  overdue: { color: "border-l-error-600", icon: ExclamationTriangleIcon },
  item_comment: { color: "border-l-brand-500", icon: ClipboardDocumentCheckIcon },
  default: { color: "border-l-gray-400", icon: BellIcon },
};

export default function NSONotificationsPage() {
  const { employee } = useEmployee();
  const { notifications, unreadCount } = useNotifications(employee?.id);
  const router = useRouter();

  if (!employee) return <div className="flex h-screen items-center justify-center"><Spinner size="lg" /></div>;

  return (
    <div className="flex flex-col">
      <NSOTopbar title="Notifications" />
      <div className="space-y-4 p-6">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">{unreadCount} unread</p>
          {unreadCount > 0 && (
            <Button variant="ghost" onClick={() => markAllRead(employee.id)}>
              Mark all read
            </Button>
          )}
        </div>

        {notifications.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-400">No notifications yet</p>
        ) : (
          <div className="flex flex-col gap-2">
            {notifications.map((n) => {
              const cfg = typeConfig[n.type] || typeConfig.default;
              const Icon = cfg.icon;
              return (
                <div
                  key={n.id}
                  className={`cursor-pointer rounded-lg border-l-4 ${cfg.color} p-4 ${n.read ? "bg-gray-50" : "bg-white border border-gray-200"}`}
                  onClick={() => {
                    if (n.reference_type === "audit" && n.reference_id) {
                      // Find store for this audit, then navigate
                      router.push(`/nso/stores`);
                    }
                  }}
                >
                  <div className="flex items-start gap-3">
                    <Icon className="mt-0.5 h-5 w-5 shrink-0 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{n.title}</p>
                      <p className="text-xs text-gray-500">{n.body}</p>
                      <p className="mt-1 text-xs text-gray-400">{formatIST(n.created_at, "relative")}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
