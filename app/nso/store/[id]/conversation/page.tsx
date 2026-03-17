"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useEmployee } from "@/lib/hooks/useEmployee";
import NSOTopbar from "@/components/layout/NSOTopbar";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";
import { formatIST } from "@/lib/utils/dates";
import type { RealtimeChannel } from "@supabase/supabase-js";

interface Message {
  id: string;
  sender_id: string;
  message: string;
  created_at: string;
  audit_item_id: string | null;
  employees: { full_name: string; role: string };
}

export default function ConversationPage() {
  const { id } = useParams<{ id: string }>();
  const { employee } = useEmployee();
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [auditId, setAuditId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const senderCacheRef = useRef<Map<string, { full_name: string; role: string }>>(new Map());

  useEffect(() => {
    const supabase = createClient();

    async function fetchData() {
      // Get audit id for this store
      const { data: audits } = await supabase
        .from("audits")
        .select("id")
        .eq("store_id", id)
        .order("created_at", { ascending: false })
        .limit(1);

      if (!audits?.length) { setLoading(false); return; }
      const aid = audits[0].id;
      setAuditId(aid);

      const { data } = await supabase
        .from("conversations")
        .select("id, sender_id, message, created_at, audit_item_id, employees(full_name, role)")
        .eq("audit_id", aid)
        .order("created_at");

      if (data) {
        const msgs = data as unknown as Message[];
        setMessages(msgs);

        // Build sender cache from initial fetch
        for (const m of msgs) {
          const emp = m.employees as unknown as { full_name: string; role: string } | null;
          if (emp && m.sender_id) {
            senderCacheRef.current.set(m.sender_id, emp);
          }
        }
      }
      setLoading(false);

      // Realtime — subscribe outside fetchData's return so cleanup works
      const channel = supabase
        .channel("conv-" + aid)
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "conversations", filter: `audit_id=eq.${aid}` }, async (payload) => {
          const newMsg = payload.new as Message;

          // Resolve sender name from cache or query
          let emp = senderCacheRef.current.get(newMsg.sender_id);
          if (!emp) {
            const { data: empData } = await supabase
              .from("employees")
              .select("full_name, role")
              .eq("id", newMsg.sender_id)
              .single();
            if (empData) {
              emp = empData;
              senderCacheRef.current.set(newMsg.sender_id, empData);
            }
          }

          const enrichedMsg: Message = {
            ...newMsg,
            employees: emp || { full_name: "Unknown", role: "" },
          };

          setMessages((prev) => [...prev, enrichedMsg]);
        })
        .subscribe();

      channelRef.current = channel;
    }
    fetchData();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    if (!text.trim() || !employee || !auditId) return;
    const supabase = createClient();
    await supabase.from("conversations").insert({
      audit_id: auditId,
      sender_id: employee.id,
      message: text,
    });
    setText("");
  }

  if (loading) return <div className="flex h-screen items-center justify-center"><Spinner size="lg" /></div>;

  return (
    <div className="flex h-screen flex-col">
      <NSOTopbar title="Conversation" />
      <div className="flex-1 overflow-y-auto p-6 space-y-3">
        {messages.map((m) => {
          const isMine = m.sender_id === employee?.id;
          const emp = m.employees as unknown as { full_name: string; role: string } | null;
          return (
            <div key={m.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[70%] rounded-lg px-4 py-2.5 ${isMine ? "rounded-tr-none bg-brand-50" : "rounded-tl-none bg-gray-50"}`}>
                <p className="text-xs font-medium text-gray-500">{emp?.full_name || "Unknown"}</p>
                <p className="text-sm text-gray-900">{m.message}</p>
                <p className="mt-1 text-[10px] text-gray-400">{formatIST(m.created_at, "datetime")}</p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      <div className="border-t border-gray-200 bg-white p-4">
        <div className="flex gap-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm placeholder:text-gray-400 focus:border-brand-500 focus:outline-none"
            rows={1}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          />
          <Button onClick={handleSend} disabled={!text.trim()}>Send</Button>
        </div>
      </div>
    </div>
  );
}
