"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import NSOTopbar from "@/components/layout/NSOTopbar";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Tabs from "@/components/ui/Tabs";
import Spinner from "@/components/ui/Spinner";
import RAGIndicator from "@/components/ui/RAGIndicator";
import Button from "@/components/ui/Button";
import { Table, THead, TH, TD, TR } from "@/components/ui/Table";
import { getRAGStatus, getDaysRemaining } from "@/lib/utils/rag";
import { formatIST } from "@/lib/utils/dates";
import { ChevronRightIcon } from "@heroicons/react/24/outline";

interface StoreDetail {
  store_name: string;
  store_code: string;
  city: string;
  state: string;
  target_completion_date: string;
  sm_name: string;
  audit_id: string;
  audit_status: string;
  submitted_at: string;
}

interface AuditItem {
  id: string;
  status: string;
  in_scope: boolean;
  satisfaction_status: string | null;
  nso_item_status: string;
  planned_start_date: string | null;
  actual_start_date: string | null;
  checklist_items: {
    sr_no: number;
    work_type: string;
    activity: string;
    category: string;
  };
}

const categoryColors: Record<string, "success" | "error" | "warning" | "info" | "neutral"> = {
  MEP: "info",
  Interior: "neutral",
  "Wet areas": "warning",
  "Façade": "success",
  Fixtures: "error",
};

export default function StoreDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [store, setStore] = useState<StoreDetail | null>(null);
  const [items, setItems] = useState<AuditItem[]>([]);
  const [tab, setTab] = useState("all");
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    async function fetchData() {
      const { data: s } = await supabase
        .from("stores")
        .select("store_name, store_code, city, state, target_completion_date, assigned_sm_id, employees!stores_assigned_sm_id_fkey(full_name)")
        .eq("id", id)
        .single();

      const { data: audits } = await supabase
        .from("audits")
        .select("id, status, submitted_at")
        .eq("store_id", id)
        .order("created_at", { ascending: false })
        .limit(1);

      const audit = audits?.[0];
      const emp = s?.employees as unknown as { full_name: string } | null;

      if (s) {
        setStore({
          store_name: s.store_name,
          store_code: s.store_code,
          city: s.city,
          state: s.state,
          target_completion_date: s.target_completion_date,
          sm_name: emp?.full_name || "Unassigned",
          audit_id: audit?.id || "",
          audit_status: audit?.status || "no_audit",
          submitted_at: audit?.submitted_at || "",
        });
      }

      if (audit) {
        const { data: itemsData } = await supabase
          .from("audit_items")
          .select("id, status, in_scope, satisfaction_status, nso_item_status, planned_start_date, actual_start_date, checklist_items(sr_no, work_type, activity, category)")
          .eq("audit_id", audit.id)
          .order("checklist_items(sr_no)");

        if (itemsData) setItems(itemsData as unknown as AuditItem[]);
      }
      setLoading(false);
    }
    fetchData();
  }, [id]);

  if (loading || !store) return <div className="flex h-screen items-center justify-center"><Spinner size="lg" /></div>;

  const completed = items.filter((i) => i.status === "completed" || i.status === "out_of_scope").length;
  const satisfied = items.filter((i) => i.satisfaction_status === "satisfied").length;
  const flagged = items.filter((i) => i.nso_item_status === "rework_required").length;
  const pct = items.length > 0 ? Math.round((completed / items.length) * 100) : 0;

  const filtered = items.filter((i) => {
    if (tab === "flagged") return i.nso_item_status === "rework_required";
    if (tab === "out_of_scope") return !i.in_scope;
    return true;
  });

  return (
    <div className="flex flex-col">
      <NSOTopbar title={`${store.store_name} · ${store.store_code}`} />
      <div className="space-y-4 p-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-500">{store.city}, {store.state}</p>
            <p className="text-sm text-gray-500">SM: {store.sm_name}</p>
            {store.submitted_at && <p className="text-xs text-gray-400">Submitted {formatIST(store.submitted_at, "datetime")}</p>}
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={store.audit_status === "approved" ? "success" : store.audit_status === "submitted" || store.audit_status === "resubmitted" ? "warning" : "info"}>
              {store.audit_status.replace(/_/g, " ")}
            </Badge>
            {store.target_completion_date && (
              <>
                <span className="text-xs text-gray-500">{getDaysRemaining(new Date(store.target_completion_date))}d</span>
                <RAGIndicator status={getRAGStatus(new Date(store.target_completion_date), pct)} showLabel />
              </>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="text-center !p-3">
            <p className="text-kpi-std text-success-600">{completed}</p>
            <p className="text-xs text-gray-500">Complete</p>
          </Card>
          <Card className="text-center !p-3">
            <p className="text-kpi-std text-success-600">{satisfied}</p>
            <p className="text-xs text-gray-500">Satisfied</p>
          </Card>
          <Card className="text-center !p-3">
            <p className="text-kpi-std text-error-600">{flagged}</p>
            <p className="text-xs text-gray-500">Flagged</p>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs
          tabs={[
            { label: "All items", value: "all", count: items.length },
            { label: "Flagged", value: "flagged", count: flagged },
            { label: "Out of scope", value: "out_of_scope" },
          ]}
          active={tab}
          onChange={setTab}
        />

        {/* Items table */}
        <Table>
            <THead>
              <tr>
                <TH>#</TH>
                <TH>Work / Activity</TH>
                <TH>Category</TH>
                <TH>Satisfaction</TH>
                <TH>Status</TH>
                <TH></TH>
              </tr>
            </THead>
            <tbody>
              {filtered.map((item) => {
                const ci = item.checklist_items;
                const isDelayed = item.actual_start_date && item.planned_start_date && new Date(item.actual_start_date) > new Date(item.planned_start_date);
                return (
                  <TR
                    key={item.id}
                    onClick={() => router.push(`/nso/store/${id}/item/${item.id}`)}
                    className={item.nso_item_status === "rework_required" ? "bg-error-50" : ""}
                  >
                    <TD className="font-mono">{ci?.sr_no}</TD>
                    <TD>
                      <span className="font-medium">{ci?.work_type}</span> · {ci?.activity}
                    </TD>
                    <TD><Badge variant={categoryColors[ci?.category] || "neutral"}>{ci?.category}</Badge></TD>
                    <TD>
                      {item.satisfaction_status === "satisfied" ? (
                        <span className="h-3 w-3 inline-block rounded-full bg-success-600" />
                      ) : item.satisfaction_status === "not_satisfied" ? (
                        <span className="h-3 w-3 inline-block rounded-full bg-error-600" />
                      ) : (
                        <span className="h-3 w-3 inline-block rounded-full bg-gray-200" />
                      )}
                    </TD>
                    <TD>
                      <Badge variant={item.status === "completed" ? "success" : item.status === "out_of_scope" ? "neutral" : "warning"}>
                        {item.status.replace(/_/g, " ")}
                      </Badge>
                      {isDelayed && <Badge variant="error">Delayed</Badge>}
                    </TD>
                    <TD><ChevronRightIcon className="h-4 w-4 text-gray-400" /></TD>
                  </TR>
                );
              })}
            </tbody>
          </Table>

        {/* Actions */}
        {(store.audit_status === "submitted" || store.audit_status === "resubmitted") && (
          <div className="flex gap-3">
            <Button className="flex-1 !bg-success-600 hover:!bg-success-700" onClick={() => router.push(`/nso/store/${id}/approve`)}>
              Proceed to approval
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
