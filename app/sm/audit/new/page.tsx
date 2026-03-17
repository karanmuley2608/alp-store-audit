"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useEmployee } from "@/lib/hooks/useEmployee";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Spinner from "@/components/ui/Spinner";
import { useToast } from "@/components/ui/Toast";
import { CameraIcon, UserCircleIcon } from "@heroicons/react/24/outline";

export default function NewAuditPage() {
  const { employee } = useEmployee();
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const uploadRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { toast } = useToast();

  // Stop camera stream on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, []);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 640 } },
        audio: false,
      });
      streamRef.current = stream;
      setCameraActive(true);
      // Wait for next tick so video element is rendered
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      }, 50);
    } catch {
      toast("error", "Camera access denied. Please allow camera permissions.");
    }
  }, [toast]);

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }

  function capturePhoto() {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d")!;
    // Mirror the image (front camera is mirrored)
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `selfie-${Date.now()}.jpg`, { type: "image/jpeg" });
        setPhoto(file);
        setPreview(URL.createObjectURL(blob));
        stopCamera();
      }
    }, "image/jpeg", 0.9);
  }

  function handleFileUpload(file: File | null) {
    if (!file) return;
    setPhoto(file);
    setPreview(URL.createObjectURL(file));
  }

  function handleRetake() {
    setPhoto(null);
    setPreview(null);
    startCamera();
  }

  async function handleConfirm() {
    if (!photo || !employee) return;
    setLoading(true);

    const supabase = createClient();
    const storeCode = localStorage.getItem("selected_store_code") || employee.store_codes?.[0];

    const { data: store } = await supabase
      .from("stores")
      .select("id")
      .eq("store_code", storeCode)
      .single();

    if (!store) {
      toast("error", "Store not found");
      setLoading(false);
      return;
    }

    const filename = `${Date.now()}-${employee.employee_code}.jpg`;
    const uploadForm = new FormData();
    uploadForm.append("file", photo);
    uploadForm.append("bucket", "selfies");
    uploadForm.append("path", filename);

    const uploadRes = await fetch("/api/upload", { method: "POST", body: uploadForm });
    if (!uploadRes.ok) {
      const err = await uploadRes.json().catch(() => ({ error: "Upload failed" }));
      toast("error", err.error || "Failed to upload selfie");
      setLoading(false);
      return;
    }

    const { publicUrl } = await uploadRes.json();

    const { data: audit, error: auditError } = await supabase
      .from("audits")
      .insert({
        store_id: store.id,
        sm_id: employee.id,
        selfie_url: publicUrl,
        status: "in_progress",
      })
      .select()
      .single();

    if (auditError || !audit) {
      toast("error", "Failed to create audit");
      setLoading(false);
      return;
    }

    router.push(`/sm/audit/${audit.id}/consent`);
  }

  return (
    <div className="space-y-5 p-4">
      {/* Step dots */}
      <div className="flex items-center justify-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full bg-brand-500" />
        <span className="h-2.5 w-2.5 rounded-full bg-gray-200" />
      </div>

      <div className="text-center">
        <h1 className="text-page-title text-gray-900">Verify your identity</h1>
        <p className="mt-1 text-sm text-gray-500">
          Step 1 of 2 · Selfie for attendance
        </p>
      </div>

      <Card className="flex flex-col items-center py-8">
        {/* Viewfinder circle */}
        <div className="relative flex h-40 w-40 items-center justify-center rounded-full border-2 border-dashed border-gray-200 bg-gray-50 overflow-hidden">
          {cameraActive ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="h-full w-full object-cover rounded-full"
              style={{ transform: "scaleX(-1)" }}
            />
          ) : preview ? (
            <img src={preview} alt="Selfie" className="h-full w-full object-cover rounded-full" />
          ) : (
            <UserCircleIcon className="h-20 w-20 text-gray-300" />
          )}
        </div>

        <div className="mt-6 flex flex-col gap-3 w-full px-4">
          {cameraActive ? (
            <>
              <Button onClick={capturePhoto} className="w-full">
                <CameraIcon className="h-4 w-4" />
                Take photo
              </Button>
              <Button variant="ghost" onClick={stopCamera} className="w-full">
                Cancel
              </Button>
            </>
          ) : !preview ? (
            <>
              <Button onClick={startCamera} className="w-full">
                <CameraIcon className="h-4 w-4" />
                Open camera
              </Button>
              <Button
                variant="ghost"
                onClick={() => uploadRef.current?.click()}
                className="w-full"
              >
                Upload existing photo
              </Button>
            </>
          ) : (
            <>
              <Button onClick={handleConfirm} disabled={loading} className="w-full">
                {loading ? <Spinner size="sm" /> : "Confirm & continue"}
              </Button>
              <Button variant="ghost" onClick={handleRetake} className="w-full">
                Retake
              </Button>
            </>
          )}
        </div>

        <input
          ref={uploadRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFileUpload(e.target.files?.[0] || null)}
        />
      </Card>
    </div>
  );
}
