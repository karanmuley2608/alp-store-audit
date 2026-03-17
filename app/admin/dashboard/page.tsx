"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import Card from "@/components/ui/Card";
import Spinner from "@/components/ui/Spinner";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({ stores: 0, employees: 0, completion: 0, approved: 0, onTrack: 0, atRisk: 0, overdue: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    async function fetchData() {
      const { count: storeCount } = await supabase.from("stores").select("*", { count: "exact", head: true });
      const { count: empCount } = await supabase.from("employees").select("*", { count: "exact", head: true });
      const { data: audits } = await supabase.from("audits").select("id, status, store_id, stores(target_completion_date)");

      let approved = 0, totalItems = 0, completedItems = 0, onTrack = 0, atRisk = 0, overdue = 0;

      if (audits) {
        for (const a of audits) {
          if (a.status === "approved") approved++;
          const store = a.stores as unknown as { target_completion_date: string };
          const target = store?.target_completion_date;

          const { count: total } = await supabase.from("audit_items").select("*", { count: "exact", head: true }).eq("audit_id", a.id);
          const { count: done } = await supabase.from("audit_items").select("*", { count: "exact", head: true }).eq("audit_id", a.id).in("status", ["completed", "out_of_scope"]);
          totalItems += total || 0;
          completedItems += done || 0;

          if (target) {
            const days = Math.ceil((new Date(target).getTime() - Date.now()) / 86400000);
            const pct = total ? Math.round(((done || 0) / total) * 100) : 0;
            if (days < 0) overdue++;
            else if (days < 14 && pct < 80) atRisk++;
            else onTrack++;
          }
        }
      }

      setStats({
        stores: storeCount || 0,
        employees: empCount || 0,
        completion: totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0,
        approved,
        onTrack,
        atRisk,
        overdue,
      });
      setLoading(false);
    }
    fetchData();
  }, []);

  if (loading) return <div className="flex h-screen items-center justify-center"><Spinner size="lg" /></div>;

  const kpis = [
    { label: "Total Stores", value: stats.stores },
    { label: "Total Employees", value: stats.employees },
    { label: "Overall Completion", value: `${stats.completion}%` },
    { label: "Stores Approved", value: stats.approved },
  ];

  const health = [
    { label: "On track", value: stats.onTrack, color: "text-success-600", bg: "bg-success-50" },
    { label: "At risk", value: stats.atRisk, color: "text-warning-700", bg: "bg-warning-50" },
    { label: "Overdue", value: stats.overdue, color: "text-error-600", bg: "bg-error-50" },
  ];

  const quickLinks = [
    { label: "Manage Employees", href: "/admin/employees" },
    { label: "Manage Stores", href: "/admin/stores" },
    { label: "Manage Regions", href: "/admin/regions" },
    { label: "Edit Checklist", href: "/admin/checklist" },
    { label: "View Audit Trail", href: "/admin/audit-trail" },
    { label: "Bulk Import", href: "/admin/import" },
  ];

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-page-title text-gray-900">Admin Dashboard</h1>

      <div className="grid grid-cols-4 gap-4">
        {kpis.map((k) => (
          <Card key={k.label}>
            <p className="text-sm text-gray-500">{k.label}</p>
            <p className="mt-1 text-kpi-std text-gray-900">{k.value}</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4">
        {health.map((h) => (
          <Card key={h.label} className={h.bg}>
            <p className="text-sm text-gray-500">{h.label}</p>
            <p className={`mt-1 text-kpi-hero ${h.color}`}>{h.value}</p>
          </Card>
        ))}
      </div>

      <Card>
        <h2 className="text-card-title text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-3 gap-3">
          {quickLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-lg border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              {l.label}
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}
