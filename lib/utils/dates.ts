export function toIST(utcDate: string | Date): Date {
  return new Date(new Date(utcDate).getTime() + 19800000);
}

export function formatIST(
  utcDate: string | Date,
  format: "date" | "datetime" | "relative"
): string {
  const ist = toIST(utcDate);
  if (format === "date")
    return ist.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  if (format === "datetime")
    return ist.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  const diff = Date.now() - new Date(utcDate).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}
