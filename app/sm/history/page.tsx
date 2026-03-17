"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useEmployee } from "@/lib/hooks/useEmployee";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import ProgressBar from "@/components/ui/ProgressBar";
import Tabs from "@/components/ui/Tabs";
import Spinner from "@/components/ui/Spinner";
import RAGIndicator from "@/components/ui/RAGIndicator";
import Button from "@/components/ui/Button";
import { formatIST } from "@/lib/utils/dates";
import { getRAGStatus, getDaysRemaining } from "@/lib/utils/rag";

interface AuditRecord {
  id: string;
  status: string;
  updated_at: string;
  stores: { store_name: string; store_code: string; city: string; state: string; target_completion_date: string };
  itemCount: number;
  completedCount: number;
}

const statusBadgeMap: Record<string, "success" | "error" | "warning" | "info" | "neutral"> = {
  in_progress: "info",
  submitted: "warning",
  pending_review: "warning",
  rework_required: "error",
  resubmitted: "info",
  approved: "success",
  rejected: "error",
};

export default function HistoryPage() {
  const { employee } = useEmployee();
  const [audits, setAudits] = useState<AuditRecord[]>([]);
  const [tab, setTab] = useState("all");
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!employee) return;
    const supabase = createClient();

    async function fetchData() {
      const { data } = await supabase
        .from("audits")
        .select("id, status, updated_at, stores(store_name, store_code, city, state, target_completion_date)")
        .eq("sm_id", employee!.id)
        .order("updated_at", { ascending: false });

      if (data) {
        const enriched = await Promise.all(
          data.map(async (a) => {
            const { count: total } = await supabase
              .from("audit_items")
              .select("*", { count: "exact", head: true })
              .eq("audit_id", a.id);
            const { count: completed } = await supabase
              .from("audit_items")
              .select("*", { count: "exact", head: true })
              .eq("audit_id", a.id)
              .in("status", ["completed", "out_of_scope"]);
            return {
              ...a,
              stores: a.stores as unknown as AuditRecord["stores"],
              itemCount: total || 0,
              completedCount: completed || 0,
            };
          })
        );
        setAudits(enriched);
      }
      setLoading(false);
    }
    fetchData();
  }, [employee]);

  const filtered = audits.filter((a) => {
    if (tab === "all") return true;
    if (tab === "in_progress") return a.status === "in_progress";
    if (tab === "pending_review") return a.status === "submitted" || a.status === "pending_review";
    if (tab === "rework_required") return a.status === "rework_required";
    if (tab === "approved") return a.status === "approved";
    return true;
  });

  if (loading) return <div className="flex h-64 items-center justify-center"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-4 p-4">
      <h1 className="text-page-title text-gray-900">Audit History</h1>

      <Tabs
        tabs={[
          { label: "All", value: "all", count: audits.length },
          { label: "In progress", value: "in_progress" },
          { label: "Pending", value: "pending_review" },
          { label: "Rework", value: "rework_required" },
          { label: "Approved", value: "approved" },
        ]}
        active={tab}
        onChange={setTab}
      />

      {filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-400">No audits found</p>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((audit) => {
            const pct = audit.itemCount > 0 ? Math.round((audit.completedCount / audit.itemCount) * 100) : 0;
            const store = audit.stores;
            const target = store?.target_completion_date;

            return (
              <Card key={audit.id}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">{store?.store_name}</p>
                    <p className="text-xs text-gray-500 font-mono">{store?.store_code}</p>
                    <p className="text-xs text-gray-400">{store?.city}, {store?.state}</p>
                  </div>
                  <Badge variant={statusBadgeMap[audit.status] || "neutral"}>
                    {audit.status.replace(/_/g, " ")}
                  </Badge>
                </div>

                <div className="mt-3">
                  <ProgressBar value={pct} color="bg-success-600" />
                  <div className="mt-1 flex items-center justify-between text-xs text-gray-500">
                    <span>{audit.completedCount}/{audit.itemCount} items · {pct}%</span>
                    <span>Updated {formatIST(audit.updated_at, "relative")}</span>
                  </div>
                </div>

                {target && (
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-xs text-gray-400">
                      {getDaysRemaining(new Date(target))} days to deadline
                    </span>
                    <RAGIndicator status={getRAGStatus(new Date(target), pct)} showLabel />
                  </div>
                )}

                <div className="mt-3">
                  {audit.status === "in_progress" && (
                    <Button className="w-full" onClick={() => router.push(`/sm/audit/${audit.id}/checklist`)}>Continue</Button>
                  )}
                  {audit.status === "rework_required" && (
                    <Button variant="secondary" className="w-full" onClick={() => router.push(`/sm/audit/${audit.id}/rework`)}>View rework</Button>
                  )}
                  {audit.status === "approved" && (
                    <Button variant="secondary" className="w-full" onClick={() => router.push(`/report/${audit.id}`)}>View report</Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
