"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import Spinner from "@/components/ui/Spinner";
import { useToast } from "@/components/ui/Toast";
import { BuildingStorefrontIcon } from "@heroicons/react/24/outline";

const ROLE_HOMES: Record<string, string> = {
  Admin: "/admin/dashboard",
  "NSO Head": "/nso/dashboard",
  SM: "/sm/home",
};

export default function LoginPage() {
  const [employeeId, setEmployeeId] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [storeSelector, setStoreSelector] = useState(false);
  const [storeCodes, setStoreCodes] = useState<string[]>([]);
  const router = useRouter();
  const { toast } = useToast();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const lookupRes = await fetch("/api/auth/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employee_code: employeeId.trim(), mobile }),
      });

      if (!lookupRes.ok) {
        setError("Employee not found");
        return;
      }

      const { email } = await lookupRes.json();

      const supabase = createClient();
      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({ email, password });

      if (authError || !authData.session) {
        setError("Invalid password");
        return;
      }

      const meRes = await fetch("/api/auth/me", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ access_token: authData.session.access_token }),
      });
      if (!meRes.ok) {
        setError("Failed to load account details. Please try again.");
        return;
      }

      const employee = await meRes.json();

      if (employee.first_login) {
        router.push("/change-password");
        return;
      }

      if (
        employee.role === "SM" &&
        (!employee.store_codes || employee.store_codes.length === 0)
      ) {
        setError("No stores assigned. Contact your administrator.");
        return;
      }

      if (employee.role === "SM" && employee.store_codes?.length > 1) {
        setStoreCodes(employee.store_codes);
        setStoreSelector(true);
        return;
      }

      if (employee.role === "SM" && employee.store_codes?.length === 1) {
        localStorage.setItem("selected_store_code", employee.store_codes[0]);
      }

      router.push(ROLE_HOMES[employee.role] || "/readonly/dashboard");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("Login error:", msg);
      setError("Error: " + msg);
    } finally {
      setLoading(false);
    }
  }

  function selectStore(code: string) {
    localStorage.setItem("selected_store_code", code);
    setStoreSelector(false);
    router.push("/sm/home");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-[400px]">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-500 shadow-theme-sm">
            <BuildingStorefrontIcon className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-title-sm font-bold text-gray-800">
            ALP Store Audit
          </h1>
          <p className="mt-1.5 text-theme-sm text-gray-500">
            Sign in to your account
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-sm">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error && (
              <div className="flex justify-center">
                <Badge variant="error">{error}</Badge>
              </div>
            )}

            <Input
              label="Employee ID"
              placeholder="e.g. EMP-SM-001"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              required
            />

            <Input
              label="Mobile Number"
              placeholder="e.g. 9820000001"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              required
            />

            <Input
              label="Password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Spinner size="sm" /> : "Sign In"}
            </Button>

            <button
              type="button"
              onClick={() => toast("info", "Contact your administrator")}
              className="text-theme-sm text-gray-500 hover:text-brand-500"
            >
              Forgot password?
            </button>
          </form>
        </div>
      </div>

      <Modal
        open={storeSelector}
        onClose={() => setStoreSelector(false)}
        title="Select Store"
      >
        <p className="mb-4 text-theme-sm text-gray-500">
          You are assigned to multiple stores. Select one to continue.
        </p>
        <div className="flex flex-col gap-2">
          {storeCodes.map((code) => (
            <button
              key={code}
              onClick={() => selectStore(code)}
              className="rounded-lg border border-gray-200 px-4 py-3 text-left text-theme-sm font-medium text-gray-800 shadow-theme-xs hover:bg-gray-50"
            >
              {code}
            </button>
          ))}
        </div>
      </Modal>
    </div>
  );
}
