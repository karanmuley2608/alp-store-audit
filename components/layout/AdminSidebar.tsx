"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  HomeIcon,
  UsersIcon,
  BuildingStorefrontIcon,
  MapIcon,
  ClipboardDocumentCheckIcon,
  FingerPrintIcon,
  ArrowUpTrayIcon,
  ArrowRightOnRectangleIcon,
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

  const renderItems = (items: typeof management) =>
    items.map((item) => {
      const isActive = pathname.startsWith(item.href);
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
          </Link>
        </li>
      );
    });

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-[290px] flex-col border-r border-gray-200 bg-white">
      <div className="flex h-[77px] items-center border-b border-gray-200 px-6">
        <Link href="/admin/dashboard" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500">
            <BuildingStorefrontIcon className="h-5 w-5 text-white" />
          </div>
          <span className="text-[15px] font-semibold text-gray-900">
            ALP Store Audit
          </span>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-4 py-5">
        <p className="mb-2 px-3 text-xs font-medium uppercase text-gray-400">Management</p>
        <ul className="flex flex-col gap-1">{renderItems(management)}</ul>

        <p className="mb-2 mt-6 px-3 text-xs font-medium uppercase text-gray-400">System</p>
        <ul className="flex flex-col gap-1">{renderItems(system)}</ul>
      </nav>

      {/* Logout */}
      <div className="border-t border-gray-200 p-4">
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
