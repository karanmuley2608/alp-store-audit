"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useEmployee } from "@/lib/hooks/useEmployee";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Spinner from "@/components/ui/Spinner";
import { useToast } from "@/components/ui/Toast";
import {
  ArrowLeftIcon,
  CameraIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";

interface ChecklistItem {
  sr_no: number;
  work_type: string;
  activity: string;
  category: string;
  what_to_check: string;
  ideal_state: string;
  threshold_good: string;
  threshold_amber: string;
}

interface AuditItemData {
  id: string;
  audit_id: string;
  checklist_item_id: string;
  in_scope: boolean;
  damage_count: number | null;
  satisfaction_status: string | null;
  sm_remarks: string | null;
  planned_start_date: string | null;
  actual_start_date: string | null;
  task_start_date: string | null;
  task_end_date: string | null;
  status: string;
  checklist_items: ChecklistItem;
}

interface Evidence {
  id: string;
  file_url: string;
  file_type: string;
}

export default function ItemDetailPage() {
  const { id, itemId } = useParams<{ id: string; itemId: string }>();
  const { employee } = useEmployee();
  const [item, setItem] = useState<AuditItemData | null>(null);
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [showDates, setShowDates] = useState(false);
  const [inScope, setInScope] = useState(true);
  const [damageCount, setDamageCount] = useState(0);
  const [satisfaction, setSatisfaction] = useState<string | null>(null);
  const [remarks, setRemarks] = useState("");
  const [plannedStart, setPlannedStart] = useState("");
  const [actualStart, setActualStart] = useState("");
  const [taskStart, setTaskStart] = useState("");
  const [taskEnd, setTaskEnd] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const autoSaveRef = useRef<NodeJS.Timeout>();
  const initializedRef = useRef(false);
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

      if (data) {
        const d = data as unknown as AuditItemData;
        setItem(d);
        setInScope(d.in_scope);
        setDamageCount(d.damage_count || 0);
        setSatisfaction(d.satisfaction_status);
        setRemarks(d.sm_remarks || "");
        setPlannedStart(d.planned_start_date || "");
        setActualStart(d.actual_start_date || "");
        setTaskStart(d.task_start_date || "");
        setTaskEnd(d.task_end_date || "");
      }

      const { data: ev } = await supabase
        .from("audit_evidence")
        .select("id, file_url, file_type")
        .eq("audit_item_id", itemId);

      if (ev) setEvidence(ev);
      setLoading(false);
      // Mark as initialized after all state has been hydrated from server
      initializedRef.current = true;
    }
    fetchData();
  }, [itemId]);

  // Auto-save (does NOT update status - status changes only via explicit "Save & next")
  const doAutoSave = useCallback(async () => {
    if (!itemId || !initializedRef.current) return;
    setSaveStatus("saving");
    const supabase = createClient();
    await supabase
      .from("audit_items")
      .update({
        in_scope: inScope,
        damage_count: damageCount,
        satisfaction_status: satisfaction,
        sm_remarks: remarks,
        planned_start_date: plannedStart || null,
        actual_start_date: actualStart || null,
        task_start_date: taskStart || null,
        task_end_date: taskEnd || null,
      })
      .eq("id", itemId);
    setSaveStatus("saved");
  }, [itemId, inScope, damageCount, satisfaction, remarks, plannedStart, actualStart, taskStart, taskEnd]);

  useEffect(() => {
    if (loading || !initializedRef.current) return;
    if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
    autoSaveRef.current = setTimeout(doAutoSave, 1000);
    return () => { if (autoSaveRef.current) clearTimeout(autoSaveRef.current); };
  }, [inScope, damageCount, satisfaction, remarks, plannedStart, actualStart, taskStart, taskEnd, doAutoSave, loading]);

  async function handleFileUpload(files: FileList | null) {
    if (!files || !employee) return;
    const supabase = createClient();

    let successCount = 0;
    for (const file of Array.from(files)) {
      if (file.type.startsWith("video/") && file.size > 100 * 1024 * 1024) {
        toast("warning", "Video too large (max 100MB)");
        continue;
      }

      const filename = `${id}/${itemId}/${Date.now()}-${file.name}`;
      const uploadForm = new FormData();
      uploadForm.append("file", file);
      uploadForm.append("bucket", "evidence");
      uploadForm.append("path", filename);

      const uploadRes = await fetch("/api/upload", { method: "POST", body: uploadForm });
      if (!uploadRes.ok) {
        toast("error", "Upload failed for " + file.name);
        continue;
      }

      const { publicUrl } = await uploadRes.json();

      const { data: ev } = await supabase
        .from("audit_evidence")
        .insert({
          audit_item_id: itemId,
          audit_id: id,
          file_url: publicUrl,
          file_type: file.type.startsWith("video/") ? "video" : "photo",
          file_size_bytes: file.size,
          uploaded_by: employee.id,
        })
        .select()
        .single();

      if (ev) {
        setEvidence((prev) => [...prev, ev]);
        successCount++;
      }
    }
    if (successCount > 0) toast("success", `${successCount} file(s) uploaded`);
  }

  async function handleSaveNext() {
    setSaving(true);
    const supabase = createClient();

    await supabase
      .from("audit_items")
      .update({
        in_scope: inScope,
        damage_count: damageCount,
        satisfaction_status: satisfaction,
        sm_remarks: remarks,
        planned_start_date: plannedStart || null,
        actual_start_date: actualStart || null,
        task_start_date: taskStart || null,
        task_end_date: taskEnd || null,
        status: !inScope ? "out_of_scope" : "completed",
      })
      .eq("id", itemId);

    // Find next pending item
    const { data: allItems } = await supabase
      .from("audit_items")
      .select("id, status, checklist_items(sr_no)")
      .eq("audit_id", id)
      .in("status", ["pending", "in_progress"])
      .order("checklist_items(sr_no)")
      .limit(1);

    if (allItems && allItems.length > 0) {
      router.push(`/sm/audit/${id}/item/${allItems[0].id}`);
    } else {
      router.push(`/sm/audit/${id}/submit`);
    }
  }

  if (loading || !item) return <div className="flex h-64 items-center justify-center"><Spinner size="lg" /></div>;

  const ci = item.checklist_items;
  const hasEvidence = evidence.length > 0;
  const canSave = !inScope || hasEvidence;

  return (
    <div className="space-y-4 p-4">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <button onClick={() => router.push(`/sm/audit/${id}/checklist`)} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900">
          <ArrowLeftIcon className="h-4 w-4" /> Checklist
        </button>
        <span className="text-xs text-gray-400">
          {saveStatus === "saving" ? "Saving..." : saveStatus === "saved" ? "Saved ✓" : ""}
        </span>
      </div>

      <h1 className="text-base font-semibold text-gray-900">
        #{ci.sr_no} · {ci.work_type} · {ci.activity}
      </h1>

      {/* SCOPE */}
      <Card>
        <p className="text-sm font-medium text-gray-500 mb-2">In store scope?</p>
        <div className="flex gap-2">
          <button
            onClick={() => setInScope(true)}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium ${inScope ? "bg-brand-500 text-white" : "border border-gray-200 text-gray-700"}`}
          >
            Yes
          </button>
          <button
            onClick={() => setInScope(false)}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium ${!inScope ? "bg-brand-500 text-white" : "border border-gray-200 text-gray-700"}`}
          >
            No
          </button>
        </div>
        {inScope && (
          <div className="mt-3">
            <label className="text-sm text-gray-500">Damage count</label>
            <input
              type="number"
              min={0}
              value={damageCount}
              onChange={(e) => setDamageCount(parseInt(e.target.value) || 0)}
              className="mt-1 h-11 w-full rounded-lg border border-gray-200 px-3 text-sm text-gray-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>
        )}
      </Card>

      {inScope && (
        <>
          {/* INFO */}
          <Card>
            <p className="text-sm font-medium text-gray-900 mb-1">What to check</p>
            <p className="text-sm text-gray-600">{ci.what_to_check}</p>
            <p className="mt-3 text-sm font-medium text-gray-900 mb-1">Ideal state</p>
            <p className="text-sm text-gray-600">{ci.ideal_state}</p>
          </Card>

          {/* THRESHOLDS */}
          <Card>
            <p className="text-sm font-medium text-gray-900 mb-2">Thresholds</p>
            <div className="flex gap-2">
              <div className="flex-1 rounded-lg bg-success-50 p-3">
                <p className="text-xs font-medium text-success-600">Good</p>
                <p className="mt-1 text-xs text-success-600">{ci.threshold_good}</p>
              </div>
              <div className="flex-1 rounded-lg bg-warning-50 p-3">
                <p className="text-xs font-medium text-warning-700">Amber</p>
                <p className="mt-1 text-xs text-warning-700">{ci.threshold_amber}</p>
              </div>
            </div>
          </Card>

          {/* SATISFACTION */}
          <Card>
            <p className="text-sm font-medium text-gray-500 mb-2">Satisfaction</p>
            <div className="flex gap-2">
              <button
                onClick={() => setSatisfaction("satisfied")}
                className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium ${satisfaction === "satisfied" ? "bg-success-600 text-white" : "border border-gray-200 text-gray-700"}`}
              >
                Satisfied
              </button>
              <button
                onClick={() => setSatisfaction("not_satisfied")}
                className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium ${satisfaction === "not_satisfied" ? "bg-error-600 text-white" : "border border-gray-200 text-gray-700"}`}
              >
                Not satisfied
              </button>
            </div>
          </Card>

          {/* REMARKS */}
          <Card>
            <p className="text-sm font-medium text-gray-500 mb-2">SM Remarks</p>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Add your observation..."
              className="h-20 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </Card>

          {/* EVIDENCE */}
          <div className={`rounded-card border p-4 ${hasEvidence ? "border-success-600 bg-success-50" : "border-error-600 bg-error-50"}`}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-gray-900">Evidence</p>
              <Badge variant={hasEvidence ? "success" : "error"}>
                {hasEvidence ? "Added" : "Not added"}
              </Badge>
            </div>

            {evidence.length > 0 && (
              <div className="mb-3 grid grid-cols-3 gap-2">
                {evidence.map((ev) => (
                  <div key={ev.id} className="relative aspect-square rounded-lg bg-gray-100 overflow-hidden">
                    {ev.file_type === "photo" ? (
                      <img src={ev.file_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-gray-500">Video</div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => fileRef.current?.click()}
              className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 px-4 py-6 text-sm text-gray-500 hover:border-brand-500 hover:text-brand-500"
            >
              <CameraIcon className="h-5 w-5" />
              Tap to photograph or record video
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*,video/*"
              capture="environment"
              multiple
              className="hidden"
              onChange={(e) => handleFileUpload(e.target.files)}
            />
          </div>

          {/* DATES */}
          <Card>
            <button
              onClick={() => setShowDates(!showDates)}
              className="flex w-full items-center justify-between text-sm font-medium text-gray-700"
            >
              Add dates (optional)
              <ChevronDownIcon className={`h-4 w-4 transition-transform ${showDates ? "rotate-180" : ""}`} />
            </button>
            {showDates && (
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500">Planned start</label>
                  <input type="date" value={plannedStart} onChange={(e) => setPlannedStart(e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-gray-200 px-2 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Actual start</label>
                  <input type="date" value={actualStart} onChange={(e) => setActualStart(e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-gray-200 px-2 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Task start</label>
                  <input type="date" value={taskStart} onChange={(e) => setTaskStart(e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-gray-200 px-2 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Task end</label>
                  <input type="date" value={taskEnd} onChange={(e) => setTaskEnd(e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-gray-200 px-2 text-sm" />
                </div>
              </div>
            )}
          </Card>
        </>
      )}

      {/* EVIDENCE GATE HINT */}
      {inScope && (
        <div className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium ${hasEvidence ? "bg-success-50 text-success-600" : "bg-error-50 text-error-600"}`}>
          {hasEvidence ? (
            <><CheckCircleIcon className="h-4 w-4" /> Evidence added — ready to save</>
          ) : (
            <><ExclamationTriangleIcon className="h-4 w-4" /> Add evidence to unlock Save &amp; next</>
          )}
        </div>
      )}

      <Button
        className="w-full"
        disabled={!canSave || saving}
        onClick={handleSaveNext}
      >
        {saving ? <Spinner size="sm" /> : "Save & next item"}
      </Button>
    </div>
  );
}
