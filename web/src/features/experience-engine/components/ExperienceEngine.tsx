"use client";

// ============================================================================
// ExperienceEngine Component
// ============================================================================
// Main engine component that powers both Admin Preview and Guest Flow.
// Provides a unified runtime for executing Clementine experiences.

import { Loader2, AlertCircle, RefreshCw, CheckCircle } from "lucide-react";
import type { EngineConfig } from "../types";
import { useEngine } from "../hooks/useEngine";
import { StepRenderer } from "./StepRenderer";
import { cn } from "@/lib/utils";

// ============================================================================
// Types
// ============================================================================

export interface ExperienceEngineProps {
  /** Engine configuration */
  config: EngineConfig;

  /** Optional className for container */
  className?: string;

  /** Optional test ID */
  "data-testid"?: string;
}

// ============================================================================
// Component
// ============================================================================

export function ExperienceEngine({
  config,
  className,
  "data-testid": testId,
}: ExperienceEngineProps) {
  const { state, actions, session } = useEngine({ config });

  // --- Loading State ---
  if (state.status === "loading") {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center h-full min-h-[200px]",
          className
        )}
        data-testid={testId}
      >
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-sm text-muted-foreground">Loading experience...</p>
      </div>
    );
  }

  // --- Error State ---
  if (state.status === "error" && state.error) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center h-full min-h-[200px] p-4",
          className
        )}
        data-testid={testId}
      >
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-lg font-semibold mb-2">Something went wrong</h2>
        <p className="text-sm text-muted-foreground text-center mb-4">
          {state.error.message}
        </p>
        <button
          onClick={actions.restart}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Try Again
        </button>
      </div>
    );
  }

  // --- Completed State ---
  if (state.status === "completed") {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center h-full min-h-[200px] p-4",
          className
        )}
        data-testid={testId}
      >
        <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
        <h2 className="text-lg font-semibold mb-2">Experience Complete</h2>
        <p className="text-sm text-muted-foreground text-center mb-4">
          Thank you for participating!
        </p>
        {config.debugMode && (
          <button
            onClick={actions.restart}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/90 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Restart
          </button>
        )}
      </div>
    );
  }

  // --- Empty Steps (edge case) ---
  if (!state.currentStep) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center h-full min-h-[200px] p-4",
          className
        )}
        data-testid={testId}
      >
        <p className="text-sm text-muted-foreground">No steps to display</p>
      </div>
    );
  }

  // --- Running State (Main Render) ---
  return (
    <div className={cn("flex flex-col h-full", className)} data-testid={testId}>
      {/* Step Content */}
      <div className="flex-1 overflow-auto">
        <StepRenderer
          step={state.currentStep}
          sessionData={session.data}
          transformStatus={session.transformStatus}
          sessionId={session.id}
          onChange={(value) => actions.updateInput(state.currentStep!.id, value)}
          onCtaClick={actions.next}
          onComplete={actions.next}
          onSkip={actions.skip}
          isInteractive={true}
          isLoading={false}
        />
      </div>

      {/* Debug Navigation (only in debug mode) */}
      {config.debugMode && (
        <div className="flex items-center justify-between p-4 border-t bg-muted/50">
          <button
            onClick={actions.previous}
            disabled={!state.canGoBack}
            className="px-3 py-1.5 text-sm rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ← Back
          </button>

          <span className="text-xs text-muted-foreground">
            Step {state.currentStepIndex + 1} of {config.stepsOrder.length}
          </span>

          <div className="flex gap-2">
            {state.canSkip && (
              <button
                onClick={actions.skip}
                className="px-3 py-1.5 text-sm rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/90"
              >
                Skip
              </button>
            )}
            <button
              onClick={actions.next}
              disabled={!state.canGoNext}
              className="px-3 py-1.5 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
