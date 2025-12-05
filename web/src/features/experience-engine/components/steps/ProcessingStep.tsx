"use client";

// ============================================================================
// ProcessingStep Renderer
// ============================================================================
// Renders processing step for Experience Engine.
// Displays loading feedback with rotating messages.
// Auto-advances when transformation completes.

import { useState, useEffect, useCallback } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import { StepLayout } from "@/components/step-primitives";
import { useEventTheme } from "@/components/providers/EventThemeProvider";
import type { StepProcessing } from "@/features/steps/types";
import type { StepRendererProps } from "../../types";

type ProcessingStepProps = StepRendererProps<StepProcessing>;

export function ProcessingStep({
  step,
  transformStatus,
  isInteractive,
  onComplete,
}: ProcessingStepProps) {
  const { buttonBgColor } = useEventTheme();
  const messages = step.config?.messages ?? [
    "Creating your image...",
    "Almost there...",
    "Finishing touches...",
  ];
  const estimatedDuration = step.config?.estimatedDuration ?? 30;

  // Message rotation state
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [hasAutoAdvanced, setHasAutoAdvanced] = useState(false);

  // Track step ID changes to reset state
  const [lastStepId, setLastStepId] = useState(step.id);

  // Memoized auto-advance handler
  const handleAutoAdvance = useCallback(() => {
    if (!hasAutoAdvanced && isInteractive) {
      setHasAutoAdvanced(true);
      onComplete();
    }
  }, [hasAutoAdvanced, isInteractive, onComplete]);

  // Rotate messages every ~3 seconds
  useEffect(() => {
    if (messages.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % messages.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [messages.length]);

  // Simulate progress animation (loops in preview mode)
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        // In real mode, this would be based on actual status
        // For now, loop the progress
        if (prev >= 100) return isInteractive ? 95 : 0;
        return prev + 100 / (estimatedDuration * 10);
      });
    }, 100);

    return () => clearInterval(interval);
  }, [estimatedDuration, isInteractive]);

  // Auto-advance when transformation completes
  useEffect(() => {
    if (transformStatus.status === "complete") {
      const timer = setTimeout(handleAutoAdvance, 0);
      return () => clearTimeout(timer);
    }
  }, [transformStatus.status, handleAutoAdvance]);

  // Reset state when step changes
  useEffect(() => {
    if (lastStepId !== step.id) {
      // Use setTimeout to defer state updates
      const timer = setTimeout(() => {
        setLastStepId(step.id);
        setHasAutoAdvanced(false);
        setCurrentMessageIndex(0);
        setProgress(0);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [step.id, lastStepId]);

  // Error state
  if (transformStatus.status === "error") {
    return (
      <StepLayout mediaUrl={step.mediaUrl} mediaType={step.mediaType}>
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
          <h2 className="text-lg font-semibold mb-2">Transformation Failed</h2>
          <p className="text-sm text-muted-foreground">
            {transformStatus.errorMessage || "An error occurred during processing."}
          </p>
        </div>
      </StepLayout>
    );
  }

  return (
    <StepLayout mediaUrl={step.mediaUrl} mediaType={step.mediaType}>
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        {/* Title */}
        {step.title && <h2 className="text-2xl font-bold mb-4">{step.title}</h2>}

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
          <p className="text-xs opacity-60 mt-2">{Math.round(progress)}%</p>
        </div>

        {/* Description */}
        {step.description && (
          <p className="text-sm opacity-70 mt-6">{step.description}</p>
        )}
      </div>
    </StepLayout>
  );
}
