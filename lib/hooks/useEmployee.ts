"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export interface Employee {
  id: string;
  employee_code: string;
  full_name: string;
  email: string;
  mobile: string;
  role: string;
  sub_role: string | null;
  store_codes: string[];
  region_id: string | null;
  status: string;
  notes: string | null;
  auth_user_id: string;
  first_login: boolean;
}

export function useEmployee() {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    async function fetchEmployee() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("employees")
        .select("*")
        .eq("auth_user_id", user.id)
        .single();

      setEmployee(data);
      setLoading(false);
    }

    fetchEmployee();
  }, []);

  return { employee, loading };
}
