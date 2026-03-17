import { RAGColors, type RAGStatus } from "@/lib/utils/rag";

export default function RAGIndicator({
  status,
  showLabel = false,
}: {
  status: RAGStatus;
  showLabel?: boolean;
}) {
  const colors = RAGColors[status];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium"
      style={{ backgroundColor: colors.bg, color: colors.text }}
    >
      <span
        className="inline-block h-2 w-2 rounded-full"
        style={{ backgroundColor: colors.dot }}
      />
      {showLabel && colors.label}
    </span>
  );
}
