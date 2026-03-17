export default function ProgressBar({
  value,
  max = 100,
  color = "bg-brand-500",
  className = "",
}: {
  value: number;
  max?: number;
  color?: string;
  className?: string;
}) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className={`h-2 w-full rounded-full bg-gray-100 ${className}`}>
      <div
        className={`h-full rounded-full transition-all ${color}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
