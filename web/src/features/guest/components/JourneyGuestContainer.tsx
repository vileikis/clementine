"use client";

import { useCallback } from "react";
import type { Event } from "@/features/events/types";
import type { Journey } from "@/features/journeys/types";
import type { Step } from "@/features/steps/types";
import type { Experience } from "@/features/experiences/types";
import type { StepInputValue } from "@/features/sessions";
import { EventThemeProvider } from "@/components/providers/EventThemeProvider";
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
      <JourneyStepRenderer
        step={runtime.currentStep}
        experiences={experiences}
        sessionId={runtime.sessionId}
        eventId={event.id}
        onStepComplete={handleStepComplete}
        onInputChange={handleInputChange}
      />
    </EventThemeProvider>
  );
}
