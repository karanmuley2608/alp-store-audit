"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useEmployee } from "@/lib/hooks/useEmployee";
import NSOTopbar from "@/components/layout/NSOTopbar";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";
import { useToast } from "@/components/ui/Toast";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

interface ItemDetail {
  id: string;
  audit_id: string;
  in_scope: boolean;
  damage_count: number | null;
  satisfaction_status: string | null;
  sm_remarks: string | null;
  planned_start_date: string | null;
  actual_start_date: string | null;
  task_start_date: string | null;
  task_end_date: string | null;
  status: string;
  nso_item_status: string;
  nso_item_remarks: string | null;
  checklist_items: {
    sr_no: number;
    work_type: string;
    activity: string;
    category: string;
    what_to_check: string;
    ideal_state: string;
  };
}

interface Evidence {
  id: string;
  file_url: string;
  file_type: string;
}

export default function NSOItemDetailPage() {
  const params = useParams<{ id: string; itemId: string }>();
  const itemId = params.itemId;
  const { employee } = useEmployee();
  const [item, setItem] = useState<ItemDetail | null>(null);
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [comment, setComment] = useState("");
  const [reworkRemark, setReworkRemark] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const supabase = createClient();
    async function fetchData() {
      const { data } = await supabase
        .from("audit_items")
        .select("*, checklist_items(*)")
        .eq("id", itemId)
        .single();
      if (data) setItem(data as unknown as ItemDetail);

      const { data: ev } = await supabase
        .from("audit_evidence")
        .select("id, file_url, file_type")
        .eq("audit_item_id", itemId);
      if (ev) setEvidence(ev);
      setLoading(false);
    }
    fetchData();
  }, [itemId]);

  async function handleSendComment() {
    if (!comment.trim() || !employee || !item) return;
    setSubmitting(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from("conversations").insert({
        audit_id: item.audit_id,
        audit_item_id: itemId,
        sender_id: employee.id,
        message: comment,
      });
      if (error) {
        toast("error", "Failed to send comment: " + error.message);
        return;
      }
      toast("success", "Comment sent");
      setComment("");
    } catch {
      toast("error", "An unexpected error occurred");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAccept() {
    setSubmitting(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from("audit_items").update({ nso_item_status: "accepted" }).eq("id", itemId);
      if (error) {
        toast("error", "Failed to accept item: " + error.message);
        return;
      }
      toast("success", "Item accepted");
      router.back();
    } catch {
      toast("error", "An unexpected error occurred");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleFlag() {
    if (!reworkRemark.trim()) { toast("error", "Add a remark for rework"); return; }
    setSubmitting(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from("audit_items").update({ nso_item_status: "rework_required", nso_item_remarks: reworkRemark }).eq("id", itemId);
      if (error) {
        toast("error", "Failed to flag item: " + error.message);
        return;
      }
      toast("warning", "Item flagged for rework");
      router.back();
    } catch {
      toast("error", "An unexpected error occurred");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading || !item) return <div className="flex h-screen items-center justify-center"><Spinner size="lg" /></div>;

  const ci = item.checklist_items;
  const isDelayed = item.actual_start_date && item.planned_start_date && new Date(item.actual_start_date) > new Date(item.planned_start_date);
  const delayDays = isDelayed ? Math.ceil((new Date(item.actual_start_date!).getTime() - new Date(item.planned_start_date!).getTime()) / 86400000) : 0;

  return (
    <div className="flex flex-col">
      <NSOTopbar title={`#${ci.sr_no} · ${ci.work_type} · ${ci.activity}`} />
      <div className="space-y-4 p-6">
        <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900">
          <ArrowLeftIcon className="h-4 w-4" /> Back to store
        </button>

        {/* Status row */}
        <div className="flex gap-4">
          <Badge variant={item.in_scope ? "info" : "neutral"}>{item.in_scope ? "In scope" : "Out of scope"}</Badge>
          {item.damage_count !== null && <Badge variant="neutral">Damage: {item.damage_count}</Badge>}
          {item.satisfaction_status && (
            <Badge variant={item.satisfaction_status === "satisfied" ? "success" : "error"}>
              {item.satisfaction_status}
            </Badge>
          )}
          <Badge variant={item.status === "completed" ? "success" : "warning"}>{item.status.replace(/_/g, " ")}</Badge>
        </div>

        {/* Dates */}
        <Card>
          <h3 className="text-sm font-medium text-gray-900 mb-2">Dates</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-gray-500">Planned start:</span> <span className="text-gray-900">{item.planned_start_date || "—"}</span></div>
            <div><span className="text-gray-500">Actual start:</span> <span className="text-gray-900">{item.actual_start_date || "—"}</span></div>
            <div><span className="text-gray-500">Task start:</span> <span className="text-gray-900">{item.task_start_date || "—"}</span></div>
            <div><span className="text-gray-500">Task end:</span> <span className="text-gray-900">{item.task_end_date || "—"}</span></div>
          </div>
          {isDelayed && (
            <div className="mt-2 rounded-lg bg-warning-50 px-3 py-2 text-xs font-medium text-warning-700">
              {delayDays} days delay detected
            </div>
          )}
        </Card>

        {/* SM Remarks */}
        {item.sm_remarks && (
          <Card>
            <h3 className="text-sm font-medium text-gray-900 mb-1">SM Remarks</h3>
            <p className="text-sm text-gray-600">{item.sm_remarks}</p>
          </Card>
        )}

        {/* Evidence */}
        <Card>
          <h3 className="text-sm font-medium text-gray-900 mb-2">Evidence ({evidence.length})</h3>
          {evidence.length === 0 ? (
            <p className="text-sm text-gray-400">No evidence uploaded</p>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              {evidence.map((ev) => (
                <div key={ev.id} className="relative aspect-square rounded-lg bg-gray-100 overflow-hidden">
                  {ev.file_type === "photo" ? (
                    <img src={ev.file_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-gray-500">
                      <span className="rounded bg-gray-200 px-2 py-1">Video</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* NSO Comment */}
        <Card>
          <h3 className="text-sm font-medium text-gray-900 mb-2">NSO Comment</h3>
          <div className="flex gap-2">
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add a comment..."
              className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm placeholder:text-gray-400 focus:border-brand-500 focus:outline-none"
              rows={2}
            />
            <Button onClick={handleSendComment} disabled={!comment.trim() || submitting}>Send</Button>
          </div>
        </Card>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            className="flex-1 !bg-success-600 hover:!bg-success-700"
            onClick={handleAccept}
            disabled={submitting}
          >
            Accept this item
          </Button>
          <div className="flex-1 space-y-2">
            <textarea
              value={reworkRemark}
              onChange={(e) => setReworkRemark(e.target.value)}
              placeholder="Rework remark..."
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm placeholder:text-gray-400 focus:border-brand-500 focus:outline-none"
              rows={1}
            />
            <Button variant="danger" className="w-full" onClick={handleFlag} disabled={submitting}>
              Flag for rework
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
