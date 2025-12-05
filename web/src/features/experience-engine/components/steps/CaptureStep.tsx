"use client";

// ============================================================================
// CaptureStep Renderer
// ============================================================================
// Renders capture step for Experience Engine.
// Camera capture with upload fallback. Auto-advances on capture.
// TODO: Implement real camera integration for guest flow.

import { useCallback, useRef, useEffect } from "react";
import Image from "next/image";
import { Camera, Upload } from "lucide-react";
import { StepLayout, ActionButton } from "@/components/step-primitives";
import type { StepCapture } from "@/features/steps/types";
import type { StepRendererProps } from "../../types";

type CaptureStepProps = StepRendererProps<StepCapture>;

export function CaptureStep({
  step,
  currentValue,
  isInteractive,
  onChange,
  onComplete,
  onCtaClick,
}: CaptureStepProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const objectUrlRef = useRef<string | null>(null);

  // Extract current photo URL
  const capturedPhotoUrl =
    currentValue?.type === "photo" ? currentValue.url : undefined;

  // Track if we've auto-advanced
  const hasAutoAdvanced = useRef(false);

  // Cleanup object URL on unmount
  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, []);

  // Handle file selection (mock capture for now)
  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file || !isInteractive) return;

      // Revoke previous object URL if it exists
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }

      // Create a local URL for the captured photo
      // In production, this would upload to storage and return a permanent URL
      const objectUrl = URL.createObjectURL(file);
      objectUrlRef.current = objectUrl;
      onChange({ type: "photo", url: objectUrl });
    },
    [isInteractive, onChange]
  );

  // Handle capture button click
  const handleCaptureClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // Auto-advance when photo is captured
  useEffect(() => {
    if (capturedPhotoUrl && isInteractive && !hasAutoAdvanced.current) {
      hasAutoAdvanced.current = true;
      // Small delay before auto-advancing
      const timer = setTimeout(() => {
        onComplete();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [capturedPhotoUrl, isInteractive, onComplete]);

  // Reset auto-advance flag when step changes
  useEffect(() => {
    hasAutoAdvanced.current = false;
  }, [step.id]);

  return (
    <StepLayout
      mediaUrl={step.mediaUrl}
      mediaType={step.mediaType}
      action={
        step.ctaLabel && <ActionButton onClick={onCtaClick}>{step.ctaLabel}</ActionButton>
      }
    >
      <div className="flex-1 flex flex-col">
        {/* Header with title/description */}
        {(step.title || step.description) && (
          <div className="mb-4">
            {step.title && <h2 className="text-2xl font-bold mb-1">{step.title}</h2>}
            {step.description && (
              <p className="text-sm opacity-80">{step.description}</p>
            )}
          </div>
        )}

        {/* Camera Preview Area */}
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="w-[70%] lg:w-[50%] lg:max-w-[300px] aspect-[3/4] rounded-xl overflow-hidden relative bg-gray-900">
            {capturedPhotoUrl ? (
              // Show captured photo
              <Image
                src={capturedPhotoUrl}
                alt="Captured photo"
                fill
                className="object-cover"
                unoptimized
              />
            ) : (
              // Show placeholder/camera preview
              <>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Camera className="h-16 w-16 text-white/40" />
                </div>
                {/* Corner guides */}
                <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 rounded-tl border-white/60" />
                <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 rounded-tr border-white/60" />
                <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 rounded-bl border-white/60" />
                <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 rounded-br border-white/60" />
              </>
            )}
          </div>

          {/* Capture/Upload Controls */}
          {isInteractive && !capturedPhotoUrl && (
            <div className="mt-6 flex gap-4">
              <button
                type="button"
                onClick={handleCaptureClick}
                className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-lg active:scale-95 transition-transform"
                aria-label="Capture photo"
              >
                <Camera className="w-8 h-8 text-gray-800" />
              </button>
              <button
                type="button"
                onClick={handleCaptureClick}
                className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center shadow-lg active:scale-95 transition-transform self-end"
                aria-label="Upload photo"
              >
                <Upload className="w-5 h-5 text-white" />
              </button>
            </div>
          )}

          {/* Retake button when photo is captured */}
          {isInteractive && capturedPhotoUrl && (
            <button
              type="button"
              onClick={handleCaptureClick}
              className="mt-4 px-4 py-2 rounded-lg bg-white/20 text-sm font-medium"
            >
              Retake Photo
            </button>
          )}
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="user"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
    </StepLayout>
  );
}
