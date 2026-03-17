"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { BuildingStorefrontIcon } from "@heroicons/react/24/outline";

const ROLE_HOMES: Record<string, string> = {
  Admin: "/admin/dashboard",
  "NSO Head": "/nso/dashboard",
  SM: "/sm/home",
};

const RULES = [
  { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { label: "One uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { label: "One number", test: (p: string) => /[0-9]/.test(p) },
  { label: "One special character", test: (p: string) => /[!@#$%^&*(),.?":{}|<>]/.test(p) },
];

export default function ChangePasswordPage() {
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const allValid = RULES.every((r) => r.test(newPassword));
  const match = newPassword === confirm && confirm.length > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!allValid || !match) return;
    setLoading(true);

    try {
      const supabase = createClient();

      // Step 1: Update the password via Supabase Auth
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) {
        toast("error", error.message);
        return;
      }

      // Step 2: Mark first_login=false and get role via server API (bypasses RLS)
      const res = await fetch("/api/auth/complete-password-change", {
        method: "POST",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast("error", data.error || "Failed to complete password change");
        return;
      }

      const { role } = await res.json();

      toast("success", "Password updated successfully");
      router.push(ROLE_HOMES[role || ""] || "/readonly/dashboard");
    } catch {
      toast("error", "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-[400px]">
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-500">
            <BuildingStorefrontIcon className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-page-title text-gray-900">Change Password</h1>
          <p className="mt-1 text-sm text-gray-500">
            Please set a new password to continue
          </p>
        </div>

        <div className="rounded-card border border-gray-200 bg-white p-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="New Password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />

            <div className="flex flex-col gap-1">
              {RULES.map((rule) => (
                <span
                  key={rule.label}
                  className={`text-xs ${rule.test(newPassword) ? "text-success-600" : "text-gray-400"}`}
                >
                  {rule.test(newPassword) ? "\u2713" : "\u25CB"} {rule.label}
                </span>
              ))}
            </div>

            <Input
              label="Confirm Password"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              error={confirm && !match ? "Passwords do not match" : undefined}
              required
            />

            <Button
              type="submit"
              className="w-full"
              disabled={!allValid || !match || loading}
            >
              {loading ? "Updating..." : "Update Password"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
