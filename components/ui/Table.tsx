import { type ReactNode } from "react";

export function Table({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`overflow-hidden rounded-2xl border border-gray-200 bg-white ${className}`}>
      <div className="w-full overflow-x-auto custom-scrollbar">
        <table className="min-w-full">{children}</table>
      </div>
    </div>
  );
}

export function THead({ children }: { children: ReactNode }) {
  return (
    <thead className="border-b border-gray-100">
      {children}
    </thead>
  );
}

export function TH({
  children,
  className = "",
}: {
  children?: ReactNode;
  className?: string;
}) {
  return (
    <th
      className={`px-5 py-3 text-left font-medium text-gray-500 text-theme-xs ${className}`}
    >
      {children}
    </th>
  );
}

export function TD({
  children,
  className = "",
}: {
  children?: ReactNode;
  className?: string;
}) {
  return (
    <td className={`px-5 py-3.5 text-theme-sm text-gray-800 ${className}`}>
      {children}
    </td>
  );
}

export function TR({
  children,
  onClick,
  className = "",
}: {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <tr
      onClick={onClick}
      className={`border-b border-gray-100 transition-colors hover:bg-gray-50 ${
        onClick ? "cursor-pointer" : ""
      } ${className}`}
    >
      {children}
    </tr>
  );
}
