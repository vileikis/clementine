"use client";

/**
 * Component: PlaybackMode
 *
 * Full-screen overlay for journey playback. Allows creators to preview
 * the entire journey as guests will experience it.
 *
 * Features:
 * - Step-by-step navigation via PreviewNavigationBar
 * - Viewport mode toggle (mobile/desktop) via ViewSwitcher
 * - Event theme application
 * - Empty journey handling
 */

import { useEffect, useState } from "react";
import { useJourneyPlayback } from "../../hooks/useJourneyPlayback";
import { PreviewNavigationBar } from "./PreviewNavigationBar";
import { PreviewRuntime } from "./PreviewRuntime";
import { ViewSwitcher } from "./ViewSwitcher";
import type { PlaybackModeProps } from "../../types/playback.types";
import type { ViewportMode } from "../../types/preview.types";

export function PlaybackMode({
  steps,
  theme,
  experiences,
  initialViewport = "mobile",
  onExit,
}: PlaybackModeProps) {
  const { state, actions } = useJourneyPlayback(onExit);
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
      aria-label="Journey playback"
    >
      {/* Top Bar - ViewSwitcher */}
      <header className="flex items-center justify-between px-4 py-3 border-b bg-background shrink-0">
        <h2 className="text-sm font-semibold">Journey Preview</h2>
        <ViewSwitcher mode={viewportMode} onChange={setViewportMode} />
      </header>

      {/* Main Content Area - Step Preview */}
      <main className="flex-1 overflow-auto p-6 pb-24 bg-muted/10">
        <div className="flex justify-center h-full">
          {steps.length === 0 ? (
            <EmptyJourneyState />
          ) : currentStep ? (
            <PreviewRuntime
              step={currentStep}
              theme={theme}
              viewportMode={viewportMode}
              experiences={experiences}
            />
          ) : (
            <JourneyCompleteState />
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
 * Empty state when journey has no steps
 */
function EmptyJourneyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8">
      <p className="text-muted-foreground mb-4">
        This journey has no steps to preview.
      </p>
      <p className="text-sm text-muted-foreground">
        Add steps to the journey, then try again.
      </p>
    </div>
  );
}

/**
 * State shown when journey is complete (after last step)
 */
function JourneyCompleteState() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8">
      <div className="text-4xl mb-4">🎉</div>
      <p className="text-lg font-medium mb-2">Journey Complete!</p>
      <p className="text-sm text-muted-foreground">
        Use the controls below to restart or exit.
      </p>
    </div>
  );
}
