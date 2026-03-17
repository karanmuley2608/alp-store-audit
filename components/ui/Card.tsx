import { type ReactNode } from "react";

export default function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-card border border-gray-200 bg-white p-6 ${className}`}
    >
      {children}
    </div>
  );
}
