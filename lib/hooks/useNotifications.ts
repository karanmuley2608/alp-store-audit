"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Notification {
  id: string;
  recipient_id: string;
  type: string;
  title: string;
  body: string;
  reference_id: string | null;
  reference_type: string | null;
  read: boolean;
  created_at: string;
}

export function useNotifications(employeeId: string | undefined) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!employeeId) return;

    const supabase = createClient();

    async function fetchNotifications() {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("recipient_id", employeeId!)
        .order("created_at", { ascending: false })
        .limit(50);

      if (data) {
        setNotifications(data);
        setUnreadCount(data.filter((n) => !n.read).length);
      }
    }

    fetchNotifications();

    const channel = supabase
      .channel("notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `recipient_id=eq.${employeeId}`,
        },
        (payload) => {
          setNotifications((prev) => [payload.new as Notification, ...prev]);
          setUnreadCount((prev) => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [employeeId]);

  function markAllAsReadLocal() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  }

  return { notifications, unreadCount, markAllAsReadLocal };
}
