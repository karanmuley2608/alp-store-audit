"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Spinner from "@/components/ui/Spinner";
import { Table, THead, TH, TD, TR } from "@/components/ui/Table";
import { formatIST } from "@/lib/utils/dates";

interface ReportData {
  storeName: string;
  storeCode: string;
  city: string;
  state: string;
  storeType: string;
  smName: string;
  smCode: string;
  nsoName: string;
  targetDate: string;
  approvedAt: string;
  reworkCount: number;
  nsoRemarks: string;
  items: {
    sr_no: number;
    work_type: string;
    activity: string;
    in_scope: boolean;
    satisfaction_status: string | null;
    planned_start_date: string | null;
    actual_start_date: string | null;
    sm_remarks: string | null;
    evidenceCount: number;
  }[];
  total: number;
  completed: number;
  satisfiedPct: number;
  outOfScope: number;
}

export default function ReportPage() {
  const { auditId } = useParams<{ auditId: string }>();
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    async function fetchData() {
      const { data: audit } = await supabase
        .from("audits")
        .select("*, stores(store_name, store_code, city, state, store_type, target_completion_date, assigned_nso_id), employees!audits_sm_id_fkey(full_name, employee_code)")
        .eq("id", auditId)
        .single();

      if (!audit) { setLoading(false); return; }

      const store = audit.stores as unknown as { store_name: string; store_code: string; city: string; state: string; store_type: string; target_completion_date: string; assigned_nso_id: string };
      const sm = audit.employees as unknown as { full_name: string; employee_code: string };

      let nsoName = "—";
      if (store?.assigned_nso_id) {
        const { data: nso } = await supabase.from("employees").select("full_name").eq("id", store.assigned_nso_id).single();
        if (nso) nsoName = nso.full_name;
      }

      const { data: items } = await supabase
        .from("audit_items")
        .select("in_scope, satisfaction_status, planned_start_date, actual_start_date, sm_remarks, status, checklist_items(sr_no, work_type, activity)")
        .eq("audit_id", auditId)
        .order("checklist_items(sr_no)");

      const enrichedItems = await Promise.all(
        (items || []).map(async (i) => {
          const { count } = await supabase.from("audit_evidence").select("*", { count: "exact", head: true }).eq("audit_item_id", (i as unknown as { id: string }).id || "");
          const ci = (i as unknown as { checklist_items: { sr_no: number; work_type: string; activity: string } }).checklist_items;
          return {
            sr_no: ci?.sr_no || 0,
            work_type: ci?.work_type || "",
            activity: ci?.activity || "",
            in_scope: i.in_scope,
            satisfaction_status: i.satisfaction_status,
            planned_start_date: i.planned_start_date,
            actual_start_date: i.actual_start_date,
            sm_remarks: i.sm_remarks,
            evidenceCount: count || 0,
          };
        })
      );

      const total = enrichedItems.length;
      const completed = enrichedItems.filter((i) => i.in_scope).length;
      const satisfied = enrichedItems.filter((i) => i.satisfaction_status === "satisfied").length;
      const outOfScope = enrichedItems.filter((i) => !i.in_scope).length;

      setReport({
        storeName: store?.store_name || "",
        storeCode: store?.store_code || "",
        city: store?.city || "",
        state: store?.state || "",
        storeType: store?.store_type || "",
        smName: sm?.full_name || "",
        smCode: sm?.employee_code || "",
        nsoName,
        targetDate: store?.target_completion_date || "",
        approvedAt: audit.approved_at || "",
        reworkCount: audit.rework_count || 0,
        nsoRemarks: audit.nso_remarks || "",
        items: enrichedItems,
        total,
        completed,
        satisfiedPct: completed > 0 ? Math.round((satisfied / completed) * 100) : 0,
        outOfScope,
      });
      setLoading(false);
    }
    fetchData();
  }, [auditId]);

  if (loading || !report) return <div className="flex h-screen items-center justify-center"><Spinner size="lg" /></div>;

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-8 print:p-4">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-kpi-hero text-gray-900">ALP Store Audit</h1>
        <p className="text-base text-gray-500">Store Renovation Completion Report</p>
      </div>

      {/* Store details */}
      <Card>
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2 text-sm">
            <p><span className="text-gray-500">Store:</span> <span className="font-medium">{report.storeName} ({report.storeCode})</span></p>
            <p><span className="text-gray-500">City / State:</span> {report.city}, {report.state}</p>
            <p><span className="text-gray-500">Type:</span> {report.storeType}</p>
          </div>
          <div className="space-y-2 text-sm">
            <p><span className="text-gray-500">SM:</span> {report.smName} ({report.smCode})</p>
            <p><span className="text-gray-500">NSO:</span> {report.nsoName}</p>
            <p><span className="text-gray-500">Target:</span> {report.targetDate}</p>
            <p><span className="text-gray-500">Rework rounds:</span> {report.reworkCount}</p>
          </div>
        </div>
      </Card>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="text-center"><p className="text-kpi-std">{report.total}</p><p className="text-xs text-gray-500">Total</p></Card>
        <Card className="text-center"><p className="text-kpi-std text-success-600">{report.completed}</p><p className="text-xs text-gray-500">Completed</p></Card>
        <Card className="text-center"><p className="text-kpi-std text-success-600">{report.satisfiedPct}%</p><p className="text-xs text-gray-500">Satisfied</p></Card>
        <Card className="text-center"><p className="text-kpi-std text-gray-500">{report.outOfScope}</p><p className="text-xs text-gray-500">Out of scope</p></Card>
      </div>

      {/* NSO Remarks */}
      {report.nsoRemarks && (
        <Card className="border-brand-500 bg-brand-50">
          <p className="text-sm font-medium text-brand-500">NSO Approval Remarks</p>
          <p className="mt-1 text-sm text-gray-700">{report.nsoRemarks}</p>
        </Card>
      )}

      {/* Items table */}
      <Table>
          <THead>
            <tr>
              <TH>#</TH><TH>Work Type</TH><TH>Activity</TH><TH>Scope</TH><TH>Satisfaction</TH><TH>Planned</TH><TH>Actual</TH><TH>Evidence</TH><TH>SM Remarks</TH>
            </tr>
          </THead>
          <tbody>
            {report.items.map((item) => (
              <TR key={item.sr_no}>
                <TD className="font-mono">{item.sr_no}</TD>
                <TD>{item.work_type}</TD>
                <TD>{item.activity}</TD>
                <TD>{item.in_scope ? "✓" : "✗"}</TD>
                <TD>
                  {item.satisfaction_status === "satisfied" ? (
                    <Badge variant="success">✓</Badge>
                  ) : item.satisfaction_status === "not_satisfied" ? (
                    <Badge variant="error">✗</Badge>
                  ) : "—"}
                </TD>
                <TD className="text-xs">{item.planned_start_date || "—"}</TD>
                <TD className="text-xs">{item.actual_start_date || "—"}</TD>
                <TD>{item.evidenceCount}</TD>
                <TD className="max-w-[150px] truncate text-xs">{item.sm_remarks || "—"}</TD>
              </TR>
            ))}
          </tbody>
        </Table>

      {/* Footer */}
      <div className="text-center text-xs text-gray-400">
        Generated by ALP Store Audit · {formatIST(new Date().toISOString(), "date")}
        {report.approvedAt && ` · Approved by ${report.nsoName} on ${formatIST(report.approvedAt, "date")}`}
      </div>

      {/* Download button */}
      <div className="flex justify-center print:hidden">
        <Button onClick={() => window.print()}>Download PDF</Button>
      </div>
    </div>
  );
}
