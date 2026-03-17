import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  let body: { employee_code?: string; mobile?: string };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { employee_code, mobile } = body;

  if (!employee_code || !mobile) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  // Use service role to bypass RLS for login lookup
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const cleanMobile = mobile.replace(/[^0-9]/g, "").slice(-10);

  const { data: employee, error } = await supabase
    .from("employees")
    .select("email")
    .eq("employee_code", employee_code.trim().toUpperCase())
    .eq("mobile", cleanMobile)
    .single();

  if (error || !employee) {
    return NextResponse.json({ error: "Employee not found" }, { status: 404 });
  }

  // Only return the email — role, store_codes, first_login are fetched
  // post-auth via /api/auth/me
  return NextResponse.json({ email: employee.email });
}
