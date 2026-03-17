import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

const ROLE_HOMES: Record<string, string> = {
  Admin: "/admin/dashboard",
  "NSO Head": "/nso/dashboard",
  SM: "/sm/home",
};

const publicPaths = ["/login", "/change-password", "/api/"];

// Service role client for employee lookups (bypasses RLS)
function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Public paths — skip all guards
  const isPublic = publicPaths.some((p) => pathname.startsWith(p));
  if (isPublic && !user) {
    return supabaseResponse;
  }

  // No session + not public → redirect to login
  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Has session + on login page → redirect to role home
  if (user && pathname.startsWith("/login")) {
    const serviceClient = getServiceClient();
    const { data: employee } = await serviceClient
      .from("employees")
      .select("role")
      .eq("auth_user_id", user.id)
      .single();

    const role = employee?.role || "SM";
    const home = ROLE_HOMES[role] || "/readonly/dashboard";
    const url = request.nextUrl.clone();
    url.pathname = home;
    return NextResponse.redirect(url);
  }

  // Role-based route guarding
  if (user) {
    const isAdmin = pathname.startsWith("/admin");
    const isNSO = pathname.startsWith("/nso");
    const isSM = pathname.startsWith("/sm");

    if (isAdmin || isNSO || isSM) {
      const serviceClient = getServiceClient();
      const { data: employee } = await serviceClient
        .from("employees")
        .select("role")
        .eq("auth_user_id", user.id)
        .single();

      const role = employee?.role;

      if (isAdmin && role !== "Admin") {
        const url = request.nextUrl.clone();
        url.pathname = ROLE_HOMES[role || ""] || "/readonly/dashboard";
        return NextResponse.redirect(url);
      }
      if (isNSO && role !== "NSO Head") {
        const url = request.nextUrl.clone();
        url.pathname = ROLE_HOMES[role || ""] || "/readonly/dashboard";
        return NextResponse.redirect(url);
      }
      if (isSM && role !== "SM") {
        const url = request.nextUrl.clone();
        url.pathname = ROLE_HOMES[role || ""] || "/readonly/dashboard";
        return NextResponse.redirect(url);
      }
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
