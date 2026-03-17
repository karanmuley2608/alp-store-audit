import { type ReactNode } from "react";

export default function Card({
  children,
  className = "",
  header,
}: {
  children: ReactNode;
  className?: string;
  header?: ReactNode;
}) {
  if (header) {
    return (
      <div className={`overflow-hidden rounded-2xl border border-gray-200 bg-white ${className}`}>
        <div className="px-5 py-4 sm:px-6 sm:py-5">{header}</div>
        <div className="border-t border-gray-100 p-5 sm:p-6">{children}</div>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl border border-gray-200 bg-white p-5 md:p-6 ${className}`}>
      {children}
    </div>
  );
}
