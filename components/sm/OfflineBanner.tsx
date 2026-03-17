"use client";

import { useOfflineQueue } from "@/lib/hooks/useOfflineQueue";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";

export default function OfflineBanner() {
  const { isOnline, queueLength } = useOfflineQueue();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-[60px] left-0 right-0 z-50 flex items-center justify-center gap-2 bg-warning-50 px-4 py-2 text-xs font-medium text-warning-700">
      <ExclamationTriangleIcon className="h-4 w-4" />
      You are offline — changes saved locally, will sync when connected
      {queueLength > 0 && ` (${queueLength} pending)`}
    </div>
  );
}
