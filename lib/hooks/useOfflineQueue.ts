"use client";

import { useCallback, useEffect, useState } from "react";
import { openDB, type IDBPDatabase } from "idb";
import { createClient } from "@/lib/supabase/client";

interface QueueItem {
  id: string;
  table: string;
  operation: "upsert" | "insert";
  data: Record<string, unknown>;
  timestamp: number;
}

const DB_NAME = "alp-offline";
const STORE_NAME = "queue";

async function getDB(): Promise<IDBPDatabase> {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    },
  });
}

export function useOfflineQueue() {
  const [isOnline, setIsOnline] = useState(
    typeof window !== "undefined" ? navigator.onLine : true
  );
  const [queueLength, setQueueLength] = useState(0);

  useEffect(() => {
    const goOnline = () => {
      setIsOnline(true);
      processQueue();
    };
    const goOffline = () => setIsOnline(false);

    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);

    // Check queue length on mount
    getDB().then(async (db) => {
      const count = await db.count(STORE_NAME);
      setQueueLength(count);
    });

    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  const addToQueue = useCallback(async (item: Omit<QueueItem, "id" | "timestamp">) => {
    const db = await getDB();
    const entry: QueueItem = {
      ...item,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    };
    await db.add(STORE_NAME, entry);
    setQueueLength((prev) => prev + 1);

    // Try to sync immediately if online
    if (navigator.onLine) {
      await processQueue();
    }
  }, []);

  const processQueue = useCallback(async () => {
    const db = await getDB();
    const supabase = createClient();
    const items = await db.getAll(STORE_NAME);

    for (const item of items) {
      try {
        if (item.operation === "upsert") {
          const { error } = await supabase.from(item.table).upsert(item.data);
          if (error) continue;
        } else {
          const { error } = await supabase.from(item.table).insert(item.data);
          if (error) continue;
        }
        await db.delete(STORE_NAME, item.id);
        setQueueLength((prev) => Math.max(0, prev - 1));
      } catch {
        // Will retry on next processQueue call
      }
    }
  }, []);

  return { isOnline, queueLength, addToQueue, processQueue };
}
