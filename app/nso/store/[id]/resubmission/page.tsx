"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import NSOTopbar from "@/components/layout/NSOTopbar";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";
import { useToast } from "@/components/ui/Toast";

interface ReworkedItem {
  id: string;
  sm_remarks: string | null;
  nso_item_remarks: string | null;
  nso_item_status: string;
  checklist_items: { sr_no: number; work_type: string; activity: string };
}

export default function ResubmissionPage() {
  const { id } = useParams<{ id: string }>();
  const [items, setItems] = useState<ReworkedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const supabase = createClient();
    async function fetchData() {
      const { data: audits } = await supabase
        .from("audits")
        .select("id")
        .eq("store_id", id)
        .order("created_at", { ascending: false })
        .limit(1);

      if (!audits?.length) { setLoading(false); return; }

      const { data } = await supabase
        .from("audit_items")
        .select("id, sm_remarks, nso_item_remarks, nso_item_status, checklist_items(sr_no, work_type, activity)")
        .eq("audit_id", audits[0].id)
        .eq("nso_item_status", "rework_required");

      if (data) setItems(data as unknown as ReworkedItem[]);
      setLoading(false);
    }
    fetchData();
  }, [id]);

  async function handleAcceptItem(itemId: string) {
    const supabase = createClient();
    await supabase.from("audit_items").update({ nso_item_status: "accepted" }).eq("id", itemId);
    setItems((prev) => prev.map((i) => i.id === itemId ? { ...i, nso_item_status: "accepted" } : i));
    toast("success", "Item accepted");
  }

  if (loading) return <div className="flex h-screen items-center justify-center"><Spinner size="lg" /></div>;

  return (
    <div className="flex flex-col">
      <NSOTopbar title={`Resubmission review — ${items.length} items`} />
      <div className="space-y-4 p-6">
        {items.map((item) => (
          <Card key={item.id}>
            <div className="flex items-start justify-between">
              <p className="font-semibold text-gray-900">
                #{item.checklist_items.sr_no} · {item.checklist_items.work_type} · {item.checklist_items.activity}
              </p>
              <Badge variant={item.nso_item_status === "accepted" ? "success" : "warning"}>
                {item.nso_item_status.replace(/_/g, " ")}
              </Badge>
            </div>

            {item.nso_item_remarks && (
              <div className="mt-2 rounded-lg bg-warning-50 px-3 py-2 text-xs text-warning-700">
                NSO comment: {item.nso_item_remarks}
              </div>
            )}

            {item.sm_remarks && (
              <div className="mt-2 rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-700">
                SM remarks: {item.sm_remarks}
              </div>
            )}

            {item.nso_item_status !== "accepted" && (
              <div className="mt-3 flex gap-2">
                <Button className="flex-1 !bg-success-600 hover:!bg-success-700" onClick={() => handleAcceptItem(item.id)}>Accept</Button>
                <Button variant="danger" className="flex-1" onClick={() => router.push(`/nso/store/${id}/item/${item.id}`)}>
                  Review details
                </Button>
              </div>
            )}
          </Card>
        ))}

        <Button
          className="w-full"
          disabled={items.some((i) => i.nso_item_status === "rework_required")}
          onClick={() => router.push(`/nso/store/${id}/approve`)}
        >
          {items.some((i) => i.nso_item_status === "rework_required")
            ? `Review all items before proceeding (${items.filter((i) => i.nso_item_status === "rework_required").length} remaining)`
            : "Proceed to final decision"}
        </Button>
      </div>
    </div>
  );
}
