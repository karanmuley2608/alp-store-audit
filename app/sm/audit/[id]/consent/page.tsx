"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useEmployee } from "@/lib/hooks/useEmployee";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Avatar from "@/components/ui/Avatar";
import Spinner from "@/components/ui/Spinner";
import { useToast } from "@/components/ui/Toast";
import { CheckCircleIcon } from "@heroicons/react/24/outline";

export default function ConsentPage() {
  const { id } = useParams<{ id: string }>();
  const { employee } = useEmployee();
  const [consented, setConsented] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  async function handleStart() {
    if (!consented) {
      setError("Consent is required to proceed");
      return;
    }
    setLoading(true);

    const supabase = createClient();

    // Update audit consent
    await supabase
      .from("audits")
      .update({
        consent_given: true,
        consent_timestamp: new Date().toISOString(),
      })
      .eq("id", id);

    // Check if audit_items already exist for this audit (e.g. user revisited consent page)
    const { count: existingCount } = await supabase
      .from("audit_items")
      .select("*", { count: "exact", head: true })
      .eq("audit_id", id);

    if (!existingCount || existingCount === 0) {
      // Create audit items for all active checklist items
      const { data: checklistItems } = await supabase
        .from("checklist_items")
        .select("id, in_scope_flag")
        .eq("status", "active")
        .order("sr_no");

      if (checklistItems) {
        const auditItems = checklistItems.map((ci) => ({
          audit_id: id,
          checklist_item_id: ci.id,
          in_scope: ci.in_scope_flag,
          status: ci.in_scope_flag ? "pending" : "out_of_scope",
        }));

        const { error: itemsError } = await supabase
          .from("audit_items")
          .insert(auditItems);

        if (itemsError) {
          toast("error", "Failed to create audit items");
          setLoading(false);
          return;
        }
      }
    }

    router.push(`/sm/audit/${id}/checklist`);
  }

  if (!employee) return <div className="flex h-64 items-center justify-center"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-5 p-4">
      {/* Autosave bar */}
      <div className="flex items-center gap-2 rounded-lg bg-success-50 px-3 py-2 text-xs font-medium text-success-600">
        <CheckCircleIcon className="h-4 w-4" />
        Step 1 saved — you can return anytime
      </div>

      {/* Step dots */}
      <div className="flex items-center justify-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full bg-success-600" />
        <span className="h-2.5 w-2.5 rounded-full bg-brand-500" />
      </div>

      {/* Employee card */}
      <Card>
        <div className="flex items-center gap-3">
          <Avatar name={employee.full_name} size="lg" />
          <div>
            <p className="font-semibold text-gray-900">{employee.full_name}</p>
            <p className="text-xs text-gray-500 font-mono">{employee.employee_code}</p>
            <p className="text-xs text-gray-500">{employee.mobile}</p>
          </div>
        </div>
      </Card>

      {/* Consent */}
      <Card>
        <label className="flex gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={consented}
            onChange={(e) => {
              setConsented(e.target.checked);
              if (e.target.checked) setError("");
            }}
            className="mt-0.5 h-5 w-5 rounded border-gray-200 text-brand-500 focus:ring-brand-500"
          />
          <span className="text-sm text-gray-700 leading-relaxed">
            I consent to the collection and processing of my PII — including
            name, employee ID, phone number, selfie, and audit data — for store
            audit compliance and reporting.
          </span>
        </label>
        {error && <p className="mt-2 text-xs text-error-600">{error}</p>}
      </Card>

      <Button
        className="w-full"
        disabled={!consented || loading}
        onClick={handleStart}
      >
        {loading ? <Spinner size="sm" /> : "Start audit"}
      </Button>
    </div>
  );
}
