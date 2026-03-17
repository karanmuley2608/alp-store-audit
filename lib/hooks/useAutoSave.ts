"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function useAutoSave(
  table: string,
  id: string | undefined,
  data: Record<string, unknown>,
  debounceMs = 1000
) {
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const timeoutRef = useRef<NodeJS.Timeout>();
  const prevDataRef = useRef<string>("");

  const save = useCallback(async () => {
    if (!id) return;
    setStatus("saving");
    const supabase = createClient();
    const { error } = await supabase.from(table).update(data).eq("id", id);
    setStatus(error ? "error" : "saved");
  }, [table, id, data]);

  useEffect(() => {
    const serialized = JSON.stringify(data);
    if (serialized === prevDataRef.current) return;
    prevDataRef.current = serialized;

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(save, debounceMs);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [data, debounceMs, save]);

  return { status };
}
