import { createClient } from "@/lib/supabase/client";

export async function sendNotification(params: {
  type: string;
  audit_id?: string;
  recipient_id: string;
  title: string;
  body: string;
  reference_id?: string;
  reference_type?: "audit" | "audit_item";
}) {
  const supabase = createClient();
  const { error } = await supabase.from("notifications").insert({
    recipient_id: params.recipient_id,
    type: params.type,
    title: params.title,
    body: params.body,
    reference_id: params.reference_id,
    reference_type: params.reference_type,
  });
  if (error) console.error("Failed to send notification:", error);
}

export async function markAllRead(employeeId: string) {
  const supabase = createClient();
  await supabase
    .from("notifications")
    .update({ read: true })
    .eq("recipient_id", employeeId)
    .eq("read", false);
}
