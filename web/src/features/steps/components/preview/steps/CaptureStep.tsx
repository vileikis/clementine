"use client";

/**
 * Preview: CaptureStep
 *
 * Read-only preview for Capture step type.
 * Displays a camera UI mockup with the step configuration.
 * Shows the fallback experience if configured.
 * Uses placeholder images from mockSession for realistic preview.
 */

import { useMemo } from "react";
import Image from "next/image";
import { ImageIcon, AlertCircle } from "lucide-react";
import { StepLayout, ActionButton } from "@/components/step-primitives";
import { useEventTheme } from "@/components/providers/EventThemeProvider";
import type { StepCapture } from "@/features/steps/types";
import type { Experience } from "@/features/experiences/types";
import type { MockSessionData } from "@/features/steps/types/preview.types";

interface CaptureStepProps {
  step: StepCapture;
  experiences: Experience[];
  mockSession?: MockSessionData;
}

export function CaptureStep({ step, experiences, mockSession }: CaptureStepProps) {
  const { theme } = useEventTheme();
  const config = step.config ?? { source: "selected_experience_id", fallbackExperienceId: null };
  const capturedPhoto = mockSession?.capturedPhoto ?? "/placeholders/selfie-placeholder.svg";

  // Get fallback experience data
  const fallbackExperience = useMemo(() => {
    if (!config.fallbackExperienceId) return null;
    return experiences.find((e) => e.id === config.fallbackExperienceId) ?? null;
  }, [config.fallbackExperienceId, experiences]);

  // Check if fallback is missing
  const isFallbackMissing = useMemo(() => {
    if (!config.fallbackExperienceId) return false;
    return !experiences.some((e) => e.id === config.fallbackExperienceId);
  }, [config.fallbackExperienceId, experiences]);

  return (
    <StepLayout mediaUrl={step.mediaUrl}>
      <div className="flex-1 flex flex-col">
        {/* Header with title/description */}
        {(step.title || step.description) && (
          <div className="mb-4">
            {step.title && (
              <h2 className="text-2xl font-bold mb-1">{step.title}</h2>
            )}
            {step.description && (
              <p className="text-sm opacity-80">{step.description}</p>
            )}
          </div>
        )}

        {/* Camera Preview Area */}
        <div className="flex-1 flex flex-col items-center justify-center">
          <div
            className="w-full max-w-[200px] aspect-[3/4] rounded-xl overflow-hidden relative bg-gray-900"
          >
            {/* Placeholder photo simulating camera feed */}
            <Image
              src={capturedPhoto}
              alt="Camera preview"
              fill
              className="object-cover opacity-75"
              unoptimized
            />

            {/* Camera viewfinder overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <Image
                src="/placeholders/camera-viewfinder.svg"
                alt=""
                width={160}
                height={160}
                className="opacity-80"
                unoptimized
              />
            </div>

            {/* Corner guides */}
            <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 rounded-tl border-white/60" />
            <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 rounded-tr border-white/60" />
            <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 rounded-bl border-white/60" />
            <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 rounded-br border-white/60" />
          </div>
        </div>

        {/* Fallback Experience Info */}
        {(fallbackExperience || isFallbackMissing) && (
          <div className="mt-4">
            <div
              className="text-xs opacity-60 mb-1 text-center"
              style={{ color: theme.text.color }}
            >
              Using experience:
            </div>
            {isFallbackMissing ? (
              <div className="flex items-center gap-2 justify-center text-xs text-destructive">
                <AlertCircle className="h-3 w-3" />
                <span>Missing experience</span>
              </div>
            ) : fallbackExperience ? (
              <div
                className="flex items-center gap-2 justify-center p-2 rounded-lg"
                style={{ backgroundColor: theme.text.color + "10" }}
              >
                {fallbackExperience.previewMediaUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={fallbackExperience.previewMediaUrl}
                    alt=""
                    className="h-8 w-8 rounded object-cover shrink-0"
                  />
                ) : (
                  <div
                    className="h-8 w-8 rounded flex items-center justify-center shrink-0"
                    style={{ backgroundColor: theme.text.color + "20" }}
                  >
                    <ImageIcon className="h-4 w-4 opacity-40" />
                  </div>
                )}
                <span className="text-sm font-medium truncate">
                  {fallbackExperience.name}
                </span>
              </div>
            ) : null}
          </div>
        )}

  
      </div>

      {/* CTA Button */}
      {step.ctaLabel && (
        <div className="mt-auto pt-4">
          <ActionButton>{step.ctaLabel}</ActionButton>
        </div>
      )}
    </StepLayout>
  );
}
