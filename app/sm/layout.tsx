"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  HomeIcon,
  ClockIcon,
  BellIcon,
  ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/outline";
import { useEmployee } from "@/lib/hooks/useEmployee";
import { useNotifications } from "@/lib/hooks/useNotifications";
import NotificationBell from "@/components/ui/NotificationBell";

const bottomNav = [
  { label: "Home", href: "/sm/home", icon: HomeIcon },
  { label: "History", href: "/sm/history", icon: ClockIcon },
  { label: "Notifications", href: "/sm/notifications", icon: BellIcon },
];

export default function SMLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { employee } = useEmployee();
  const { unreadCount } = useNotifications(employee?.id);

  return (
    <div className="mx-auto flex min-h-screen max-w-[430px] flex-col bg-white">
      {/* Topbar */}
      <header className="sticky top-0 z-[99998] flex h-[60px] items-center justify-between border-b border-gray-200 bg-white px-4">
        <span className="text-base font-semibold text-gray-800">
          ALP Store Audit
        </span>
        <div className="flex items-center gap-2">
          <NotificationBell
            count={unreadCount}
            onClick={() => router.push("/sm/notifications")}
          />
          <button
            onClick={async () => {
              await fetch("/api/auth/logout", { method: "POST" });
              localStorage.removeItem("selected_store_code");
              router.push("/login");
            }}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            title="Sign out"
          >
            <ArrowRightOnRectangleIcon className="h-5 w-5" strokeWidth={1.5} />
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto pb-20">{children}</main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-1/2 z-[99998] flex w-full max-w-[430px] -translate-x-1/2 border-t border-gray-200 bg-white shadow-theme-lg">
        {bottomNav.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-theme-xs font-medium transition-colors ${
                isActive ? "text-brand-500" : "text-gray-500"
              }`}
            >
              <div className="relative">
                <item.icon className="h-6 w-6" strokeWidth={1.5} />
                {item.label === "Notifications" && unreadCount > 0 && (
                  <span className="absolute -right-1.5 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-error-500 text-[9px] font-bold text-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </div>
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
