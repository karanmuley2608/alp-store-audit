"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  HomeIcon,
  BuildingStorefrontIcon,
  BellIcon,
  MapIcon,
  PhotoIcon,
  ChartBarIcon,
  ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/outline";
import { useNotifications } from "@/lib/hooks/useNotifications";
import { useEmployee } from "@/lib/hooks/useEmployee";

const menuItems = [
  { label: "Dashboard", href: "/nso/dashboard", icon: HomeIcon },
  { label: "All Stores", href: "/nso/stores", icon: BuildingStorefrontIcon },
  { label: "Notifications", href: "/nso/notifications", icon: BellIcon, showBadge: true },
  { label: "State Progress", href: "/nso/state-progress", icon: MapIcon },
  { label: "Media Gallery", href: "#", icon: PhotoIcon },
];

const analyticsItems = [
  { label: "Satisfaction Report", href: "#", icon: ChartBarIcon },
];

export default function NSOSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { employee } = useEmployee();
  const { unreadCount } = useNotifications(employee?.id);

  const renderItems = (items: typeof menuItems) =>
    items.map((item) => {
      const isActive = pathname.startsWith(item.href) && item.href !== "#";
      return (
        <li key={item.href}>
          <Link
            href={item.href}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
              isActive
                ? "bg-brand-50 text-brand-500"
                : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
            }`}
          >
            <item.icon
              className={`h-6 w-6 shrink-0 ${isActive ? "text-brand-500" : "text-gray-500"}`}
              strokeWidth={1.5}
            />
            {item.label}
            {"showBadge" in item && item.showBadge && unreadCount > 0 && (
              <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-error-600 text-[10px] font-bold text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Link>
        </li>
      );
    });

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-[290px] flex-col border-r border-gray-200 bg-white">
      <div className="flex h-[77px] items-center border-b border-gray-200 px-6">
        <Link href="/nso/dashboard" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500">
            <BuildingStorefrontIcon className="h-5 w-5 text-white" />
          </div>
          <span className="text-[15px] font-semibold text-gray-900">
            ALP Store Audit
          </span>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-4 py-5">
        <p className="mb-2 px-3 text-xs font-medium uppercase text-gray-400">Menu</p>
        <ul className="flex flex-col gap-1">{renderItems(menuItems)}</ul>

        <p className="mb-2 mt-6 px-3 text-xs font-medium uppercase text-gray-400">Analytics</p>
        <ul className="flex flex-col gap-1">{renderItems(analyticsItems)}</ul>
      </nav>

      {/* Logout */}
      <div className="border-t border-gray-200 p-4">
        {employee && (
          <div className="mb-3 px-3">
            <p className="text-sm font-medium text-gray-900">{employee.full_name}</p>
            <p className="text-xs text-gray-500">{employee.role}</p>
          </div>
        )}
        <button
          onClick={async () => {
            await fetch("/api/auth/logout", { method: "POST" });
            router.push("/login");
          }}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900"
        >
          <ArrowRightOnRectangleIcon className="h-6 w-6 text-gray-500" strokeWidth={1.5} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
