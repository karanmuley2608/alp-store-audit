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

const categoryColors: Record<string, string> = {
  MEP: "info",
  Interior: "neutral",
  "Wet areas": "warning",
  "Façade": "success",
  Fixtures: "error",
};

const categories = ["All", "MEP", "Interior", "Wet areas", "Façade", "Fixtures"];

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
      // Get audit with store info
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

  const filtered = items.filter((i) => {
    if (tab === "pending" && i.status !== "pending" && i.status !== "in_progress") return false;
    if (tab === "done" && i.status !== "completed" && i.status !== "out_of_scope") return false;
    if (category !== "All" && i.checklist_items?.category !== category) return false;
    return true;
  });

  return (
    <div className="space-y-4 p-4">
      {/* Autosave bar */}
      <div className="flex items-center gap-2 rounded-lg bg-success-50 px-3 py-2 text-xs font-medium text-success-600">
        Auto-saving enabled
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-base font-semibold text-gray-900">Checklist</h1>
        <span className="text-sm text-gray-500 font-mono">
          {storeCode} · {completed}/{total}
        </span>
      </div>

      {/* Progress */}
      <Card className="!p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-gray-900">{pct}% complete</span>
          {targetDate && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">
                {getDaysRemaining(new Date(targetDate))} days
              </span>
              <RAGIndicator status={getRAGStatus(new Date(targetDate), pct)} showLabel />
            </div>
          )}
        </div>
        <ProgressBar value={pct} className="mt-2" color="bg-success-600" />
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
      <div className="flex gap-2 overflow-x-auto pb-1">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              category === cat
                ? "bg-brand-500 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Items list */}
      <div className="flex flex-col gap-2">
        {filtered.map((item) => {
          const ci = item.checklist_items;
          const isResume = resumeItem?.id === item.id;
          const statusBadge =
            item.status === "completed" ? "success" :
            item.status === "out_of_scope" ? "neutral" :
            item.status === "in_progress" ? "info" : "warning";

          return (
            <div
              key={item.id}
              onClick={() => router.push(`/sm/audit/${id}/item/${item.id}`)}
              className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-gray-50 ${
                isResume
                  ? "border-l-4 border-l-brand-500 border-gray-200 bg-brand-50"
                  : item.status === "out_of_scope"
                    ? "border-gray-100 bg-gray-50 opacity-60"
                    : "border-gray-200"
              }`}
            >
              <span className="flex h-7 w-7 items-center justify-center rounded bg-gray-100 text-xs font-mono font-medium text-gray-700">
                {ci?.sr_no}
              </span>
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium text-gray-900">
                  {ci?.work_type} · {ci?.activity}
                </p>
                <div className="mt-0.5 flex items-center gap-2">
                  <Badge variant={(categoryColors[ci?.category] || "neutral") as "success" | "error" | "warning" | "info" | "neutral"}>
                    {ci?.category}
                  </Badge>
                  <Badge variant={statusBadge as "success" | "error" | "warning" | "info" | "neutral"}>
                    {item.status.replace(/_/g, " ")}
                  </Badge>
                </div>
                {isResume && (
                  <p className="mt-0.5 text-xs font-medium text-brand-500">
                    ↳ Resume here
                  </p>
                )}
              </div>
              <ChevronRightIcon className="h-4 w-4 shrink-0 text-gray-400" />
            </div>
          );
        })}
      </div>

      {/* If all done, show submit link */}
      {pct === 100 && (
        <button
          onClick={() => router.push(`/sm/audit/${id}/submit`)}
          className="w-full rounded-lg bg-success-600 px-4 py-3 text-sm font-medium text-white hover:bg-success-700"
        >
          All items complete — Submit for review
        </button>
      )}
    </div>
  );
}
