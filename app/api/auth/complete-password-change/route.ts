import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST() {
  const cookieStore = cookies();

  // Build an SSR client to read the session from cookies
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {
          // read-only — no need to set cookies here
        },
      },
    }
  );

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Use service role to bypass RLS
  const serviceClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { error: updateError } = await serviceClient
    .from("employees")
    .update({ first_login: false })
    .eq("auth_user_id", user.id);

  if (updateError) {
    return NextResponse.json(
      { error: "Failed to update employee record" },
      { status: 500 }
    );
  }

  const { data: employee, error: fetchError } = await serviceClient
    .from("employees")
    .select("role")
    .eq("auth_user_id", user.id)
    .single();

  if (fetchError || !employee) {
    return NextResponse.json(
      { error: "Failed to fetch employee role" },
      { status: 500 }
    );
  }

  return NextResponse.json({ role: employee.role });
}
