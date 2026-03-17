"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HomeIcon,
  BuildingStorefrontIcon,
  ClipboardDocumentCheckIcon,
  PhotoIcon,
  UsersIcon,
  Cog6ToothIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";

const navItems = [
  { label: "Dashboard", href: "/", icon: HomeIcon },
  { label: "Stores", href: "/stores", icon: BuildingStorefrontIcon },
  { label: "Audits", href: "/audits", icon: ClipboardDocumentCheckIcon },
  { label: "Photos", href: "/photos", icon: PhotoIcon },
  { label: "Reports", href: "/reports", icon: ChartBarIcon },
  { label: "Users", href: "/users", icon: UsersIcon },
  { label: "Settings", href: "/settings", icon: Cog6ToothIcon },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-[290px] flex-col border-r border-gray-200 bg-white">
      {/* Logo */}
      <div className="flex h-[77px] items-center border-b border-gray-200 px-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500">
            <BuildingStorefrontIcon className="h-5 w-5 text-white" />
          </div>
          <span className="text-page-title text-gray-900">ALP Store Audit</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-4 py-5">
        <ul className="flex flex-col gap-1">
          {navItems.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
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
                    className={`h-6 w-6 shrink-0 ${
                      isActive ? "text-brand-500" : "text-gray-500"
                    }`}
                    strokeWidth={1.5}
                  />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
