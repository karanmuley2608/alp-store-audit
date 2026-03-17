import { type InputHTMLAttributes } from "react";

export default function Input({
  label,
  error,
  hint,
  className = "",
  ...props
}: {
  label?: string;
  error?: string;
  hint?: string;
} & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="mb-0.5 block text-theme-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <input
        className={`h-11 w-full rounded-lg border bg-transparent px-4 py-2.5 text-theme-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 ${
          error
            ? "border-error-500 focus:border-error-300 focus:ring-error-500/10"
            : "border-gray-300"
        } ${className}`}
        {...props}
      />
      {error && <p className="text-theme-xs text-error-600">{error}</p>}
      {hint && !error && <p className="text-theme-xs text-gray-500">{hint}</p>}
    </div>
  );
}
