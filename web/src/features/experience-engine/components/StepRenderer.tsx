"use client";

// ============================================================================
// StepRenderer Component
// ============================================================================
// Dispatches to the appropriate step component based on step type.
// Acts as the bridge between the engine and individual step renderers.
// Wraps step in error boundary for graceful error handling.

import { useMemo, useCallback } from "react";
import type { Step } from "@/features/steps/types";
import type { StepInputValue, SessionData, TransformationStatus } from "@/features/sessions";
import { STEP_REGISTRY } from "../lib/step-registry";
import { StepErrorBoundary } from "./StepErrorBoundary";

// ============================================================================
// Types
// ============================================================================

export interface StepRendererProps {
  /** Current step configuration */
  step: Step;

  /** Session data */
  sessionData: SessionData;

  /** Transformation status */
  transformStatus: TransformationStatus;

  /** Session ID (for persisted mode operations) */
  sessionId?: string;

  // --- Handlers ---

  /** Called when step input changes */
  onChange: (value: StepInputValue) => void;

  /** Called when CTA button is clicked */
  onCtaClick: () => void;

  /** Called to trigger auto-advance */
  onComplete: () => void;

  /** Called to skip step (if allowed) */
  onSkip: () => void;

  // --- Flags ---

  /** Whether step is interactive (accepts input) */
  isInteractive: boolean;

  /** Whether step is currently loading */
  isLoading: boolean;

  // --- Error handling ---

  /** Called when step rendering fails */
  onRenderError?: (error: Error, stepId: string) => void;
}

// ============================================================================
// Component
// ============================================================================

export function StepRenderer({
  step,
  sessionData,
  transformStatus,
  sessionId,
  onChange,
  onCtaClick,
  onComplete,
  onSkip,
  isInteractive,
  isLoading,
  onRenderError,
}: StepRendererProps) {
  // Get the current input value for this step
  const currentValue = sessionData[step.id] as StepInputValue | undefined;

  // Get the renderer component for this step type - memoized to avoid lint warnings
  const StepComponent = useMemo(() => {
    const component = STEP_REGISTRY[step.type];
    if (!component) {
      throw new Error(`No component registered for step type: ${step.type}`);
    }
    return component;
  }, [step.type]);

  // Error handler for the error boundary
  const handleError = useCallback(
    (error: Error) => {
      onRenderError?.(error, step.id);
    },
    [onRenderError, step.id]
  );

  return (
    <StepErrorBoundary key={step.id} stepId={step.id} onError={handleError}>
      <StepComponent
        step={step}
        sessionData={sessionData}
        transformStatus={transformStatus}
        currentValue={currentValue}
        sessionId={sessionId}
        onChange={onChange}
        onCtaClick={onCtaClick}
        onComplete={onComplete}
        onSkip={onSkip}
        isInteractive={isInteractive}
        isLoading={isLoading}
      />
    </StepErrorBoundary>
  );
}
