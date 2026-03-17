"use client";

import { Fragment, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";
import { useToast } from "@/components/ui/Toast";
import { Table, THead, TH, TD, TR } from "@/components/ui/Table";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/outline";

interface ChecklistItem {
  id: string;
  sr_no: number;
  work_type: string;
  activity: string;
  category: string;
  in_scope_flag: boolean;
  what_to_check: string;
  ideal_state: string;
  threshold_good: string;
  threshold_amber: string;
  status: string;
}

const categoryColors: Record<string, "success" | "error" | "warning" | "info" | "neutral"> = {
  MEP: "info",
  Interior: "neutral",
  "Wet areas": "warning",
  "Façade": "success",
  Fixtures: "error",
};

export default function AdminChecklistPage() {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    const supabase = createClient();
    const { data } = await supabase.from("checklist_items").select("*").order("sr_no");
    if (data) setItems(data);
    setLoading(false);
  }

  async function toggleStatus(item: ChecklistItem) {
    const supabase = createClient();
    const { error } = await supabase.from("checklist_items").update({ status: item.status === "active" ? "inactive" : "active" }).eq("id", item.id);
    if (error) { toast("error", error.message); return; }
    toast("success", `Item ${item.status === "active" ? "deactivated" : "activated"}`);
    fetchData();
  }

  if (loading) return <div className="flex h-screen items-center justify-center"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-page-title text-gray-900">Checklist Items</h1>
        <Button onClick={() => toast("info", "Feature coming soon")}>Add item</Button>
      </div>

      <Card className="!p-0 overflow-hidden">
        <Table>
          <THead>
            <tr>
              <TH>#</TH><TH>Work Type</TH><TH>Activity</TH><TH>Category</TH><TH>Scope</TH><TH>Status</TH><TH></TH>
            </tr>
          </THead>
          <tbody>
            {items.map((item) => (
              <Fragment key={item.id}>
                <TR onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}>
                  <TD className="font-mono">{item.sr_no}</TD>
                  <TD className="font-medium">{item.work_type}</TD>
                  <TD>{item.activity}</TD>
                  <TD><Badge variant={categoryColors[item.category] || "neutral"}>{item.category}</Badge></TD>
                  <TD>{item.in_scope_flag ? "Yes" : "No"}</TD>
                  <TD>
                    <Badge variant={item.status === "active" ? "success" : "error"}>{item.status}</Badge>
                  </TD>
                  <TD>
                    <div className="flex items-center gap-2">
                      <button onClick={(e) => { e.stopPropagation(); toggleStatus(item); }} className="text-xs text-gray-500 hover:underline">
                        {item.status === "active" ? "Deactivate" : "Activate"}
                      </button>
                      {expandedId === item.id ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />}
                    </div>
                  </TD>
                </TR>
                {expandedId === item.id && (
                  <tr>
                    <td colSpan={7} className="bg-gray-50 px-6 py-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="font-medium text-gray-900">What to check</p>
                          <p className="text-gray-600">{item.what_to_check}</p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">Ideal state</p>
                          <p className="text-gray-600">{item.ideal_state}</p>
                        </div>
                        <div>
                          <p className="font-medium text-success-600">Good threshold</p>
                          <p className="text-gray-600">{item.threshold_good}</p>
                        </div>
                        <div>
                          <p className="font-medium text-warning-700">Amber threshold</p>
                          <p className="text-gray-600">{item.threshold_amber}</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </Table>
      </Card>
    </div>
  );
}
