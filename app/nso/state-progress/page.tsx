"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useEmployee } from "@/lib/hooks/useEmployee";
import NSOTopbar from "@/components/layout/NSOTopbar";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import ProgressBar from "@/components/ui/ProgressBar";
import Spinner from "@/components/ui/Spinner";
import { Table, THead, TH, TD, TR } from "@/components/ui/Table";

interface StateRow {
  state: string;
  totalItems: number;
  completed: number;
  wip: number;
  notStarted: number;
  satisfaction: number;
}

export default function StateProgressPage() {
  const { employee } = useEmployee();
  const [rows, setRows] = useState<StateRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!employee) return;
    const supabase = createClient();

    async function fetchData() {
      const { data: stores } = await supabase
        .from("stores")
        .select("id, state")
        .eq("assigned_nso_id", employee!.id);

      if (!stores) { setLoading(false); return; }

      const stateMap = new Map<string, StateRow>();

      for (const s of stores) {
        if (!stateMap.has(s.state)) {
          stateMap.set(s.state, { state: s.state, totalItems: 0, completed: 0, wip: 0, notStarted: 0, satisfaction: 0 });
        }
        const row = stateMap.get(s.state)!;

        const { data: audits } = await supabase
          .from("audits")
          .select("id")
          .eq("store_id", s.id)
          .order("created_at", { ascending: false })
          .limit(1);

        if (audits?.length) {
          const { data: items } = await supabase
            .from("audit_items")
            .select("status, satisfaction_status")
            .eq("audit_id", audits[0].id);

          if (items) {
            row.totalItems += items.length;
            row.completed += items.filter((i) => i.status === "completed" || i.status === "out_of_scope").length;
            row.wip += items.filter((i) => i.status === "in_progress").length;
            row.notStarted += items.filter((i) => i.status === "pending").length;
            row.satisfaction += items.filter((i) => i.satisfaction_status === "satisfied").length;
          }
        }
      }

      setRows(Array.from(stateMap.values()));
      setLoading(false);
    }
    fetchData();
  }, [employee]);

  function exportCSV() {
    const headers = ["State", "Total Items", "Completed", "WIP", "Not Started", "%", "Satisfaction %"];
    const csvRows = rows.map((r) => [
      r.state, r.totalItems, r.completed, r.wip, r.notStarted,
      r.totalItems > 0 ? Math.round((r.completed / r.totalItems) * 100) : 0,
      r.totalItems > 0 ? Math.round((r.satisfaction / r.totalItems) * 100) : 0,
    ].join(","));
    const csv = [headers.join(","), ...csvRows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "state_progress.csv";
    a.click();
  }

  if (loading) return <div className="flex h-screen items-center justify-center"><Spinner size="lg" /></div>;

  return (
    <div className="flex flex-col">
      <NSOTopbar title="State Progress" />
      <div className="space-y-4 p-6">
        <div className="flex justify-end">
          <Button variant="secondary" onClick={exportCSV}>Export to CSV</Button>
        </div>

        <Card className="!p-0 overflow-hidden">
          <Table>
            <THead>
              <tr>
                <TH>State</TH>
                <TH>Total Items</TH>
                <TH>Completed</TH>
                <TH>WIP</TH>
                <TH>Not Started</TH>
                <TH>%</TH>
                <TH>Satisfaction %</TH>
              </tr>
            </THead>
            <tbody>
              {rows.map((r) => {
                const pct = r.totalItems > 0 ? Math.round((r.completed / r.totalItems) * 100) : 0;
                const satPct = r.totalItems > 0 ? Math.round((r.satisfaction / r.totalItems) * 100) : 0;
                return (
                  <TR key={r.state}>
                    <TD className="font-medium">{r.state}</TD>
                    <TD>{r.totalItems}</TD>
                    <TD className="text-success-600">{r.completed}</TD>
                    <TD className="text-warning-700">{r.wip}</TD>
                    <TD className="text-gray-500">{r.notStarted}</TD>
                    <TD>
                      <div className="flex items-center gap-2">
                        <ProgressBar
                          value={pct}
                          className="w-16"
                          color={pct > 60 ? "bg-success-600" : pct > 30 ? "bg-warning-700" : "bg-error-600"}
                        />
                        <span className="text-xs">{pct}%</span>
                      </div>
                    </TD>
                    <TD>{satPct}%</TD>
                  </TR>
                );
              })}
            </tbody>
          </Table>
        </Card>

        {/* Zero activity warnings */}
        {rows.filter((r) => r.completed === 0 && r.totalItems > 0).map((r) => (
          <Card key={r.state} className="border-error-600 bg-error-50">
            <p className="text-sm font-medium text-error-600">
              Zero activity: {r.state} has {r.totalItems} items with 0% progress
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
}
