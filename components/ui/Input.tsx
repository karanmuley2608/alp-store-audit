import { type InputHTMLAttributes } from "react";

export default function Input({
  label,
  error,
  className = "",
  ...props
}: {
  label?: string;
  error?: string;
} & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm text-gray-500">{label}</label>
      )}
      <input
        className={`h-11 rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 ${
          error ? "border-error-600 focus:border-error-600 focus:ring-error-600" : ""
        } ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-error-600">{error}</p>}
    </div>
  );
}
