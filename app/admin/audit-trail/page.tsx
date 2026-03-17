"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";
import { Table, THead, TH, TD, TR } from "@/components/ui/Table";
import { formatIST } from "@/lib/utils/dates";

interface TrailEntry {
  id: string;
  employee_id: string;
  action_type: string;
  entity_type: string;
  entity_id: string;
  field_changed: string | null;
  old_value: string | null;
  new_value: string | null;
  created_at: string;
  employees: { full_name: string; role: string } | null;
}

const actionTypes = ["create", "update", "submit", "approve", "rework", "reject", "login", "upload", "import"];
const entityTypes = ["audit", "audit_item", "evidence", "store", "employee", "checklist_item"];

export default function AuditTrailPage() {
  const [entries, setEntries] = useState<TrailEntry[]>([]);
  const [page, setPage] = useState(0);
  const [actionFilter, setActionFilter] = useState("");
  const [entityFilter, setEntityFilter] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, [page, actionFilter, entityFilter]);

  async function fetchData() {
    setLoading(true);
    const supabase = createClient();
    let query = supabase
      .from("audit_trail")
      .select("*, employees(full_name, role)")
      .order("created_at", { ascending: false })
      .range(page * 50, (page + 1) * 50 - 1);

    if (actionFilter) query = query.eq("action_type", actionFilter);
    if (entityFilter) query = query.eq("entity_type", entityFilter);

    const { data } = await query;
    if (data) setEntries(data as unknown as TrailEntry[]);
    setLoading(false);
  }

  function escapeCSV(value: string): string {
    return '"' + value.replace(/"/g, '""') + '"';
  }

  function exportCSV() {
    const headers = ["Timestamp", "Employee", "Action", "Entity", "Entity ID", "Field", "Old", "New"];
    const csv = [headers.map(escapeCSV).join(","), ...entries.map((e) => [
      e.created_at, (e.employees as unknown as { full_name: string })?.full_name || "", e.action_type, e.entity_type, e.entity_id, e.field_changed || "", e.old_value || "", e.new_value || "",
    ].map(escapeCSV).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "audit_trail.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) return <div className="flex h-screen items-center justify-center"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-page-title text-gray-900">Audit Trail</h1>
        <Button variant="secondary" onClick={exportCSV}>Export to CSV</Button>
      </div>
      <div className="flex gap-3">
        <select value={actionFilter} onChange={(e) => { setActionFilter(e.target.value); setPage(0); }} className="h-11 rounded-lg border border-gray-200 px-3 text-sm">
          <option value="">All actions</option>
          {actionTypes.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={entityFilter} onChange={(e) => { setEntityFilter(e.target.value); setPage(0); }} className="h-11 rounded-lg border border-gray-200 px-3 text-sm">
          <option value="">All entities</option>
          {entityTypes.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>
      <Table>
          <THead><tr><TH>Timestamp</TH><TH>Employee</TH><TH>Action</TH><TH>Entity</TH><TH>Field</TH><TH>Old</TH><TH>New</TH></tr></THead>
          <tbody>
            {entries.map((e) => {
              const emp = e.employees as unknown as { full_name: string; role: string } | null;
              return (
                <TR key={e.id}>
                  <TD className="whitespace-nowrap text-xs">{formatIST(e.created_at, "datetime")}</TD>
                  <TD>{emp?.full_name || "—"}</TD>
                  <TD className="capitalize">{e.action_type}</TD>
                  <TD className="capitalize">{e.entity_type}</TD>
                  <TD>{e.field_changed || "—"}</TD>
                  <TD className="max-w-[120px] truncate text-xs">{e.old_value || "—"}</TD>
                  <TD className="max-w-[120px] truncate text-xs">{e.new_value || "—"}</TD>
                </TR>
              );
            })}
          </tbody>
        </Table>
      <div className="flex justify-between">
        <Button variant="secondary" disabled={page === 0} onClick={() => setPage(page - 1)}>Previous</Button>
        <span className="text-sm text-gray-500">Page {page + 1}</span>
        <Button variant="secondary" disabled={entries.length < 50} onClick={() => setPage(page + 1)}>Next</Button>
      </div>
    </div>
  );
}
