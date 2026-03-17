"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useEmployee } from "@/lib/hooks/useEmployee";
import NSOTopbar from "@/components/layout/NSOTopbar";
import Badge from "@/components/ui/Badge";
import ProgressBar from "@/components/ui/ProgressBar";
import RAGIndicator from "@/components/ui/RAGIndicator";
import Tabs from "@/components/ui/Tabs";
import Spinner from "@/components/ui/Spinner";
import { Table, THead, TH, TD, TR } from "@/components/ui/Table";
import { getRAGStatus, getDaysRemaining } from "@/lib/utils/rag";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";

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
      <div className="mx-auto w-full max-w-[--breakpoint-2xl] p-4 md:p-6">
        <div className="space-y-5">
          {/* Filters row */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search stores..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-11 w-full rounded-lg border border-gray-300 bg-transparent pl-10 pr-4 text-theme-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 sm:w-80"
              />
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="h-11 appearance-none rounded-lg border border-gray-300 bg-white px-4 pr-10 text-theme-sm text-gray-700 shadow-theme-xs focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10"
            >
              <option value="deadline">Sort by deadline</option>
              <option value="completion">Sort by completion %</option>
            </select>
          </div>

          {/* Tabs */}
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

          {/* Table */}
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
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-theme-sm text-gray-500">
                    No stores found.
                  </td>
                </tr>
              )}
              {filtered.map((s) => {
                const pct = s.total > 0 ? Math.round((s.progress / s.total) * 100) : 0;
                const days = s.target_completion_date ? getDaysRemaining(new Date(s.target_completion_date)) : null;
                return (
                  <TR key={s.id} onClick={() => router.push(`/nso/store/${s.id}`)}>
                    <TD className="font-mono font-medium text-gray-800">{s.store_code}</TD>
                    <TD>
                      <p className="font-medium text-gray-800">{s.store_name}</p>
                      <p className="text-theme-xs text-gray-500">{s.city}, {s.state}</p>
                    </TD>
                    <TD><Badge variant="neutral">{s.store_type}</Badge></TD>
                    <TD><Badge variant={statusMap[s.audit_status] || "neutral"}>{s.audit_status.replace(/_/g, " ")}</Badge></TD>
                    <TD>
                      <div className="flex items-center gap-2.5 min-w-[120px]">
                        <RAGIndicator status={pct >= 80 ? "green" : pct >= 40 ? "amber" : "red"} />
                        <ProgressBar value={pct} className="w-24" color={pct >= 80 ? "bg-success-500" : pct >= 40 ? "bg-warning-500" : "bg-error-500"} />
                        <span className="text-theme-xs font-medium text-gray-700 tabular-nums">{pct}%</span>
                      </div>
                    </TD>
                    <TD>
                      {days !== null && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-theme-xs tabular-nums text-gray-700">{days}d</span>
                          <RAGIndicator status={getRAGStatus(new Date(s.target_completion_date), pct)} />
                        </div>
                      )}
                    </TD>
                    <TD>
                      {(s.audit_status === "submitted" || s.audit_status === "resubmitted") && (
                        <button
                          onClick={() => router.push(`/nso/store/${s.id}/approve`)}
                          className="rounded-lg bg-warning-50 px-3 py-1.5 text-theme-xs font-medium text-warning-700 hover:bg-warning-100 transition-colors"
                        >
                          Review
                        </button>
                      )}
                      {s.audit_status === "in_progress" && (
                        <button
                          onClick={() => router.push(`/nso/store/${s.id}`)}
                          className="rounded-lg bg-brand-50 px-3 py-1.5 text-theme-xs font-medium text-brand-500 hover:bg-brand-100 transition-colors"
                        >
                          View
                        </button>
                      )}
                      {s.audit_status === "approved" && (
                        <button
                          onClick={() => {
                            const supabase = createClient();
                            supabase.from("audits").select("id").eq("store_id", s.id).eq("status", "approved").limit(1).then(({ data }) => {
                              if (data?.[0]) router.push(`/report/${data[0].id}`);
                            });
                          }}
                          className="rounded-lg bg-success-50 px-3 py-1.5 text-theme-xs font-medium text-success-600 hover:bg-success-100 transition-colors"
                        >
                          Report
                        </button>
                      )}
                    </TD>
                  </TR>
                );
              })}
            </tbody>
          </Table>
        </div>
      </div>
    </div>
  );
}
