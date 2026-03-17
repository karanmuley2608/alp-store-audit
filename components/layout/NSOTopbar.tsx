"use client";

import { useEmployee } from "@/lib/hooks/useEmployee";
import Avatar from "@/components/ui/Avatar";

export default function NSOTopbar({ title }: { title?: string }) {
  const { employee } = useEmployee();

  return (
    <header className="sticky top-0 z-30 flex h-[77px] items-center justify-between border-b border-gray-200 bg-white px-6">
      <h1 className="text-page-title text-gray-900">{title || "Dashboard"}</h1>
      <div className="flex items-center gap-3">
        <span className="flex items-center gap-1.5 rounded-full bg-success-50 px-3 py-1 text-xs font-medium text-success-600">
          <span className="h-2 w-2 rounded-full bg-success-600" />
          Live · just now
        </span>
        {employee && (
          <div className="flex items-center gap-2">
            <Avatar name={employee.full_name} />
            <span className="text-sm font-medium text-gray-900">
              {employee.full_name}
            </span>
          </div>
        )}
      </div>
    </header>
  );
}
