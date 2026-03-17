"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useEmployee } from "@/lib/hooks/useEmployee";
import NSOTopbar from "@/components/layout/NSOTopbar";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";
import { useToast } from "@/components/ui/Toast";
import { CheckCircleIcon, ArrowPathIcon, XCircleIcon } from "@heroicons/react/24/outline";

type Decision = "approve" | "rework" | "reject" | null;

export default function ApprovePage() {
  const { id } = useParams<{ id: string }>();
  const { employee } = useEmployee();
  const [decision, setDecision] = useState<Decision>(null);
  const [remarks, setRemarks] = useState("");
  const [auditId, setAuditId] = useState("");
  const [auditStatus, setAuditStatus] = useState("");
  const [smId, setSmId] = useState("");
  const [stats, setStats] = useState({ completed: 0, satisfied: 0, notSatisfied: 0, flagged: 0, delays: 0 });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const supabase = createClient();
    async function fetchData() {
      const { data: audits } = await supabase
        .from("audits")
        .select("id, sm_id, status")
        .eq("store_id", id)
        .order("created_at", { ascending: false })
        .limit(1);

      if (!audits?.length) { setLoading(false); return; }
      setAuditId(audits[0].id);
      setSmId(audits[0].sm_id);
      setAuditStatus(audits[0].status);

      const { data: items } = await supabase
        .from("audit_items")
        .select("status, satisfaction_status, nso_item_status, planned_start_date, actual_start_date")
        .eq("audit_id", audits[0].id);

      if (items) {
        setStats({
          completed: items.filter((i) => i.status === "completed").length,
          satisfied: items.filter((i) => i.satisfaction_status === "satisfied").length,
          notSatisfied: items.filter((i) => i.satisfaction_status === "not_satisfied").length,
          flagged: items.filter((i) => i.nso_item_status === "rework_required").length,
          delays: items.filter((i) => i.actual_start_date && i.planned_start_date && new Date(i.actual_start_date) > new Date(i.planned_start_date)).length,
        });
      }
      setLoading(false);
    }
    fetchData();
  }, [id]);

  const isApprovable = auditStatus === "submitted" || auditStatus === "resubmitted";

  async function handleConfirm() {
    if (!decision || remarks.length < 10 || !employee) return;
    setSubmitting(true);
    try {
      const supabase = createClient();

      const updates: Record<string, unknown> = {
        nso_decision: decision,
        nso_remarks: remarks,
      };

      if (decision === "approve") {
        updates.status = "approved";
        updates.approved_at = new Date().toISOString();
        updates.approved_by = employee.id;
      } else if (decision === "rework") {
        updates.status = "rework_required";
      } else {
        updates.status = "rejected";
      }

      const { error } = await supabase.from("audits").update(updates).eq("id", auditId);
      if (error) {
        toast("error", "Failed to update audit: " + error.message);
        return;
      }

      // Notify SM
      const typeMap: Record<string, string> = { approve: "audit_approved", rework: "rework_required", reject: "audit_rejected" };
      const { error: notifError } = await supabase.from("notifications").insert({
        recipient_id: smId,
        type: typeMap[decision],
        title: decision === "approve" ? "Audit approved" : decision === "rework" ? "Rework requested" : "Audit rejected",
        body: remarks,
        reference_id: auditId,
        reference_type: "audit",
      });
      if (notifError) {
        toast("error", "Decision saved but notification failed: " + notifError.message);
      }

      toast("success", `Audit ${decision === "approve" ? "approved" : decision === "rework" ? "sent for rework" : "rejected"}`);
      router.push("/nso/stores");
    } catch {
      toast("error", "An unexpected error occurred");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="flex h-screen items-center justify-center"><Spinner size="lg" /></div>;

  const options = [
    {
      key: "approve" as Decision,
      icon: CheckCircleIcon,
      title: "Approve",
      desc: "SM will be notified the audit is approved. A completion report will be generated.",
      bgActive: "bg-success-50 border-success-600",
      bgIdle: "bg-white border-gray-200",
    },
    {
      key: "rework" as Decision,
      icon: ArrowPathIcon,
      title: "Send for rework",
      desc: "SM will need to update flagged items and resubmit for another review.",
      bgActive: "bg-warning-50 border-warning-700",
      bgIdle: "bg-white border-gray-200",
    },
    {
      key: "reject" as Decision,
      icon: XCircleIcon,
      title: "Reject",
      desc: "Audit is rejected. SM will be notified. No further action possible on this audit.",
      bgActive: "bg-error-50 border-error-600",
      bgIdle: "bg-white border-gray-200",
    },
  ];

  return (
    <div className="flex flex-col">
      <NSOTopbar title="Approval Decision" />
      <div className="mx-auto max-w-2xl space-y-6 p-6">
        {!isApprovable && (
          <div className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-600">
            This audit cannot be approved. Current status is <strong>{auditStatus.replace(/_/g, " ")}</strong>. Only audits with status &quot;submitted&quot; or &quot;resubmitted&quot; can be reviewed.
          </div>
        )}

        {/* Summary */}
        <Card>
          <div className="flex gap-6 text-center">
            <div className="flex-1"><p className="text-kpi-std text-gray-900">{stats.completed}</p><p className="text-xs text-gray-500">Completed</p></div>
            <div className="flex-1"><p className="text-kpi-std text-success-600">{stats.satisfied}</p><p className="text-xs text-gray-500">Satisfied</p></div>
            <div className="flex-1"><p className="text-kpi-std text-error-600">{stats.notSatisfied}</p><p className="text-xs text-gray-500">Not satisfied</p></div>
            <div className="flex-1"><p className="text-kpi-std text-error-600">{stats.flagged}</p><p className="text-xs text-gray-500">Flagged</p></div>
            <div className="flex-1"><p className="text-kpi-std text-warning-700">{stats.delays}</p><p className="text-xs text-gray-500">Delays</p></div>
          </div>
        </Card>

        {/* Decision cards */}
        <div className="flex flex-col gap-3">
          {options.map((opt) => (
            <button
              key={opt.key}
              onClick={() => setDecision(opt.key)}
              disabled={!isApprovable}
              className={`flex items-start gap-4 rounded-card border-2 p-5 text-left transition-colors ${decision === opt.key ? opt.bgActive : opt.bgIdle} ${!isApprovable ? "cursor-not-allowed opacity-50" : ""}`}
            >
              <opt.icon className="mt-0.5 h-6 w-6 shrink-0" />
              <div>
                <p className="text-base font-semibold text-gray-900">{opt.title}</p>
                <p className="mt-0.5 text-sm text-gray-500">{opt.desc}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Remarks */}
        <div>
          <label className="text-sm text-gray-500">
            Remarks for store manager (required)
          </label>
          <textarea
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Add your remarks (min 10 characters)..."
            disabled={!isApprovable}
            className="mt-1 h-24 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:cursor-not-allowed disabled:opacity-50"
          />
          <p className="mt-1 text-right text-xs text-gray-400">{remarks.length} characters</p>
        </div>

        <Button
          className="w-full"
          disabled={!isApprovable || !decision || remarks.length < 10 || submitting}
          onClick={handleConfirm}
        >
          {submitting ? <Spinner size="sm" /> : "Confirm decision"}
        </Button>
      </div>
    </div>
  );
}
