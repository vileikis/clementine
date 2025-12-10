"use client";

/**
 * Preview: ProcessingStep
 *
 * Read-only preview for Processing step type.
 * Displays a loading/generation screen with rotating messages
 * and a progress indicator.
 *
 * Responsive sizing:
 * - Mobile: 48px spinner, 80% progress bar
 * - Desktop: 64px spinner, 60% progress bar (max 400px)
 */

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { StepLayout } from "@/components/step-primitives";
import { useEventTheme } from "@/features/theming";
import type { StepProcessing } from "@/features/steps/types";

interface ProcessingStepProps {
  step: StepProcessing;
  /** Enable interactive mode (playback) */
  isInteractive?: boolean;
  /** Callback when step is complete (triggers auto-advance in playback) */
  onComplete?: () => void;
}

export function ProcessingStep({
  step,
  isInteractive = false,
  onComplete,
}: ProcessingStepProps) {
  const { buttonBgColor } = useEventTheme();
  const messages = step.config?.messages ?? [
    "Creating your image...",
    "Almost there...",
    "Finishing touches...",
  ];
  const estimatedDuration = step.config?.estimatedDuration ?? 30;

  // Cycle through messages for demo effect in preview
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  // Rotate messages every ~3 seconds in preview
  useEffect(() => {
    if (messages.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % messages.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [messages.length]);

  // Simulate progress animation (loops in preview)
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) return 0;
        return prev + (100 / (estimatedDuration * 10)); // Update every 100ms
      });
    }, 100);

    return () => clearInterval(interval);
  }, [estimatedDuration]);

  // Auto-advance in interactive/playback mode after 2 seconds
  useEffect(() => {
    if (!isInteractive || !onComplete) return;

    const timer = setTimeout(() => {
      onComplete();
    }, 2000);

    return () => clearTimeout(timer);
  }, [isInteractive, onComplete]);

  return (
    <StepLayout mediaUrl={step.mediaUrl} mediaType={step.mediaType}>
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        {/* Title */}
        {step.title && (
          <h2 className="text-2xl font-bold mb-4">{step.title}</h2>
        )}

        {/* Spinner - responsive sizing */}
        <div className="mb-6">
          <Loader2
            className="h-12 w-12 lg:h-16 lg:w-16 animate-spin"
            style={{ color: buttonBgColor }}
          />
        </div>

        {/* Rotating Message */}
        <p className="text-lg opacity-90 mb-6 min-h-[2em] transition-opacity duration-300">
          {messages[currentMessageIndex]}
        </p>

        {/* Progress Bar - responsive width */}
        <div className="w-[80%] lg:w-[60%] lg:max-w-[400px]">
          <div className="h-2 rounded-full bg-white/20 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-100"
              style={{
                width: `${Math.min(progress, 100)}%`,
                backgroundColor: buttonBgColor,
              }}
            />
          </div>
          <p className="text-xs opacity-60 mt-2">
            {Math.round(progress)}%
          </p>
        </div>

        {/* Description */}
        {step.description && (
          <p className="text-sm opacity-70 mt-6">{step.description}</p>
        )}
      </div>
    </StepLayout>
  );
}
