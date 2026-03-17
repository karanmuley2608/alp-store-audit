"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import NSOTopbar from "@/components/layout/NSOTopbar";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import Spinner from "@/components/ui/Spinner";
import { formatIST } from "@/lib/utils/dates";

interface MediaItem {
  id: string;
  file_url: string;
  file_type: string;
  uploaded_at: string;
  sr_no: number;
  work_type: string;
  activity: string;
  category: string;
}

const categories = ["All", "MEP", "Interior", "Wet areas", "Façade", "Fixtures"];

export default function MediaGalleryPage() {
  const { storeId } = useParams<{ storeId: string }>();
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [filter, setFilter] = useState("All");
  const [selected, setSelected] = useState<MediaItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    async function fetchData() {
      const { data: audits } = await supabase
        .from("audits")
        .select("id")
        .eq("store_id", storeId)
        .order("created_at", { ascending: false })
        .limit(1);

      if (!audits?.length) { setLoading(false); return; }

      const { data: evidence } = await supabase
        .from("audit_evidence")
        .select("id, file_url, file_type, uploaded_at, audit_items(checklist_items(sr_no, work_type, activity, category))")
        .eq("audit_id", audits[0].id);

      if (evidence) {
        const items: MediaItem[] = evidence.map((e) => {
          const ai = e.audit_items as unknown as { checklist_items: { sr_no: number; work_type: string; activity: string; category: string } };
          return {
            id: e.id,
            file_url: e.file_url,
            file_type: e.file_type,
            uploaded_at: e.uploaded_at,
            sr_no: ai?.checklist_items?.sr_no || 0,
            work_type: ai?.checklist_items?.work_type || "",
            activity: ai?.checklist_items?.activity || "",
            category: ai?.checklist_items?.category || "",
          };
        });
        setMedia(items);
      }
      setLoading(false);
    }
    fetchData();
  }, [storeId]);

  const filtered = media.filter((m) => filter === "All" || m.category === filter);

  if (loading) return <div className="flex h-screen items-center justify-center"><Spinner size="lg" /></div>;

  return (
    <div className="flex flex-col">
      <NSOTopbar title="Media Gallery" />
      <div className="space-y-4 p-6">
        {/* Filter */}
        <div className="flex gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`rounded-full px-3 py-1 text-xs font-medium ${filter === cat ? "bg-brand-500 text-white" : "bg-gray-100 text-gray-700"}`}
            >
              {cat}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-400">No media found</p>
        ) : (
          <div className="grid grid-cols-4 gap-4">
            {filtered.map((m) => (
              <div
                key={m.id}
                onClick={() => setSelected(m)}
                className="cursor-pointer overflow-hidden rounded-lg border border-gray-200"
              >
                <div className="relative aspect-square bg-gray-100">
                  {m.file_type === "photo" ? (
                    <img src={m.file_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <Badge variant="info">Video</Badge>
                    </div>
                  )}
                  <span className="absolute left-1 top-1 rounded bg-gray-900/70 px-1.5 py-0.5 text-[10px] font-medium text-white">
                    #{m.sr_no}
                  </span>
                  <span className="absolute right-1 top-1 rounded bg-gray-900/70 px-1.5 py-0.5 text-[10px] font-medium text-white">
                    {m.file_type}
                  </span>
                </div>
                <div className="p-2">
                  <p className="truncate text-xs font-medium text-gray-900">{m.work_type} · {m.activity}</p>
                  <p className="text-[10px] text-gray-400">{formatIST(m.uploaded_at, "relative")}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={!!selected} onClose={() => setSelected(null)} size="xl">
        {selected && (
          selected.file_type === "photo" ? (
            <img src={selected.file_url} alt="" className="w-full rounded-lg" />
          ) : (
            <video src={selected.file_url} controls className="w-full rounded-lg" />
          )
        )}
      </Modal>
    </div>
  );
}
