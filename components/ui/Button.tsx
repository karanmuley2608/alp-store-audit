import { type ButtonHTMLAttributes, type ReactNode } from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost";

const variants: Record<Variant, string> = {
  primary:
    "bg-brand-500 text-white hover:bg-brand-600 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed",
  secondary:
    "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed",
  danger:
    "bg-error-50 border border-error-600 text-error-600 hover:bg-error-600 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed",
  ghost:
    "bg-transparent text-gray-700 hover:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed",
};

export default function Button({
  variant = "primary",
  children,
  className = "",
  ...props
}: {
  variant?: Variant;
  children: ReactNode;
  className?: string;
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
