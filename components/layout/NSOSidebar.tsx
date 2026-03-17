"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  HomeIcon,
  BuildingStorefrontIcon,
  BellIcon,
  MapIcon,
  PhotoIcon,
  ChartBarIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
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
  const [mobileOpen, setMobileOpen] = useState(false);

  const renderItems = (items: typeof menuItems) =>
    items.map((item) => {
      const isActive = pathname.startsWith(item.href) && item.href !== "#";
      return (
        <li key={item.label}>
          <Link
            href={item.href}
            onClick={() => setMobileOpen(false)}
            className={`menu-item ${isActive ? "menu-item-active" : "menu-item-inactive"}`}
          >
            <item.icon
              className={`h-6 w-6 shrink-0 ${isActive ? "text-brand-500" : "text-gray-500"}`}
              strokeWidth={1.5}
            />
            <span>{item.label}</span>
            {"showBadge" in item && item.showBadge && unreadCount > 0 && (
              <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-error-500 px-1 text-[10px] font-bold text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Link>
        </li>
      );
    });

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-6 pb-7 pt-8">
        <Link href="/nso/dashboard" className="flex items-center gap-2.5" onClick={() => setMobileOpen(false)}>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500">
            <BuildingStorefrontIcon className="h-5 w-5 text-white" />
          </div>
          <span className="text-theme-xl font-semibold text-gray-800">
            ALP Store Audit
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="custom-scrollbar flex-1 overflow-y-auto px-4 pb-4">
        <p className="mb-2 px-3 text-theme-xs font-medium uppercase tracking-wider text-gray-400">
          Menu
        </p>
        <ul className="flex flex-col gap-1">{renderItems(menuItems)}</ul>

        <p className="mb-2 mt-7 px-3 text-theme-xs font-medium uppercase tracking-wider text-gray-400">
          Analytics
        </p>
        <ul className="flex flex-col gap-1">{renderItems(analyticsItems)}</ul>
      </nav>

      {/* User + Logout */}
      <div className="border-t border-gray-200 p-4">
        {employee && (
          <div className="mb-3 px-3">
            <p className="text-theme-sm font-medium text-gray-800">{employee.full_name}</p>
            <p className="text-theme-xs text-gray-500">{employee.role}</p>
          </div>
        )}
        <button
          onClick={async () => {
            await fetch("/api/auth/logout", { method: "POST" });
            router.push("/login");
          }}
          className="menu-item menu-item-inactive w-full"
        >
          <ArrowRightOnRectangleIcon className="h-6 w-6 text-gray-500" strokeWidth={1.5} />
          <span>Sign out</span>
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed left-4 top-4 z-[99998] flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 shadow-theme-sm lg:hidden"
      >
        <Bars3Icon className="h-5 w-5" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[99998] bg-gray-950/40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-[99999] flex h-screen w-[290px] flex-col overflow-y-hidden border-r border-gray-200 bg-white transition-transform duration-300 lg:static lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Mobile close button */}
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 lg:hidden"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
        {sidebarContent}
      </aside>
    </>
  );
}
