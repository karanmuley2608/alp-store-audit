"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useEmployee } from "@/lib/hooks/useEmployee";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import ProgressBar from "@/components/ui/ProgressBar";
import RAGIndicator from "@/components/ui/RAGIndicator";
import Spinner from "@/components/ui/Spinner";
import { getGreeting, formatIST } from "@/lib/utils/dates";
import { getRAGStatus, getDaysRemaining } from "@/lib/utils/rag";

interface AuditSummary {
  id: string;
  store_name: string;
  store_code: string;
  status: string;
  progress: number;
  total: number;
  updated_at: string;
  target_date: string;
}

interface Stats {
  in_progress: number;
  pending_review: number;
  rework_required: number;
  approved: number;
}

export default function SMHomePage() {
  const { employee, loading: empLoading } = useEmployee();
  const [inProgressAudit, setInProgressAudit] = useState<AuditSummary | null>(null);
  const [stats, setStats] = useState<Stats>({ in_progress: 0, pending_review: 0, rework_required: 0, approved: 0 });
  const [loading, setLoading] = useState(true);
  const [storeName, setStoreName] = useState("");
  const [storeCode, setStoreCode] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (!employee) return;

    const supabase = createClient();
    const code = localStorage.getItem("selected_store_code") || employee.store_codes?.[0];
    setStoreCode(code || "");

    async function fetchData() {
      // Get store info
      if (code) {
        const { data: store } = await supabase
          .from("stores")
          .select("store_name")
          .eq("store_code", code)
          .single();
        if (store) setStoreName(store.store_name);
      }

      // Get audits for this SM
      const { data: audits } = await supabase
        .from("audits")
        .select("id, status, store_id, updated_at, stores(store_name, store_code, target_completion_date)")
        .eq("sm_id", employee!.id);

      if (audits) {
        const s: Stats = { in_progress: 0, pending_review: 0, rework_required: 0, approved: 0 };
        for (const a of audits) {
          if (a.status === "in_progress") s.in_progress++;
          if (a.status === "submitted" || a.status === "pending_review") s.pending_review++;
          if (a.status === "rework_required") s.rework_required++;
          if (a.status === "approved") s.approved++;
        }
        setStats(s);

        // Find in-progress audit
        const ip = audits.find((a) => a.status === "in_progress");
        if (ip) {
          const { count: total } = await supabase
            .from("audit_items")
            .select("*", { count: "exact", head: true })
            .eq("audit_id", ip.id);

          const { count: completed } = await supabase
            .from("audit_items")
            .select("*", { count: "exact", head: true })
            .eq("audit_id", ip.id)
            .in("status", ["completed", "out_of_scope"]);

          const store = ip.stores as unknown as { store_name: string; store_code: string; target_completion_date: string };
          setInProgressAudit({
            id: ip.id,
            store_name: store?.store_name || "",
            store_code: store?.store_code || "",
            status: ip.status,
            progress: completed || 0,
            total: total || 0,
            updated_at: ip.updated_at,
            target_date: store?.target_completion_date || "",
          });
        }
      }
      setLoading(false);
    }

    fetchData();
  }, [employee]);

  if (empLoading || loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  const firstName = employee?.full_name?.split(" ")[0] || "there";
  const pct = inProgressAudit ? Math.round((inProgressAudit.progress / inProgressAudit.total) * 100) : 0;

  return (
    <div className="space-y-5 p-4">
      {/* Greeting */}
      <div>
        <h1 className="text-page-title text-gray-900">
          {getGreeting()}, {firstName}
        </h1>
        {storeName && (
          <p className="mt-0.5 text-sm text-gray-500">
            {storeName} · <span className="font-mono">{storeCode}</span>
          </p>
        )}
      </div>

      {/* Resume banner */}
      {inProgressAudit && (
        <Card className="border-l-4 border-l-brand-500">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-semibold text-gray-900">
                {inProgressAudit.store_name}
              </p>
              <p className="text-xs text-gray-500 font-mono">
                {inProgressAudit.store_code}
              </p>
            </div>
            {inProgressAudit.target_date && (
              <RAGIndicator
                status={getRAGStatus(new Date(inProgressAudit.target_date), pct)}
                showLabel
              />
            )}
          </div>

          <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>{pct}% complete</span>
              <span>
                {inProgressAudit.progress}/{inProgressAudit.total} items
              </span>
            </div>
            <ProgressBar value={pct} className="mt-1" color="bg-success-600" />
          </div>

          <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
            <span>Updated {formatIST(inProgressAudit.updated_at, "relative")}</span>
            {inProgressAudit.target_date && (
              <span>{getDaysRemaining(new Date(inProgressAudit.target_date))} days remaining</span>
            )}
          </div>

          <Button
            className="mt-3 w-full"
            onClick={() => router.push(`/sm/audit/${inProgressAudit.id}/checklist`)}
          >
            Continue audit →
          </Button>
        </Card>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-3">
        <div className="relative">
          <Button
            className="w-full"
            disabled={!!inProgressAudit}
            onClick={() => router.push("/sm/audit/new")}
          >
            Start new audit
          </Button>
          {inProgressAudit && (
            <p className="mt-1 text-center text-xs text-gray-400">
              Complete the current audit first
            </p>
          )}
        </div>
        <Button
          variant="secondary"
          className="w-full"
          onClick={() => router.push("/sm/history")}
        >
          Audit history
        </Button>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "In progress", value: stats.in_progress, variant: "info" as const },
          { label: "Pending review", value: stats.pending_review, variant: "warning" as const },
          { label: "Rework required", value: stats.rework_required, variant: "error" as const },
          { label: "Approved", value: stats.approved, variant: "success" as const },
        ].map((item) => (
          <Card key={item.label} className="text-center">
            <p className="text-kpi-std text-gray-900">{item.value}</p>
            <Badge variant={item.variant}>{item.label}</Badge>
          </Card>
        ))}
      </div>
    </div>
  );
}
