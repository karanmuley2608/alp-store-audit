"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useEmployee } from "@/lib/hooks/useEmployee";
import NSOTopbar from "@/components/layout/NSOTopbar";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Spinner from "@/components/ui/Spinner";
import { getRAGStatus, getDaysRemaining } from "@/lib/utils/rag";
import RAGIndicator from "@/components/ui/RAGIndicator";
import ProgressBar from "@/components/ui/ProgressBar";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

interface StoreRow {
  id: string;
  store_code: string;
  store_name: string;
  city: string;
  state: string;
  target_completion_date: string;
  audit_status: string;
  progress: number;
  total: number;
  satisfied: number;
  notSatisfied: number;
}

interface KPIs {
  stores_tracked: number;
  total_items: number;
  completed: number;
  wip: number;
  not_started: number;
  satisfied: number;
  not_satisfied: number;
  pending_review: number;
}

export default function NSODashboardPage() {
  const { employee, loading: empLoading } = useEmployee();
  const [kpis, setKpis] = useState<KPIs>({ stores_tracked: 0, total_items: 0, completed: 0, wip: 0, not_started: 0, satisfied: 0, not_satisfied: 0, pending_review: 0 });
  const [stores, setStores] = useState<StoreRow[]>([]);
  const [actionItems, setActionItems] = useState<{ type: string; label: string; storeId: string; auditId?: string }[]>([]);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!employee) return;
    const supabase = createClient();

    async function fetchData() {
      // Get NSO's stores
      const { data: storesData } = await supabase
        .from("stores")
        .select("id, store_code, store_name, city, state, target_completion_date")
        .eq("assigned_nso_id", employee!.id);

      if (!storesData) { setLoading(false); return; }

      const rows: StoreRow[] = [];
      const actions: typeof actionItems = [];
      let totalItems = 0, completedCount = 0, wipCount = 0, notStartedCount = 0, satisfiedCount = 0, notSatisfiedCount = 0, pendingReviewCount = 0;

      for (const s of storesData) {
        // Get latest audit for this store
        const { data: audits } = await supabase
          .from("audits")
          .select("id, status")
          .eq("store_id", s.id)
          .order("created_at", { ascending: false })
          .limit(1);

        const audit = audits?.[0];
        let progress = 0, total = 0, sat = 0, notSat = 0;

        if (audit) {
          const { data: items } = await supabase
            .from("audit_items")
            .select("status, satisfaction_status")
            .eq("audit_id", audit.id);

          if (items) {
            total = items.length;
            progress = items.filter((i) => i.status === "completed" || i.status === "out_of_scope").length;
            sat = items.filter((i) => i.satisfaction_status === "satisfied").length;
            notSat = items.filter((i) => i.satisfaction_status === "not_satisfied").length;
            totalItems += total;
            completedCount += progress;
            wipCount += items.filter((i) => i.status === "in_progress").length;
            notStartedCount += items.filter((i) => i.status === "pending").length;
            satisfiedCount += sat;
            notSatisfiedCount += notSat;
          }

          if (audit.status === "submitted" || audit.status === "resubmitted") {
            pendingReviewCount++;
            actions.push({ type: "review", label: `${s.store_name} — audit submitted`, storeId: s.id, auditId: audit.id });
          }
        }

        const pct = total > 0 ? Math.round((progress / total) * 100) : 0;
        const daysLeft = s.target_completion_date ? getDaysRemaining(new Date(s.target_completion_date)) : 999;

        if (daysLeft < 5 && pct < 50) {
          actions.push({ type: "deadline", label: `${s.store_name} — ${daysLeft}d left, ${pct}%`, storeId: s.id });
        }
        if (daysLeft < 0) {
          actions.push({ type: "overdue", label: `${s.store_name} — overdue`, storeId: s.id });
        }

        rows.push({
          id: s.id,
          store_code: s.store_code,
          store_name: s.store_name,
          city: s.city,
          state: s.state,
          target_completion_date: s.target_completion_date,
          audit_status: audit?.status || "no_audit",
          progress,
          total,
          satisfied: sat,
          notSatisfied: notSat,
        });
      }

      setStores(rows);
      setKpis({
        stores_tracked: storesData.length,
        total_items: totalItems,
        completed: completedCount,
        wip: wipCount,
        not_started: notStartedCount,
        satisfied: satisfiedCount,
        not_satisfied: notSatisfiedCount,
        pending_review: pendingReviewCount,
      });
      setActionItems(actions);
      setLoading(false);
    }
    fetchData();
  }, [employee]);

  if (empLoading || loading) return <div className="flex h-screen items-center justify-center"><Spinner size="lg" /></div>;

  const kpiItems = [
    { label: "STORES", value: kpis.stores_tracked, color: "text-gray-900" },
    { label: "TOTAL ITEMS", value: kpis.total_items, color: "text-gray-900" },
    { label: "COMPLETED", value: kpis.completed, color: "text-success-600" },
    { label: "WIP", value: kpis.wip, color: "text-warning-700" },
    { label: "NOT STARTED", value: kpis.not_started, color: "text-gray-500" },
    { label: "SATISFIED", value: kpis.satisfied, color: "text-success-600" },
    { label: "NOT SATISFIED", value: kpis.not_satisfied, color: "text-error-600" },
    { label: "PENDING REVIEW", value: kpis.pending_review, color: "text-brand-500" },
  ];

  const filteredStores = stores.filter((s) => {
    if (search && !s.store_name.toLowerCase().includes(search.toLowerCase()) && !s.store_code.toLowerCase().includes(search.toLowerCase())) return false;
    if (filter === "needs_review") return s.audit_status === "submitted" || s.audit_status === "resubmitted";
    if (filter === "in_progress") return s.audit_status === "in_progress";
    if (filter === "approved") return s.audit_status === "approved";
    if (filter === "overdue") return s.target_completion_date && getDaysRemaining(new Date(s.target_completion_date)) < 0;
    return true;
  });

  const totalProgress = kpis.total_items > 0 ? Math.round((kpis.completed / kpis.total_items) * 100) : 0;

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <NSOTopbar title="Dashboard" />

      {/* KPI Strip */}
      <div className="flex shrink-0 border-b border-gray-200 bg-white">
        {kpiItems.map((k, i) => (
          <div key={k.label} className={`flex flex-1 flex-col items-center px-3 py-3 ${i < kpiItems.length - 1 ? "border-r border-gray-200" : ""}`}>
            <span className="text-[10px] font-medium uppercase text-gray-400">{k.label}</span>
            <span className={`text-kpi-std ${k.color}`}>{k.value}</span>
          </div>
        ))}
      </div>

      {/* Main grid */}
      <div className="grid flex-1 grid-cols-[1.2fr_1fr_0.8fr] gap-4 overflow-hidden p-4" style={{ minHeight: 0 }}>
        {/* Store table column - spans 2 rows */}
        <div className="row-span-2 flex flex-col overflow-hidden rounded-card border border-gray-200 bg-white">
          <div className="flex items-center justify-between border-b border-gray-200 p-4">
            <div>
              <h2 className="text-card-title text-gray-900">Store audit details</h2>
              <p className="text-xs text-gray-500">{stores.length} stores</p>
            </div>
          </div>
          <div className="px-4 py-2">
            <input
              type="text"
              placeholder="Search stores..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-full rounded-lg border border-gray-200 px-3 text-sm placeholder:text-gray-400 focus:border-brand-500 focus:outline-none"
            />
          </div>
          <div className="flex gap-1 px-4 pb-2 overflow-x-auto">
            {[
              { label: "All", value: "all" },
              { label: "Needs review", value: "needs_review" },
              { label: "In progress", value: "in_progress" },
              { label: "Approved", value: "approved" },
              { label: "Overdue", value: "overdue" },
            ].map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${filter === f.value ? "bg-brand-500 text-white" : "bg-gray-100 text-gray-700"}`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto">
            <table className="w-full">
              <thead className="sticky top-0 bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Store</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Status</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Progress</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Deadline</th>
                  <th className="px-4 py-2 text-xs font-medium text-gray-500">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredStores.map((s) => {
                  const pct = s.total > 0 ? Math.round((s.progress / s.total) * 100) : 0;
                  return (
                    <tr
                      key={s.id}
                      onClick={() => router.push(`/nso/store/${s.id}`)}
                      className="cursor-pointer border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="px-4 py-2.5">
                        <p className="text-sm font-medium text-gray-900">{s.store_code}</p>
                        <p className="text-xs text-gray-500">{s.store_name} · {s.city}</p>
                      </td>
                      <td className="px-4 py-2.5">
                        <Badge variant={
                          s.audit_status === "approved" ? "success" :
                          s.audit_status === "submitted" || s.audit_status === "resubmitted" ? "warning" :
                          s.audit_status === "in_progress" ? "info" :
                          s.audit_status === "rework_required" ? "error" : "neutral"
                        }>
                          {s.audit_status.replace(/_/g, " ")}
                        </Badge>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <ProgressBar value={pct} className="w-16" color="bg-success-600" />
                          <span className="text-xs text-gray-500">{pct}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        {s.target_completion_date && (
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-gray-500">
                              {getDaysRemaining(new Date(s.target_completion_date))}d
                            </span>
                            <RAGIndicator status={getRAGStatus(new Date(s.target_completion_date), pct)} />
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        {(s.audit_status === "submitted" || s.audit_status === "resubmitted") && (
                          <button className="rounded-md bg-warning-50 px-2 py-1 text-xs font-medium text-warning-700">Review</button>
                        )}
                        {s.audit_status === "in_progress" && (
                          <button className="rounded-md bg-brand-50 px-2 py-1 text-xs font-medium text-brand-500">View</button>
                        )}
                        {s.audit_status === "approved" && (
                          <button className="rounded-md bg-success-50 px-2 py-1 text-xs font-medium text-success-600">Report</button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Work Count by Store - stacked bar */}
        <Card className="flex flex-col overflow-hidden">
          <h3 className="text-card-title text-gray-900 mb-2">Work Count by Store</h3>
          <div className="relative flex-1 min-h-0">
            <Bar
              data={{
                labels: stores.map((s) => s.store_code),
                datasets: [
                  {
                    label: "Completed",
                    data: stores.map((s) => s.progress),
                    backgroundColor: "#039855",
                  },
                  {
                    label: "WIP",
                    data: stores.map((s) => Math.max(0, s.total > 0 ? Math.round(s.total * 0.1) : 0)),
                    backgroundColor: "#B54708",
                  },
                  {
                    label: "Not Started",
                    data: stores.map((s) => Math.max(0, s.total - s.progress)),
                    backgroundColor: "#E4E7EC",
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { position: "bottom", labels: { boxWidth: 12, font: { size: 11 } } },
                },
                scales: {
                  x: { stacked: true, grid: { display: false }, ticks: { font: { size: 10 } } },
                  y: { stacked: true, grid: { color: "#F2F4F7" }, ticks: { font: { size: 10 } } },
                },
              }}
            />
          </div>
        </Card>

        {/* Action panel - top right */}
        <Card className="flex flex-col overflow-hidden">
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-card-title text-gray-900">Action required</h3>
            {actionItems.length > 0 && (
              <Badge variant="error">{actionItems.length}</Badge>
            )}
          </div>
          <div className="flex-1 overflow-y-auto space-y-2">
            {actionItems.length === 0 ? (
              <p className="text-sm text-gray-400">No actions needed</p>
            ) : (
              actionItems.map((a, i) => (
                <div
                  key={i}
                  onClick={() => router.push(`/nso/store/${a.storeId}`)}
                  className={`cursor-pointer rounded-lg px-3 py-2 text-xs font-medium ${
                    a.type === "review" ? "bg-error-50 text-error-600" :
                    a.type === "deadline" ? "bg-warning-50 text-warning-700" :
                    "bg-error-50 text-error-600"
                  }`}
                >
                  {a.label}
                </div>
              ))
            )}
          </div>

          {/* Overall progress */}
          <div className="mt-3 border-t border-gray-200 pt-3">
            <p className="text-xs text-gray-500 mb-1">Overall progress</p>
            <div className="flex h-3 w-full overflow-hidden rounded-full bg-gray-100">
              <div className="bg-success-600" style={{ width: `${totalProgress}%` }} />
              <div className="bg-warning-50" style={{ width: `${kpis.total_items > 0 ? Math.round((kpis.wip / kpis.total_items) * 100) : 0}%` }} />
            </div>
            <div className="mt-1 flex gap-3 text-[10px] text-gray-500">
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-success-600" />Complete</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-warning-50 border border-warning-700" />WIP</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-gray-200" />Not started</span>
            </div>
          </div>
        </Card>

        {/* Role Submissions - horizontal bar */}
        <Card className="flex flex-col overflow-hidden">
          <h3 className="text-card-title text-gray-900 mb-2">Role Submissions</h3>
          <div className="relative flex-1 min-h-0">
            <Bar
              data={{
                labels: (() => {
                  const statusCounts: Record<string, number> = {};
                  stores.forEach((s) => {
                    const status = s.audit_status === "no_audit" ? "No Audit" : s.audit_status.replace(/_/g, " ");
                    statusCounts[status] = (statusCounts[status] || 0) + 1;
                  });
                  return Object.keys(statusCounts);
                })(),
                datasets: [
                  {
                    label: "Stores",
                    data: (() => {
                      const statusCounts: Record<string, number> = {};
                      stores.forEach((s) => {
                        const status = s.audit_status === "no_audit" ? "No Audit" : s.audit_status.replace(/_/g, " ");
                        statusCounts[status] = (statusCounts[status] || 0) + 1;
                      });
                      return Object.values(statusCounts);
                    })(),
                    backgroundColor: ["#039855", "#465FFF", "#B54708", "#D92D20", "#98A2B3"],
                  },
                ],
              }}
              options={{
                indexAxis: "y",
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false },
                },
                scales: {
                  x: { grid: { color: "#F2F4F7" }, ticks: { font: { size: 10 }, stepSize: 1 } },
                  y: { grid: { display: false }, ticks: { font: { size: 11 } } },
                },
              }}
            />
          </div>
        </Card>

        {/* Bottom right - state progress */}
        <Card className="flex flex-col overflow-hidden">
          <h3 className="text-card-title text-gray-900 mb-2">State Progress</h3>
          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-gray-400">
                  <th className="pb-1 text-left font-medium">State</th>
                  <th className="pb-1 text-right font-medium">Done</th>
                  <th className="pb-1 text-right font-medium">%</th>
                </tr>
              </thead>
              <tbody>
                {stores.reduce((acc: { state: string; done: number; total: number }[], s) => {
                  const existing = acc.find((a) => a.state === s.state);
                  if (existing) {
                    existing.done += s.progress;
                    existing.total += s.total;
                  } else {
                    acc.push({ state: s.state, done: s.progress, total: s.total });
                  }
                  return acc;
                }, []).map((row) => (
                  <tr key={row.state} className="border-t border-gray-100">
                    <td className="py-1 text-gray-700">{row.state}</td>
                    <td className="py-1 text-right text-gray-900">{row.done}</td>
                    <td className="py-1 text-right text-gray-500">{row.total > 0 ? Math.round((row.done / row.total) * 100) : 0}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
