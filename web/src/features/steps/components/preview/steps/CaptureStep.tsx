"use client";

/**
 * Preview: CaptureStep
 *
 * Read-only preview for Capture step type.
 * Displays a camera UI mockup with the step configuration.
 * Shows the fallback experience if configured.
 */

import { useMemo } from "react";
import { Camera, FlipHorizontal, Zap, ImageIcon, AlertCircle } from "lucide-react";
import { StepLayout, ActionButton } from "@/components/step-primitives";
import { useEventTheme } from "@/components/providers/EventThemeProvider";
import type { StepCapture } from "@/features/steps/types";
import type { Experience } from "@/features/experiences/types";

interface CaptureStepProps {
  step: StepCapture;
  experiences: Experience[];
}

export function CaptureStep({ step, experiences }: CaptureStepProps) {
  const { theme } = useEventTheme();
  const config = step.config ?? { source: "selected_experience_id", fallbackExperienceId: null };

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
            className="w-full max-w-[200px] aspect-[3/4] rounded-xl overflow-hidden relative"
            style={{
              backgroundColor: theme.text.color + "10",
              border: `2px dashed ${theme.text.color}30`,
            }}
          >
            {/* Camera viewfinder simulation */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <Camera
                className="h-12 w-12 mb-2 opacity-40"
                style={{ color: theme.text.color }}
              />
              <span
                className="text-xs opacity-60"
                style={{ color: theme.text.color }}
              >
                Camera Preview
              </span>
            </div>

            {/* Corner guides */}
            <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 rounded-tl" style={{ borderColor: theme.text.color + "60" }} />
            <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 rounded-tr" style={{ borderColor: theme.text.color + "60" }} />
            <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 rounded-bl" style={{ borderColor: theme.text.color + "60" }} />
            <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 rounded-br" style={{ borderColor: theme.text.color + "60" }} />
          </div>

          {/* Camera controls */}
          {/* <div className="flex items-center gap-6 mt-4">
            <button
              type="button"
              className="p-2 rounded-full opacity-60"
              style={{ backgroundColor: theme.text.color + "20" }}
            >
              <FlipHorizontal className="h-5 w-5" style={{ color: theme.text.color }} />
            </button>
            <button
              type="button"
              className="p-4 rounded-full"
              style={{
                backgroundColor: theme.button.backgroundColor ?? theme.primaryColor,
                border: `3px solid ${theme.text.color}40`,
              }}
            >
              <Camera className="h-6 w-6" style={{ color: theme.button.textColor }} />
            </button>
            <button
              type="button"
              className="p-2 rounded-full opacity-60"
              style={{ backgroundColor: theme.text.color + "20" }}
            >
              <Zap className="h-5 w-5" style={{ color: theme.text.color }} />
            </button>
          </div> */}
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

        {/* Source Variable Info (subtle) */}
        {/* <div
          className="text-xs opacity-40 text-center mt-2"
          style={{ color: theme.text.color }}
        >
          Source: {config.source}
        </div> */}
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
