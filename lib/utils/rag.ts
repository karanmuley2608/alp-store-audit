export type RAGStatus = "green" | "amber" | "red";

export function getRAGStatus(
  targetDate: Date,
  completionPercent: number
): RAGStatus {
  const daysRemaining = Math.ceil(
    (targetDate.getTime() - Date.now()) / 86400000
  );
  if (daysRemaining < 0) return "red";
  if (daysRemaining < 5 && completionPercent < 80) return "red";
  if (daysRemaining < 14 && completionPercent < 80) return "amber";
  return "green";
}

export const RAGColors = {
  green: {
    dot: "#039855",
    bg: "#ECFDF3",
    text: "#027A48",
    label: "On track",
  },
  amber: {
    dot: "#B54708",
    bg: "#FFFAEB",
    text: "#B54708",
    label: "At risk",
  },
  red: { dot: "#D92D20", bg: "#FEF3F2", text: "#D92D20", label: "Overdue" },
};

export function getDaysRemaining(targetDate: Date): number {
  return Math.ceil((targetDate.getTime() - Date.now()) / 86400000);
}
