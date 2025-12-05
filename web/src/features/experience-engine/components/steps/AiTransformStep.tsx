"use client";

// ============================================================================
// AiTransformStep Renderer
// ============================================================================
// Renders AI transform step for Experience Engine.
// Triggers background job and auto-advances.
// Shows brief confirmation UI during trigger.

import { useState, useEffect, useRef, useCallback } from "react";
import { Loader2, CheckCircle, AlertCircle, RefreshCw } from "lucide-react";
import { StepLayout } from "@/components/step-primitives";
import type { StepAiTransform } from "@/features/steps/types";
import type { StepRendererProps } from "../../types";

type AiTransformStepProps = StepRendererProps<StepAiTransform>;

type TriggerStatus = "idle" | "triggering" | "triggered" | "error";

export function AiTransformStep({
  step,
  isInteractive,
  onComplete,
}: AiTransformStepProps) {
  const [status, setStatus] = useState<TriggerStatus>(() =>
    isInteractive ? "triggering" : "idle"
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const hasTriggered = useRef(false);
  const isMounted = useRef(true);

  // Mock trigger function - will be replaced with actual server action
  const triggerTransform = useCallback(async () => {
    if (hasTriggered.current) return;
    hasTriggered.current = true;

    try {
      // TODO: Replace with actual triggerTransformJob server action
      // For now, simulate success after a brief delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      if (!isMounted.current) return;
      setStatus("triggered");

      // Auto-advance after brief confirmation
      setTimeout(() => {
        if (isMounted.current) {
          onComplete();
        }
      }, 500);
    } catch (error) {
      if (!isMounted.current) return;
      setStatus("error");
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to start transformation"
      );
      hasTriggered.current = false; // Allow retry
    }
  }, [onComplete]);

  // Handle retry
  const handleRetry = useCallback(() => {
    hasTriggered.current = false;
    setStatus("triggering");
    setErrorMessage(null);
    triggerTransform();
  }, [triggerTransform]);

  // Track mount state
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Auto-trigger on mount in interactive mode - using microtask to avoid setState in effect
  useEffect(() => {
    if (isInteractive && status === "triggering" && !hasTriggered.current) {
      // Use queueMicrotask to defer the async operation
      queueMicrotask(() => {
        triggerTransform();
      });
    }
  }, [isInteractive, status, triggerTransform]);

  return (
    <StepLayout mediaUrl={step.mediaUrl} mediaType={step.mediaType}>
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        {/* Title */}
        {step.title && <h2 className="text-2xl font-bold mb-4">{step.title}</h2>}

        {/* Status Display */}
        {status === "triggering" && (
          <>
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-sm opacity-80">Starting transformation...</p>
          </>
        )}

        {status === "triggered" && (
          <>
            <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
            <p className="text-sm opacity-80">Transformation started!</p>
          </>
        )}

        {status === "error" && (
          <>
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <p className="text-sm text-destructive mb-4">
              {errorMessage || "Something went wrong"}
            </p>
            <button
              onClick={handleRetry}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </button>
          </>
        )}

        {status === "idle" && !isInteractive && (
          <>
            <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center mb-4">
              <Loader2 className="h-6 w-6 text-primary" />
            </div>
            <p className="text-sm opacity-80">AI Transform Step</p>
            <p className="text-xs opacity-60 mt-2">
              Will trigger transformation in guest flow
            </p>
          </>
        )}

        {/* Description */}
        {step.description && (
          <p className="text-sm opacity-70 mt-4">{step.description}</p>
        )}
      </div>
    </StepLayout>
  );
}
