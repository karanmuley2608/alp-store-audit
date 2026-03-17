export default function Avatar({
  name,
  size = "md",
}: {
  name: string;
  size?: "sm" | "md" | "lg";
}) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const sizes = { sm: "h-8 w-8 text-xs", md: "h-9 w-9 text-sm", lg: "h-12 w-12 text-base" };

  return (
    <div
      className={`flex items-center justify-center rounded-full bg-brand-500 font-medium text-white ${sizes[size]}`}
    >
      {initials}
    </div>
  );
}
