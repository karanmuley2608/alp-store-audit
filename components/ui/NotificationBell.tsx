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
      className="relative rounded-lg p-2 text-gray-500 hover:bg-gray-50 hover:text-gray-900"
    >
      <BellIcon className="h-6 w-6" strokeWidth={1.5} />
      {count > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-error-600 text-[10px] font-bold text-white">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </button>
  );
}
