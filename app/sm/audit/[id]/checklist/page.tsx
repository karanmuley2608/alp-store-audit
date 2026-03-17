"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import ProgressBar from "@/components/ui/ProgressBar";
import RAGIndicator from "@/components/ui/RAGIndicator";
import Tabs from "@/components/ui/Tabs";
import Spinner from "@/components/ui/Spinner";
import { getRAGStatus, getDaysRemaining } from "@/lib/utils/rag";
import { ChevronRightIcon } from "@heroicons/react/24/outline";

interface AuditItem {
  id: string;
  status: string;
  in_scope: boolean;
  checklist_items: {
    sr_no: number;
    work_type: string;
    activity: string;
    category: string;
  };
}

// Light background tint per category for row coloring
const categoryRowBg: Record<string, string> = {
  MEP: "bg-brand-25",           // very light blue
  Interior: "bg-gray-25",       // very light gray
  "Wet areas": "bg-warning-25", // very light amber
  "Façade": "bg-success-25",    // very light green
  Fixtures: "bg-error-25",      // very light red
};

// Section header bg per category
const categorySectionBg: Record<string, string> = {
  MEP: "bg-brand-50 text-brand-600 border-brand-200",
  Interior: "bg-gray-100 text-gray-700 border-gray-200",
  "Wet areas": "bg-warning-50 text-warning-700 border-warning-300",
  "Façade": "bg-success-50 text-success-700 border-success-300",
  Fixtures: "bg-error-50 text-error-700 border-error-300",
};

// Canonical ordering
const categoryOrder = ["MEP", "Interior", "Wet areas", "Façade", "Fixtures"];

const allCategories = ["All", ...categoryOrder];

