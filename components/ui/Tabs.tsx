"use client";

export default function Tabs({
  tabs,
  active,
  onChange,
}: {
  tabs: { label: string; value: string; count?: number }[];
  active: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="inline-flex gap-1 rounded-lg border border-gray-200 bg-gray-50 p-1">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={`rounded-md px-3.5 py-1.5 text-theme-sm font-medium transition-colors ${
            active === tab.value
              ? "bg-white text-gray-800 shadow-theme-xs"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span className={`ml-1.5 text-theme-xs ${active === tab.value ? "text-gray-500" : "text-gray-400"}`}>
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
