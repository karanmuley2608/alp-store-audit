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
    <div className="flex gap-1 rounded-lg bg-gray-50 p-1">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            active === tab.value
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span className="ml-1.5 text-xs text-gray-400">{tab.count}</span>
          )}
        </button>
      ))}
    </div>
  );
}