export default function ChecklistPage() {
  const { id } = useParams<{ id: string }>();
  const [items, setItems] = useState<AuditItem[]>([]);
  const [tab, setTab] = useState("all");
  const [category, setCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const [storeCode, setStoreCode] = useState("");
  const [targetDate, setTargetDate] = useState<string>("");
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    async function fetchData() {
      const { data: audit } = await supabase
        .from("audits")
        .select("store_id, stores(store_code, target_completion_date)")
        .eq("id", id)
        .single();

      if (audit) {
        const store = audit.stores as unknown as { store_code: string; target_completion_date: string };
        setStoreCode(store?.store_code || "");
        setTargetDate(store?.target_completion_date || "");
      }

      const { data } = await supabase
        .from("audit_items")
        .select("id, status, in_scope, checklist_items(sr_no, work_type, activity, category)")
        .eq("audit_id", id)
        .order("checklist_items(sr_no)");

      if (data) setItems(data as unknown as AuditItem[]);
      setLoading(false);
    }

    fetchData();
  }, [id]);

  if (loading) return <div className="flex h-64 items-center justify-center"><Spinner size="lg" /></div>;

  const completed = items.filter((i) => i.status === "completed" || i.status === "out_of_scope").length;
  const total = items.length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  // Find resume item
  const resumeItem = items.find((i) => i.status === "in_progress") || items.find((i) => i.status === "pending");

  // Filter by tab and category
  const filtered = items.filter((i) => {
    if (tab === "pending" && i.status !== "pending" && i.status !== "in_progress") return false;
    if (tab === "done" && i.status !== "completed" && i.status !== "out_of_scope") return false;
    if (category !== "All" && i.checklist_items?.category !== category) return false;
    return true;
  });

  // Group by category in canonical order
  const grouped: { category: string; items: AuditItem[] }[] = [];
  for (const cat of categoryOrder) {
    const catItems = filtered.filter((i) => i.checklist_items?.category === cat);
    if (catItems.length > 0) {
      grouped.push({ category: cat, items: catItems });
    }
  }

  // Count items per category for chips
  const catCounts: Record<string, number> = {};
  for (const cat of categoryOrder) {
    catCounts[cat] = items.filter((i) => i.checklist_items?.category === cat).length;
  }

  return (
    <div className="space-y-4 p-4">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1 text-theme-xs text-gray-500">
        <button onClick={() => router.push("/sm/home")} className="hover:text-brand-500">Home</button>
        <span>/</span>
        <span className="font-medium text-gray-800">Checklist</span>
      </nav>

      {/* Autosave bar */}
      <div className="flex items-center gap-2 rounded-lg bg-success-50 px-3 py-2 text-theme-xs font-medium text-success-600">
        Auto-saving enabled
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-800">Checklist</h1>
        <span className="text-theme-sm text-gray-500 font-mono">
          {storeCode} · {completed}/{total}
        </span>
      </div>

      {/* Progress */}
      <Card className="!p-4">
        <div className="flex items-center justify-between text-theme-sm">
          <span className="font-medium text-gray-800">{pct}% complete</span>
          {targetDate && (
            <div className="flex items-center gap-2">
              <span className="text-theme-xs text-gray-500">
                {getDaysRemaining(new Date(targetDate))} days
              </span>
              <RAGIndicator status={getRAGStatus(new Date(targetDate), pct)} showLabel />
            </div>
          )}
        </div>
        <ProgressBar value={pct} className="mt-2" color="bg-success-500" />
      </Card>

      {/* Tabs */}
      <Tabs
        tabs={[
          { label: "All", value: "all", count: total },
          { label: "Pending", value: "pending", count: items.filter((i) => i.status === "pending" || i.status === "in_progress").length },
          { label: "Done", value: "done", count: completed },
        ]}
        active={tab}
        onChange={setTab}
      />

      {/* Category chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {allCategories.map((cat) => {
          const isActive = category === cat;
          const count = cat === "All" ? total : catCounts[cat] || 0;
          return (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-theme-xs font-medium transition-colors ${
                isActive
                  ? "bg-brand-500 text-white shadow-theme-xs"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {cat}
              <span className={`tabular-nums ${isActive ? "text-white/70" : "text-gray-400"}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Grouped items by category */}
      <div className="space-y-4">
        {grouped.map((group) => (
          <div key={group.category}>
            {/* Category section header */}
            <div className={`mb-2 flex items-center justify-between rounded-lg border px-3 py-2 ${categorySectionBg[group.category] || "bg-gray-100 text-gray-700 border-gray-200"}`}>
              <span className="text-theme-xs font-semibold uppercase tracking-wider">
                {group.category}
              </span>
              <span className="text-theme-xs font-medium opacity-70">
                {group.items.filter((i) => i.status === "completed" || i.status === "out_of_scope").length}/{group.items.length} done
              </span>
            </div>

            {/* Items in this category */}
            <div className="flex flex-col gap-1.5">
              {group.items.map((item) => {
                const ci = item.checklist_items;
                const isResume = resumeItem?.id === item.id;
                const statusBadge =
                  item.status === "completed" ? "success" :
                  item.status === "out_of_scope" ? "neutral" :
                  item.status === "in_progress" ? "info" : "warning";

                const rowBg = categoryRowBg[ci?.category] || "";

                return (
                  <div
                    key={item.id}
                    onClick={() => router.push(`/sm/audit/${id}/item/${item.id}`)}
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-all hover:shadow-theme-xs ${
                      isResume
                        ? "border-l-4 border-l-brand-500 border-brand-200 bg-brand-50"
                        : item.status === "out_of_scope"
                          ? "border-gray-100 bg-gray-50 opacity-60"
                          : `border-gray-200 ${rowBg}`
                    }`}
                  >
                    {/* Sr No */}
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-theme-xs font-mono font-semibold text-gray-700 shadow-theme-xs">
                      {ci?.sr_no}
                    </span>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-theme-sm font-medium text-gray-800">
                        {ci?.work_type} · {ci?.activity}
                      </p>
                      <div className="mt-1 flex items-center gap-1.5">
                        <Badge variant={statusBadge as "success" | "error" | "warning" | "info" | "neutral"}>
                          {item.status.replace(/_/g, " ")}
                        </Badge>
                      </div>
                      {isResume && (
                        <p className="mt-1 text-theme-xs font-medium text-brand-500">
                          ↳ Resume here
                        </p>
                      )}
                    </div>

                    <ChevronRightIcon className="h-4 w-4 shrink-0 text-gray-400" />
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="rounded-xl border border-gray-200 bg-white px-4 py-10 text-center text-theme-sm text-gray-500">
            No items match the current filter.
          </div>
        )}
      </div>

      {/* If all done, show submit link */}
      {pct === 100 && (
        <button
          onClick={() => router.push(`/sm/audit/${id}/submit`)}
          className="w-full rounded-lg bg-success-600 px-4 py-3 text-theme-sm font-medium text-white shadow-theme-xs hover:bg-success-700 transition-colors"
        >
          All items complete — Submit for review
        </button>
      )}
    </div>
  );
}
