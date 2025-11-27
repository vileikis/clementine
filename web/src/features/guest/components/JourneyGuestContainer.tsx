"use client";

import { useCallback, useState, useEffect } from "react";
import type { Event } from "@/features/events/types";
import type { Journey } from "@/features/journeys/types";
import type { Step } from "@/features/steps/types";
import type { Experience } from "@/features/experiences/types";
import type { StepInputValue } from "@/features/sessions";
import { EventThemeProvider } from "@/components/providers/EventThemeProvider";
import { ViewportModeProvider } from "@/features/steps/components/preview/ViewportModeContext";
import type { ViewportMode } from "@/features/steps/types/preview.types";
import { useJourneyRuntime } from "../hooks/useJourneyRuntime";
import { JourneyStepRenderer } from "./JourneyStepRenderer";

interface JourneyGuestContainerProps {
  event: Event;
  journey: Journey;
  steps: Step[];
  experiences: Experience[];
}

/**
 * Main orchestrator component for guest journey experience
 *
 * Responsibilities:
 * - Manages journey runtime state (session, step index)
 * - Wraps step renderer with event theme
 * - Handles step navigation and input persistence
 * - Provides loading and error states
 */
export function JourneyGuestContainer({
  event,
  journey,
  steps,
  experiences,
}: JourneyGuestContainerProps) {
  const runtime = useJourneyRuntime(event.id, journey, steps);

  // Responsive viewport mode detection
  const [viewportMode, setViewportMode] = useState<ViewportMode>("mobile");

  useEffect(() => {
    // Desktop breakpoint at 1024px (lg breakpoint)
    const mediaQuery = window.matchMedia("(min-width: 1024px)");

    const updateViewportMode = () => {
      setViewportMode(mediaQuery.matches ? "desktop" : "mobile");
    };

    // Set initial value
    updateViewportMode();

    // Listen for changes
    mediaQuery.addEventListener("change", updateViewportMode);

    return () => {
      mediaQuery.removeEventListener("change", updateViewportMode);
    };
  }, []);

  /**
   * Handle step completion and advance to next step
   */
  const handleStepComplete = useCallback(() => {
    runtime.next();
  }, [runtime]);

  /**
   * Handle input changes and persist to session
   */
  const handleInputChange = useCallback(
    (stepId: string, value: StepInputValue) => {
      runtime.saveInput(stepId, value);
    },
    [runtime]
  );

  // Loading state - session being created
  if (runtime.status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center space-y-4">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-white border-r-transparent"></div>
          <p className="text-white text-lg">Starting your journey...</p>
        </div>
      </div>
    );
  }

  // Error state - session creation failed
  if (runtime.status === "error" || !runtime.sessionId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black px-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="text-6xl">⚠️</div>
          <h2 className="text-2xl font-bold text-white">
            Unable to Start Journey
          </h2>
          <p className="text-gray-300">
            {runtime.error || "An error occurred while starting your journey"}
          </p>
          <button
            onClick={runtime.retry}
            className="px-6 py-3 bg-white text-black rounded-lg hover:bg-gray-100 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // No current step - shouldn't happen but guard against it
  if (!runtime.currentStep) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black px-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="text-6xl">📋</div>
          <h2 className="text-2xl font-bold text-white">
            Journey Complete
          </h2>
          <p className="text-gray-300">
            You&apos;ve reached the end of this journey. Thank you for participating!
          </p>
        </div>
      </div>
    );
  }

  // Ready state - render current step with theme
  return (
    <EventThemeProvider theme={event.theme}>
      <ViewportModeProvider mode={viewportMode}>
        <div
          className="h-screen w-full overflow-hidden"
          style={{
            backgroundColor: event.theme.background.color,
            backgroundImage: event.theme.background.image
              ? `url(${event.theme.background.image})`
              : undefined,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <JourneyStepRenderer
            step={runtime.currentStep}
            experiences={experiences}
            sessionId={runtime.sessionId}
            eventId={event.id}
            onStepComplete={handleStepComplete}
            onInputChange={handleInputChange}
          />
        </div>
      </ViewportModeProvider>
    </EventThemeProvider>
  );
}
