"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useEmployee } from "@/lib/hooks/useEmployee";
import NSOTopbar from "@/components/layout/NSOTopbar";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import ProgressBar from "@/components/ui/ProgressBar";
import RAGIndicator from "@/components/ui/RAGIndicator";
import Tabs from "@/components/ui/Tabs";
import Spinner from "@/components/ui/Spinner";
import { Table, THead, TH, TD, TR } from "@/components/ui/Table";
import { getRAGStatus, getDaysRemaining } from "@/lib/utils/rag";
interface StoreRow {
  id: string;
  store_code: string;
  store_name: string;
  city: string;
  state: string;
  store_type: string;
  target_completion_date: string;
  audit_status: string;
  progress: number;
  total: number;
  updated_at: string;
}

const statusMap: Record<string, "success" | "error" | "warning" | "info" | "neutral"> = {
  approved: "success",
  submitted: "warning",
  resubmitted: "warning",
  in_progress: "info",
  rework_required: "error",
  no_audit: "neutral",
};

export default function NSOStoresPage() {
  const { employee } = useEmployee();
  const [stores, setStores] = useState<StoreRow[]>([]);
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("deadline");
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!employee) return;
    const supabase = createClient();

    async function fetchData() {
      const { data: storesData } = await supabase
        .from("stores")
        .select("id, store_code, store_name, city, state, store_type, target_completion_date")
        .eq("assigned_nso_id", employee!.id);

      if (!storesData) { setLoading(false); return; }

      const rows: StoreRow[] = [];
      for (const s of storesData) {
        const { data: audits } = await supabase
          .from("audits")
          .select("id, status, updated_at")
          .eq("store_id", s.id)
          .order("created_at", { ascending: false })
          .limit(1);

        const audit = audits?.[0];
        let progress = 0, total = 0;
        if (audit) {
          const { count: t } = await supabase.from("audit_items").select("*", { count: "exact", head: true }).eq("audit_id", audit.id);
          const { count: c } = await supabase.from("audit_items").select("*", { count: "exact", head: true }).eq("audit_id", audit.id).in("status", ["completed", "out_of_scope"]);
          total = t || 0;
          progress = c || 0;
        }

        rows.push({
          id: s.id,
          store_code: s.store_code,
          store_name: s.store_name,
          city: s.city,
          state: s.state,
          store_type: s.store_type,
          target_completion_date: s.target_completion_date,
          audit_status: audit?.status || "no_audit",
          progress,
          total,
          updated_at: audit?.updated_at || s.target_completion_date,
        });
      }
      setStores(rows);
      setLoading(false);
    }
    fetchData();
  }, [employee]);

  const filtered = stores
    .filter((s) => {
      if (search && !s.store_name.toLowerCase().includes(search.toLowerCase()) && !s.store_code.toLowerCase().includes(search.toLowerCase())) return false;
      if (tab === "needs_review") return s.audit_status === "submitted" || s.audit_status === "resubmitted";
      if (tab === "in_progress") return s.audit_status === "in_progress";
      if (tab === "approved") return s.audit_status === "approved";
      if (tab === "overdue") return s.target_completion_date && getDaysRemaining(new Date(s.target_completion_date)) < 0;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "deadline") {
        if (!a.target_completion_date && !b.target_completion_date) return 0;
        if (!a.target_completion_date) return 1;
        if (!b.target_completion_date) return -1;
        return new Date(a.target_completion_date).getTime() - new Date(b.target_completion_date).getTime();
      }
      if (sortBy === "completion") return (b.total > 0 ? b.progress / b.total : 0) - (a.total > 0 ? a.progress / a.total : 0);
      return 0;
    });

  if (loading) return <div className="flex h-screen items-center justify-center"><Spinner size="lg" /></div>;

  return (
    <div className="flex flex-col">
      <NSOTopbar title="All Stores" />
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <input
            type="text"
            placeholder="Search stores..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-11 w-80 rounded-lg border border-gray-200 px-4 text-sm placeholder:text-gray-400 focus:border-brand-500 focus:outline-none"
          />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="h-11 rounded-lg border border-gray-200 px-3 text-sm text-gray-700"
          >
            <option value="deadline">Sort by deadline</option>
            <option value="completion">Sort by completion %</option>
          </select>
        </div>

        <Tabs
          tabs={[
            { label: "All", value: "all", count: stores.length },
            { label: "Needs review", value: "needs_review" },
            { label: "In progress", value: "in_progress" },
            { label: "Approved", value: "approved" },
            { label: "Overdue", value: "overdue" },
          ]}
          active={tab}
          onChange={setTab}
        />

        <Card className="!p-0 overflow-hidden">
          <Table>
            <THead>
              <tr>
                <TH>Store Code</TH>
                <TH>Store / Location</TH>
                <TH>Type</TH>
                <TH>Status</TH>
                <TH>Progress</TH>
                <TH>Deadline</TH>
                <TH>Action</TH>
              </tr>
            </THead>
            <tbody>
              {filtered.map((s) => {
                const pct = s.total > 0 ? Math.round((s.progress / s.total) * 100) : 0;
                return (
                  <TR key={s.id} onClick={() => router.push(`/nso/store/${s.id}`)}>
                    <TD className="font-mono font-medium">{s.store_code}</TD>
                    <TD>
                      <p className="font-medium">{s.store_name}</p>
                      <p className="text-xs text-gray-500">{s.city}, {s.state}</p>
                    </TD>
                    <TD><Badge variant="neutral">{s.store_type}</Badge></TD>
                    <TD><Badge variant={statusMap[s.audit_status] || "neutral"}>{s.audit_status.replace(/_/g, " ")}</Badge></TD>
                    <TD>
                      <div className="flex items-center gap-2">
                        <ProgressBar value={pct} className="w-20" color="bg-success-600" />
                        <span className="text-xs">{pct}%</span>
                      </div>
                    </TD>
                    <TD>
                      {s.target_completion_date && (
                        <div className="flex items-center gap-1">
                          <span className="text-xs">{getDaysRemaining(new Date(s.target_completion_date))}d</span>
                          <RAGIndicator status={getRAGStatus(new Date(s.target_completion_date), pct)} />
                        </div>
                      )}
                    </TD>
                    <TD>
                      {(s.audit_status === "submitted" || s.audit_status === "resubmitted") && (
                        <button className="rounded-md bg-warning-50 px-2.5 py-1 text-xs font-medium text-warning-700">Review</button>
                      )}
                      {s.audit_status === "approved" && (
                        <button className="rounded-md bg-success-50 px-2.5 py-1 text-xs font-medium text-success-600">Report</button>
                      )}
                    </TD>
                  </TR>
                );
              })}
            </tbody>
          </Table>
        </Card>
      </div>
    </div>
  );
}
