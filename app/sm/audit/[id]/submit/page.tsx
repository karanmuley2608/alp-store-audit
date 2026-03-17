"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useEmployee } from "@/lib/hooks/useEmployee";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";
import { useToast } from "@/components/ui/Toast";

export default function SubmitPage() {
  const { id } = useParams<{ id: string }>();
  const { employee } = useEmployee();
  const [stats, setStats] = useState({ completed: 0, satisfied: 0, notSatisfied: 0, outOfScope: 0, total: 0 });
  const [storeName, setStoreName] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const supabase = createClient();
    async function fetchData() {
      const { data: audit } = await supabase
        .from("audits")
        .select("store_id, stores(store_name)")
        .eq("id", id)
        .single();

      if (audit) {
        const store = audit.stores as unknown as { store_name: string };
        setStoreName(store?.store_name || "");
      }

      const { data: items } = await supabase
        .from("audit_items")
        .select("status, satisfaction_status, in_scope")
        .eq("audit_id", id);

      if (items) {
        setStats({
          total: items.length,
          completed: items.filter((i) => i.status === "completed").length,
          satisfied: items.filter((i) => i.satisfaction_status === "satisfied").length,
          notSatisfied: items.filter((i) => i.satisfaction_status === "not_satisfied").length,
          outOfScope: items.filter((i) => !i.in_scope).length,
        });
      }
      setLoading(false);
    }
    fetchData();
  }, [id]);

  async function handleSubmit() {
    setSubmitting(true);
    const supabase = createClient();

    await supabase
      .from("audits")
      .update({ status: "submitted", submitted_at: new Date().toISOString() })
      .eq("id", id);

    // Get NSO for notification
    const { data: audit } = await supabase
      .from("audits")
      .select("store_id, stores(assigned_nso_id, store_name)")
      .eq("id", id)
      .single();

    if (audit) {
      const store = audit.stores as unknown as { assigned_nso_id: string; store_name: string };
      if (store?.assigned_nso_id) {
        await supabase.from("notifications").insert({
          recipient_id: store.assigned_nso_id,
          type: "audit_submitted",
          title: "New audit submitted",
          body: `${employee?.full_name} submitted the audit for ${store.store_name}`,
          reference_id: id,
          reference_type: "audit",
        });
      }
    }

    toast("success", "Audit submitted for NSO review");
    router.push("/sm/home");
  }

  if (loading) return <div className="flex h-64 items-center justify-center"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-5 p-4">
      <div className="flex flex-col items-center">
        <div className="flex h-28 w-28 items-center justify-center rounded-full bg-success-50">
          <span className="text-kpi-hero text-success-600">100%</span>
        </div>
        <h1 className="mt-4 text-page-title text-gray-900">All items complete</h1>
        <p className="text-sm text-gray-500">{storeName}</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card className="text-center !p-3">
          <p className="text-kpi-std text-success-600">{stats.completed}</p>
          <p className="text-xs text-gray-500">Complete</p>
        </Card>
        <Card className="text-center !p-3">
          <p className="text-kpi-std text-success-600">{stats.satisfied}</p>
          <p className="text-xs text-gray-500">Satisfied</p>
        </Card>
        <Card className="text-center !p-3">
          <p className="text-kpi-std text-error-600">{stats.notSatisfied}</p>
          <p className="text-xs text-gray-500">Not satisfied</p>
        </Card>
      </div>

      {stats.outOfScope > 0 && (
        <p className="text-center text-xs text-gray-500">
          {stats.outOfScope} items marked out of scope
        </p>
      )}

      {stats.notSatisfied > 0 && (
        <Card className="border-error-600 bg-error-50">
          <p className="text-sm font-medium text-error-600">
            {stats.notSatisfied} items marked as not satisfied
          </p>
          <p className="text-xs text-error-600 mt-1">
            NSO will see these flagged for review.
          </p>
        </Card>
      )}

      <div className="flex flex-col gap-3">
        <Button
          className="w-full !bg-success-600 hover:!bg-success-700"
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? <Spinner size="sm" /> : "Submit for NSO review"}
        </Button>
        <Button
          variant="ghost"
          className="w-full"
          onClick={() => router.push(`/sm/audit/${id}/checklist`)}
        >
          Review checklist first
        </Button>
      </div>
    </div>
  );
}
