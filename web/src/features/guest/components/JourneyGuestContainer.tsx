"use client";

import { useCallback, useState, useEffect } from "react";
import { z } from "zod";
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
import { JourneyErrorBoundary } from "./JourneyErrorBoundary";

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
/**
 * Gets the variable name (storage key) for a step
 */
function getStepVariableName(step: Step): string {
  // Steps with config.variable field
  if (
    step.type === "short_text" ||
    step.type === "long_text" ||
    step.type === "email" ||
    step.type === "multiple_choice" ||
    step.type === "yes_no" ||
    step.type === "opinion_scale" ||
    step.type === "experience-picker"
  ) {
    return step.config.variable;
  }
  // Fallback to step ID for steps without variable
  return step.id;
}

/**
 * Validates input value against step requirements
 */
function validateInput(step: Step, value: StepInputValue | undefined): string | null {
  // Email validation
  if (step.type === "email") {
    if (step.config.required && (!value || value.type !== "text" || !value.value)) {
      return "Email is required";
    }
    if (value && value.type === "text" && value.value) {
      const emailSchema = z.string().email();
      const result = emailSchema.safeParse(value.value);
      if (!result.success) {
        return "Please enter a valid email address";
      }
    }
  }

  // Short text validation
  if (step.type === "short_text") {
    if (step.config.required && (!value || value.type !== "text" || !value.value.trim())) {
      return "This field is required";
    }
  }

  // Long text validation
  if (step.type === "long_text") {
    if (step.config.required && (!value || value.type !== "text" || !value.value.trim())) {
      return "This field is required";
    }
  }

  // Multiple choice validation
  if (step.type === "multiple_choice") {
    if (step.config.required && (!value || value.type !== "selection" || !value.selectedId)) {
      return "Please make a selection";
    }
  }

  // Yes/No validation
  if (step.type === "yes_no") {
    if (step.config.required && (!value || value.type !== "boolean")) {
      return "Please make a selection";
    }
  }

  // Opinion scale validation
  if (step.type === "opinion_scale") {
    if (step.config.required && (!value || value.type !== "number")) {
      return "Please select a rating";
    }
  }

  return null;
}

export function JourneyGuestContainer({
  event,
  journey,
  steps,
  experiences,
}: JourneyGuestContainerProps) {
  const runtime = useJourneyRuntime(event.id, journey, steps);

  // Local state to track input values for displaying previous answers
  const [inputValues, setInputValues] = useState<
    Record<string, StepInputValue>
  >({});

  // Draft state for text inputs (not persisted until CTA click)
  const [textDrafts, setTextDrafts] = useState<Record<string, string>>({});

  // Validation errors state
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

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
   * For text inputs, saves draft value first, then validates and advances
   */
  const handleStepComplete = useCallback(() => {
    if (!runtime.currentStep) return;

    // Get the variable name for the current step
    const variableName = getStepVariableName(runtime.currentStep);

    // For text inputs, save draft value to inputValues and Firestore first
    if (
      runtime.currentStep.type === "short_text" ||
      runtime.currentStep.type === "long_text" ||
      runtime.currentStep.type === "email"
    ) {
      const draftValue = textDrafts[variableName] || "";
      const inputValue: StepInputValue = { type: "text", value: draftValue };

      // Save to local state
      setInputValues((prev) => ({ ...prev, [variableName]: inputValue }));

      // Persist to Firestore
      runtime.saveInput(variableName, inputValue);

      // Validate the draft value
      const error = validateInput(runtime.currentStep, inputValue);

      if (error) {
        // Show validation error
        setValidationErrors((prev) => ({
          ...prev,
          [variableName]: error,
        }));
        return;
      }
    } else {
      // For non-text inputs, validate the already-saved value
      const currentValue = inputValues[variableName];
      const error = validateInput(runtime.currentStep, currentValue);

      if (error) {
        // Show validation error
        setValidationErrors((prev) => ({
          ...prev,
          [variableName]: error,
        }));
        return;
      }
    }

    // Clear validation error and advance
    setValidationErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[variableName];
      return newErrors;
    });

    runtime.next();
  }, [runtime, inputValues, textDrafts]);

  /**
   * Handle text input changes (local state only, not persisted until CTA click)
   *
   * @param variableName - The step's variable name
   * @param value - The text value
   */
  const handleTextDraftChange = useCallback(
    (variableName: string, value: string) => {
      // Update draft state only (no Firestore write)
      setTextDrafts((prev) => ({ ...prev, [variableName]: value }));

      // Clear validation error for this variable
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[variableName];
        return newErrors;
      });
    },
    []
  );

  /**
   * Handle input changes for non-text inputs and persist to session immediately
   * Auto-advances for steps without CTA buttons (e.g., yes_no)
   *
   * @param variableName - The step's variable name (from step.config.variable), used as storage key
   * @param value - The input value to store
   */
  const handleInputChange = useCallback(
    (variableName: string, value: StepInputValue) => {
      // Special handling for selected_experience_id - save as plain string
      if (variableName === "selected_experience_id" && value.type === "selection") {
        // Update local state with the wrapped value for consistency
        setInputValues((prev) => ({ ...prev, [variableName]: value }));

        // But persist to Firestore as plain string (schema expects string, not object)
        runtime.saveInput(variableName, { type: "text", value: value.selectedId } as StepInputValue);
        return;
      }

      // Update local state immediately for responsive UI (keyed by variable name)
      setInputValues((prev) => ({ ...prev, [variableName]: value }));

      // Clear validation error for this variable
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[variableName];
        return newErrors;
      });

      // Persist to Firestore (using variable name as key)
      runtime.saveInput(variableName, value);

      // Auto-advance for yes_no steps (no CTA button)
      if (runtime.currentStep?.type === "yes_no" && value.type === "boolean") {
        // Small delay for better UX (user sees their selection before transition)
        setTimeout(() => {
          handleStepComplete();
        }, 300);
      }
    },
    [runtime, handleStepComplete]
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

  // Ready state - render current step with theme and error boundary
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
          <JourneyErrorBoundary
            onRetry={() => window.location.reload()}
            onRestart={() => window.location.reload()}
          >
            <JourneyStepRenderer
              step={runtime.currentStep}
              experiences={experiences}
              sessionId={runtime.sessionId}
              eventId={event.id}
              inputValues={inputValues}
              textDrafts={textDrafts}
              validationErrors={validationErrors}
              onStepComplete={handleStepComplete}
              onInputChange={handleInputChange}
              onTextDraftChange={handleTextDraftChange}
            />
          </JourneyErrorBoundary>
        </div>
      </ViewportModeProvider>
    </EventThemeProvider>
  );
}
