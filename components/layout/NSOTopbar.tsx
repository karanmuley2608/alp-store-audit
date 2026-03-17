"use client";

import { useEmployee } from "@/lib/hooks/useEmployee";
import Avatar from "@/components/ui/Avatar";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";

export default function NSOTopbar({ title }: { title?: string }) {
  const { employee } = useEmployee();

  return (
    <header className="sticky top-0 z-[99998] flex w-full items-center justify-between border-b border-gray-200 bg-white px-4 py-4 md:px-6">
      <div className="flex items-center gap-4">
        {/* Spacer for mobile hamburger */}
        <div className="w-10 lg:hidden" />
        <h1 className="text-theme-xl font-semibold text-gray-800">
          {title || "Dashboard"}
        </h1>
      </div>

      <div className="flex items-center gap-3">
        {/* Search - desktop only */}
        <div className="relative hidden xl:block">
          <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search or type command..."
            className="h-11 w-[280px] rounded-lg border border-gray-200 bg-transparent pl-10 pr-4 text-theme-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 xl:w-[360px]"
          />
        </div>

        {/* Live indicator */}
        <span className="hidden items-center gap-1.5 rounded-full bg-success-50 px-3 py-1.5 text-theme-xs font-medium text-success-600 sm:flex">
          <span className="h-2 w-2 animate-pulse rounded-full bg-success-500" />
          Live
        </span>

        {/* User */}
        {employee && (
          <div className="flex items-center gap-2.5">
            <Avatar name={employee.full_name} />
            <span className="hidden text-theme-sm font-medium text-gray-800 md:inline">
              {employee.full_name}
            </span>
          </div>
        )}
      </div>
    </header>
  );
}
