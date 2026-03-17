"use client";

import { BellIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";

export default function Topbar() {
  return (
    <header className="sticky top-0 z-30 flex h-[77px] items-center justify-between border-b border-gray-200 bg-white px-6">
      {/* Search */}
      <div className="relative w-full max-w-md">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search stores, audits..."
          className="h-11 w-full rounded-lg border border-gray-200 bg-white pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4">
        <button className="relative rounded-lg p-2 text-gray-500 hover:bg-gray-50 hover:text-gray-900">
          <BellIcon className="h-6 w-6" strokeWidth={1.5} />
        </button>
        <div className="h-9 w-9 rounded-full bg-brand-500 flex items-center justify-center text-sm font-medium text-white">
          A
        </div>
      </div>
    </header>
  );
}
