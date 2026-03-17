import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  let body: { access_token?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (!body.access_token) {
    return NextResponse.json({ error: "Missing access_token" }, { status: 400 });
  }

  // Verify the token and get the user
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: { user }, error: authError } = await supabase.auth.getUser(body.access_token);

  if (authError || !user) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  // Lookup employee
  const { data: employee, error } = await supabase
    .from("employees")
    .select("role, first_login, store_codes, full_name")
    .eq("auth_user_id", user.id)
    .single();

  if (error || !employee) {
    return NextResponse.json({ error: "Employee record not found" }, { status: 404 });
  }

  return NextResponse.json({
    role: employee.role,
    first_login: employee.first_login,
    store_codes: employee.store_codes,
    full_name: employee.full_name,
  });
}
