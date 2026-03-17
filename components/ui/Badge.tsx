import { type ReactNode } from "react";

type Variant = "success" | "error" | "warning" | "info" | "neutral";

const variants: Record<Variant, string> = {
  success: "bg-success-50 text-success-600",
  error: "bg-error-50 text-error-600",
  warning: "bg-warning-50 text-warning-700",
  info: "bg-brand-50 text-brand-500",
  neutral: "bg-gray-100 text-gray-700",
};

export default function Badge({
  variant = "neutral",
  children,
}: {
  variant?: Variant;
  children: ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${variants[variant]}`}
    >
      {children}
    </span>
  );
}
