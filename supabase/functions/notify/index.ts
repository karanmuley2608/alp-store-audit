import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { type, audit_id, recipient_id, metadata } = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Insert notification
    await supabase.from("notifications").insert({
      recipient_id,
      type,
      title: metadata?.title || type.replace(/_/g, " "),
      body: metadata?.body || "",
      reference_id: audit_id,
      reference_type: "audit",
    });

    // Email content (stub or real via Resend)
    const emailTemplates: Record<string, string> = {
      audit_submitted: `New audit submitted for ${metadata?.storeName} by ${metadata?.smName}`,
      audit_approved: `Your audit for ${metadata?.storeName} has been approved`,
      rework_required: `Rework requested for ${metadata?.count || 0} items in ${metadata?.storeName}`,
      audit_rejected: `Your audit for ${metadata?.storeName} has been rejected`,
      resubmission: `${metadata?.smName} has resubmitted the rework for ${metadata?.storeName}`,
      deadline_warning: `${metadata?.storeName} has ${metadata?.days} days remaining, ${metadata?.pct}% complete`,
      overdue: `${metadata?.storeName} is overdue. Target was ${metadata?.targetDate}`,
    };

    const emailBody = emailTemplates[type] || `Notification: ${type}`;
    console.log(`📧 Email (${type}): ${emailBody}`);

    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (resendKey && resendKey !== "stub") {
      // Get recipient email
      const { data: emp } = await supabase
        .from("employees")
        .select("email, full_name")
        .eq("id", recipient_id)
        .single();

      if (emp) {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "ALP Store Audit <noreply@alp-audit.com>",
            to: emp.email,
            subject: metadata?.title || type.replace(/_/g, " "),
            text: emailBody,
          }),
        });
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
