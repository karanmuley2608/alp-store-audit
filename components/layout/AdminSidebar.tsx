"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  HomeIcon,
  UsersIcon,
  BuildingStorefrontIcon,
  MapIcon,
  ClipboardDocumentCheckIcon,
  FingerPrintIcon,
  ArrowUpTrayIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

const management = [
  { label: "Dashboard", href: "/admin/dashboard", icon: HomeIcon },
  { label: "Employees", href: "/admin/employees", icon: UsersIcon },
  { label: "Stores", href: "/admin/stores", icon: BuildingStorefrontIcon },
  { label: "Regions", href: "/admin/regions", icon: MapIcon },
  { label: "Checklist", href: "/admin/checklist", icon: ClipboardDocumentCheckIcon },
];

const system = [
  { label: "Audit Trail", href: "/admin/audit-trail", icon: FingerPrintIcon },
  { label: "Import", href: "/admin/import", icon: ArrowUpTrayIcon },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const renderItems = (items: typeof management) =>
    items.map((item) => {
      const isActive = pathname.startsWith(item.href);
      return (
        <li key={item.href}>
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
          </Link>
        </li>
      );
    });

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-6 pb-7 pt-8">
        <Link href="/admin/dashboard" className="flex items-center gap-2.5" onClick={() => setMobileOpen(false)}>
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
          Management
        </p>
        <ul className="flex flex-col gap-1">{renderItems(management)}</ul>

        <p className="mb-2 mt-7 px-3 text-theme-xs font-medium uppercase tracking-wider text-gray-400">
          System
        </p>
        <ul className="flex flex-col gap-1">{renderItems(system)}</ul>
      </nav>

      {/* Logout */}
      <div className="border-t border-gray-200 p-4">
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
