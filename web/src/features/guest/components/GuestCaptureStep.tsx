"use client";

import { useState, useCallback, useRef } from "react";
import type { StepCapture } from "@/features/steps";
import { useCamera } from "../hooks/useCamera";
import { saveCaptureAction } from "@/features/sessions/actions";
import { Button } from "@/components/ui/button";
import { Camera } from "lucide-react";

interface GuestCaptureStepProps {
  step: StepCapture;
  eventId: string;
  sessionId: string;
  onCaptureComplete: () => void;
}

/**
 * Guest-facing capture step component
 * Integrates real camera via useCamera hook and uploads captured photo
 */
export function GuestCaptureStep({
  step,
  eventId,
  sessionId,
  onCaptureComplete,
}: GuestCaptureStepProps) {
  const { stream, error, videoRef, isLoading } = useCamera();
  const [isCapturing, setIsCapturing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [captureError, setCaptureError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  /**
   * Capture photo from video stream and upload to storage
   */
  const handleCapture = useCallback(async () => {
    if (!stream || !videoRef.current || !canvasRef.current) {
      setCaptureError("Camera not ready");
      return;
    }

    setIsCapturing(true);
    setCaptureError(null);

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");

      if (!context) {
        throw new Error("Canvas context not available");
      }

      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw current video frame to canvas (mirror for front camera)
      context.save();
      context.scale(-1, 1);
      context.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
      context.restore();

      // Convert canvas to blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (b) => {
            if (b) resolve(b);
            else reject(new Error("Failed to create blob"));
          },
          "image/jpeg",
          0.9
        );
      });

      // Upload photo
      setIsUploading(true);
      const formData = new FormData();
      formData.append("eventId", eventId);
      formData.append("sessionId", sessionId);
      formData.append("photo", blob, "photo.jpg");

      // Upload and trigger transform (all server-side, non-blocking)
      await saveCaptureAction(formData);

      // Stop camera stream after successful capture
      stream.getTracks().forEach((track) => track.stop());

      // Clear uploading state BEFORE advancing
      setIsUploading(false);
      setIsCapturing(false);

      // Advance to next step IMMEDIATELY
      // Transform is triggered automatically server-side after upload
      onCaptureComplete();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Capture failed";
      setCaptureError(message);
      console.error("[GuestCaptureStep] Capture failed:", err);
    } finally {
      setIsCapturing(false);
      setIsUploading(false);
    }
  }, [stream, videoRef, eventId, sessionId, onCaptureComplete]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center space-y-4">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-white border-r-transparent"></div>
          <p className="text-white text-lg">Requesting camera access...</p>
        </div>
      </div>
    );
  }

  // Camera error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black px-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="text-6xl">📷</div>
          <h2 className="text-2xl font-bold text-white">
            Camera Access Required
          </h2>
          <p className="text-gray-300">{error}</p>
          <div className="text-sm text-gray-400 space-y-2">
            <p>To continue, please:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Check your browser settings</li>
              <li>Allow camera permission for this site</li>
              <li>Reload the page</li>
            </ol>
          </div>
          {/* TODO: Add file upload fallback option */}
        </div>
      </div>
    );
  }

  // Uploading state
  if (isUploading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center space-y-4">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-white border-r-transparent"></div>
          <p className="text-white text-lg">Uploading photo...</p>
        </div>
      </div>
    );
  }

  // Camera ready - show live preview with capture button
  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Header with title/description */}
      {(step.title || step.description) && (
        <div className="absolute top-0 left-0 right-0 z-10 p-6 bg-gradient-to-b from-black/80 to-transparent">
          {step.title && (
            <h1 className="text-2xl font-bold text-white mb-2">
              {step.title}
            </h1>
          )}
          {step.description && (
            <p className="text-gray-200">{step.description}</p>
          )}
        </div>
      )}

      {/* Live camera preview */}
      <div className="flex-1 relative">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover"
          style={{
            // Mirror effect for front camera
            transform: "scaleX(-1)",
          }}
        />

        {/* Hidden canvas for capture */}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* Capture error banner */}
      {captureError && (
        <div className="absolute top-20 left-4 right-4 z-10 bg-red-500/90 text-white px-4 py-3 rounded-lg">
          {captureError}
        </div>
      )}

      {/* Capture button */}
      <div className="absolute bottom-0 left-0 right-0 z-10 p-6 bg-gradient-to-t from-black/80 to-transparent">
        <div className="flex justify-center">
          <Button
            onClick={handleCapture}
            disabled={isCapturing || isUploading}
            size="lg"
            className="bg-white text-black hover:bg-gray-100 h-16 px-8 rounded-full"
          >
            <Camera className="mr-2 h-5 w-5" />
            {isCapturing ? "Capturing..." : step.ctaLabel || "Take Photo"}
          </Button>
        </div>
      </div>
    </div>
  );
}
