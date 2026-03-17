import { type ReactNode } from "react";

type Variant = "success" | "error" | "warning" | "info" | "neutral" | "light" | "dark";

const variants: Record<Variant, string> = {
  success: "bg-success-50 text-success-600",
  error: "bg-error-50 text-error-600",
  warning: "bg-warning-50 text-warning-700",
  info: "bg-brand-50 text-brand-500",
  neutral: "bg-gray-100 text-gray-700",
  light: "bg-gray-100 text-gray-700",
  dark: "bg-gray-500 text-white",
};

export default function Badge({
  variant = "neutral",
  children,
  className = "",
}: {
  variant?: Variant;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center justify-center gap-1 rounded-full px-2.5 py-0.5 text-theme-xs font-medium ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
