"use client";

/**
 * Component: PlaybackMode
 *
 * Full-screen overlay for experience playback. Allows creators to preview
 * the entire experience as guests will experience it.
 *
 * Features:
 * - Step-by-step navigation via PreviewNavigationBar
 * - Viewport mode toggle (mobile/desktop) via ViewSwitcher
 * - Event theme application
 * - Empty experience handling
 */

import { useEffect, useState } from "react";
import { useExperiencePlayback } from "../../hooks/useExperiencePlayback";
import { PreviewNavigationBar } from "./PreviewNavigationBar";
import { PreviewRuntime } from "./PreviewRuntime";
import { StepErrorBoundary } from "./StepErrorBoundary";
import { ViewportSwitcher, type ViewportMode } from "@/features/preview-shell";
import type { PlaybackModeProps } from "../../types/playback.types";

export function PlaybackMode({
  steps,
  theme,
  aiPresets,
  initialViewport = "mobile",
  onExit,
}: PlaybackModeProps) {
  const { state, actions, mockSession } = useExperiencePlayback(onExit);
  const [viewportMode, setViewportMode] = useState<ViewportMode>(initialViewport);

  // Initialize playback when component mounts
  useEffect(() => {
    actions.start(steps);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentStep = state.steps[state.currentIndex];

  return (
    <div
      className="fixed inset-0 z-50 bg-background flex flex-col"
      role="dialog"
      aria-modal="true"
      aria-label="Experience playback"
    >
      {/* Top Bar - ViewSwitcher */}
      <header className="flex items-center justify-between px-4 py-3 border-b bg-background shrink-0">
        <h2 className="text-sm font-semibold">Experience Preview</h2>
        <ViewportSwitcher mode={viewportMode} onChange={setViewportMode} />
      </header>

      {/* Main Content Area - Step Preview */}
      <main className="flex-1 overflow-auto p-6 pb-24 bg-muted/10">
        <div className="flex justify-center h-full">
          {steps.length === 0 ? (
            <EmptyExperienceState />
          ) : currentStep ? (
            <StepErrorBoundary
              key={currentStep.id}
              stepId={currentStep.id}
              stepType={currentStep.type}
            >
              <PreviewRuntime
                step={currentStep}
                theme={theme}
                viewportMode={viewportMode}
                aiPresets={aiPresets}
                mode="playback"
                playbackSession={mockSession.session}
                onInputChange={mockSession.updateInput}
                onCtaClick={actions.next}
                onStepComplete={actions.handleStepComplete}
              />
            </StepErrorBoundary>
          ) : (
            <ExperienceCompleteState />
          )}
        </div>
      </main>

      {/* Bottom Navigation Bar */}
      <PreviewNavigationBar
        currentIndex={state.currentIndex}
        totalSteps={state.steps.length}
        canGoBack={state.canGoBack}
        canGoNext={state.canGoNext}
        isCompleted={state.status === "completed"}
        onBack={actions.previous}
        onNext={actions.next}
        onRestart={actions.restart}
        onExit={actions.exit}
      />
    </div>
  );
}

/**
 * Empty state when experience has no steps
 */
function EmptyExperienceState() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8">
      <p className="text-muted-foreground mb-4">
        This experience has no steps to preview.
      </p>
      <p className="text-sm text-muted-foreground">
        Add steps to the experience, then try again.
      </p>
    </div>
  );
}

/**
 * State shown when experience is complete (after last step)
 */
function ExperienceCompleteState() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8">
      <div className="text-4xl mb-4">🎉</div>
      <p className="text-lg font-medium mb-2">Experience Complete!</p>
      <p className="text-sm text-muted-foreground">
        Use the controls below to restart or exit.
      </p>
    </div>
  );
}
