import { type ButtonHTMLAttributes, type ReactNode } from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary:
    "bg-brand-500 text-white shadow-theme-xs hover:bg-brand-600 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed disabled:shadow-none",
  secondary:
    "bg-white border border-gray-300 text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed",
  danger:
    "bg-error-50 border border-error-600 text-error-600 shadow-theme-xs hover:bg-error-600 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed",
  ghost:
    "bg-transparent text-gray-700 hover:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed",
};

const sizes: Record<Size, string> = {
  sm: "px-3 py-2 text-theme-xs",
  md: "px-4 py-2.5 text-theme-sm",
  lg: "px-5 py-3 text-theme-sm",
};

export default function Button({
  variant = "primary",
  size = "md",
  children,
  className = "",
  ...props
}: {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
  className?: string;
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
