"use client";

import { BellIcon } from "@heroicons/react/24/outline";

export default function NotificationBell({
  count,
  onClick,
}: {
  count: number;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="relative flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-700"
    >
      <BellIcon className="h-5 w-5" strokeWidth={1.5} />
      {count > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-error-500 text-[10px] font-bold text-white ring-2 ring-white">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </button>
  );
}
