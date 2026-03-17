"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useEmployee } from "@/lib/hooks/useEmployee";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import ProgressBar from "@/components/ui/ProgressBar";
import Spinner from "@/components/ui/Spinner";
import { useToast } from "@/components/ui/Toast";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";

interface FlaggedItem {
  id: string;
  nso_item_remarks: string | null;
  nso_item_status: string;
  status: string;
  checklist_items: { sr_no: number; work_type: string; activity: string };
}

export default function ReworkPage() {
  const { id } = useParams<{ id: string }>();
  const { employee } = useEmployee();
  const [audit, setAudit] = useState<{ nso_remarks: string; updated_at: string } | null>(null);
  const [flaggedItems, setFlaggedItems] = useState<FlaggedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const supabase = createClient();
    async function fetchData() {
      const { data: a } = await supabase
        .from("audits")
        .select("nso_remarks, updated_at")
        .eq("id", id)
        .single();
      if (a) setAudit(a);

      const { data: items } = await supabase
        .from("audit_items")
        .select("id, nso_item_remarks, nso_item_status, status, checklist_items(sr_no, work_type, activity)")
        .eq("audit_id", id)
        .eq("nso_item_status", "rework_required");

      if (items) setFlaggedItems(items as unknown as FlaggedItem[]);
      setLoading(false);
    }
    fetchData();
  }, [id]);

  const updatedCount = flaggedItems.filter((i) => i.status === "completed").length;
  const canResubmit = updatedCount === flaggedItems.length;

  async function handleResubmit() {
    setSubmitting(true);
    const supabase = createClient();

    // Fetch current rework_count, then increment
    const { data: currentAudit } = await supabase
      .from("audits")
      .select("rework_count")
      .eq("id", id)
      .single();

    const currentCount = currentAudit?.rework_count ?? 0;

    await supabase
      .from("audits")
      .update({
        status: "resubmitted",
        rework_count: currentCount + 1,
      })
      .eq("id", id);

    // Notify NSO
    const { data: auditData } = await supabase
      .from("audits")
      .select("store_id, stores(assigned_nso_id, store_name)")
      .eq("id", id)
      .single();

    if (auditData) {
      const store = auditData.stores as unknown as { assigned_nso_id: string; store_name: string };
      if (store?.assigned_nso_id) {
        await supabase.from("notifications").insert({
          recipient_id: store.assigned_nso_id,
          type: "resubmission",
          title: "Rework resubmitted",
          body: `${employee?.full_name} has resubmitted the rework for ${store.store_name}`,
          reference_id: id,
          reference_type: "audit",
        });
      }
    }

    toast("success", "Resubmitted for review");
    router.push("/sm/home");
  }

  if (loading) return <div className="flex h-64 items-center justify-center"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-4 p-4">
      {/* Warning banner */}
      <div className="flex items-center gap-2 rounded-lg bg-warning-50 px-4 py-3">
        <ExclamationTriangleIcon className="h-5 w-5 text-warning-700" />
        <span className="text-sm font-medium text-warning-700">
          NSO has requested rework
        </span>
      </div>

      {/* NSO remarks */}
      {audit?.nso_remarks && (
        <Card className="border-warning-700 bg-warning-50">
          <p className="text-sm font-medium text-warning-700">NSO Remarks</p>
          <p className="mt-1 text-sm text-warning-700">{audit.nso_remarks}</p>
        </Card>
      )}

      <h2 className="text-base font-semibold text-gray-900">
        {flaggedItems.length} items need attention
      </h2>

      <ProgressBar
        value={updatedCount}
        max={flaggedItems.length}
        color="bg-brand-500"
      />
      <p className="text-xs text-gray-500">
        {updatedCount} of {flaggedItems.length} items updated
      </p>

      {/* Flagged items */}
      <div className="flex flex-col gap-3">
        {flaggedItems.map((item) => (
          <Card key={item.id}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  #{item.checklist_items.sr_no} · {item.checklist_items.work_type} · {item.checklist_items.activity}
                </p>
                {item.nso_item_remarks && (
                  <p className="mt-1 text-xs text-error-600">{item.nso_item_remarks}</p>
                )}
              </div>
              <Badge variant={item.status === "completed" ? "success" : "error"}>
                {item.status === "completed" ? "Updated" : "Needs update"}
              </Badge>
            </div>
            <Button
              variant="secondary"
              className="mt-3 w-full"
              onClick={() => router.push(`/sm/audit/${id}/item/${item.id}`)}
            >
              Update item
            </Button>
          </Card>
        ))}
      </div>

      <Button
        className="w-full"
        disabled={!canResubmit || submitting}
        onClick={handleResubmit}
      >
        {submitting ? <Spinner size="sm" /> : "Resubmit for review"}
      </Button>
    </div>
  );
}
