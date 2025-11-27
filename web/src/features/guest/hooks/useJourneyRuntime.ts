"use client";

import { useReducer, useEffect, useCallback, useRef } from "react";
import type { Journey } from "@/features/journeys";
import type { Step } from "@/features/steps";
import type { StepInputValue } from "@/features/sessions";
import {
  startJourneySessionAction,
  advanceStepAction,
  goBackStepAction,
  saveStepDataAction,
} from "@/features/sessions/actions";

/**
 * Journey runtime state interface
 */
export interface JourneyRuntimeState {
  /** Current runtime status */
  status: "loading" | "ready" | "error";
  /** Current step index in journey.stepOrder array */
  currentStepIndex: number;
  /** Session ID for this journey run */
  sessionId: string | null;
  /** Error message if status is 'error' */
  error: string | null;
}

/**
 * Runtime actions for journey state machine
 */
type RuntimeAction =
  | { type: "SESSION_CREATED"; sessionId: string }
  | { type: "ADVANCE"; index: number }
  | { type: "GO_BACK" }
  | { type: "ERROR"; error: string }
  | { type: "RESET" };

/**
 * Reducer for journey runtime state machine
 */
function runtimeReducer(
  state: JourneyRuntimeState,
  action: RuntimeAction
): JourneyRuntimeState {
  switch (action.type) {
    case "SESSION_CREATED":
      return {
        ...state,
        status: "ready",
        sessionId: action.sessionId,
        currentStepIndex: 0,
        error: null,
      };

    case "ADVANCE":
      return {
        ...state,
        currentStepIndex: action.index,
      };

    case "GO_BACK":
      return {
        ...state,
        currentStepIndex: Math.max(0, state.currentStepIndex - 1),
      };

    case "ERROR":
      return {
        ...state,
        status: "error",
        error: action.error,
      };

    case "RESET":
      return {
        status: "loading",
        currentStepIndex: 0,
        sessionId: null,
        error: null,
      };

    default:
      return state;
  }
}

/**
 * Initial state for journey runtime
 */
const initialState: JourneyRuntimeState = {
  status: "loading",
  currentStepIndex: 0,
  sessionId: null,
  error: null,
};

/**
 * Journey runtime hook - manages guest progress through a journey
 *
 * @param eventId - Event identifier
 * @param journey - Journey configuration
 * @param steps - Ordered array of steps in journey
 * @returns Runtime state and navigation functions
 */
export function useJourneyRuntime(
  eventId: string,
  journey: Journey,
  steps: Step[]
) {
  const [state, dispatch] = useReducer(runtimeReducer, initialState);
  const isInitializedRef = useRef(false);

  // Initialize session on mount
  useEffect(() => {
    // Guard: Only initialize once
    if (isInitializedRef.current) {
      return;
    }

    isInitializedRef.current = true;

    const initializeSession = async () => {
      try {
        const result = await startJourneySessionAction(eventId, journey.id);
        dispatch({ type: "SESSION_CREATED", sessionId: result.sessionId });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to start journey";
        dispatch({ type: "ERROR", error: message });
      }
    };

    initializeSession();
  }, [eventId, journey.id]);

  /**
   * Advance to next step in journey
   */
  const next = useCallback(async () => {
    if (!state.sessionId) {
      console.error("[JourneyRuntime] Cannot advance: no session ID");
      return;
    }

    const nextIndex = state.currentStepIndex + 1;

    // Guard: Don't advance past last step
    if (nextIndex >= steps.length) {
      console.warn("[JourneyRuntime] Already at last step");
      return;
    }

    try {
      const result = await advanceStepAction(
        eventId,
        state.sessionId,
        nextIndex
      );

      if (result.success) {
        dispatch({ type: "ADVANCE", index: nextIndex });
      } else {
        console.error("[JourneyRuntime] Advance failed:", result.error);
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to advance step";
      dispatch({ type: "ERROR", error: message });
    }
  }, [eventId, state.sessionId, state.currentStepIndex, steps.length]);

  /**
   * Go back to previous step in journey
   */
  const previous = useCallback(async () => {
    if (!state.sessionId) {
      console.error("[JourneyRuntime] Cannot go back: no session ID");
      return;
    }

    // Guard: Don't go back from first step
    if (state.currentStepIndex === 0) {
      console.warn("[JourneyRuntime] Already at first step");
      return;
    }

    try {
      const result = await goBackStepAction(eventId, state.sessionId);

      if (result.success) {
        dispatch({ type: "GO_BACK" });
      } else {
        console.error("[JourneyRuntime] Go back failed:", result.error);
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to go back";
      dispatch({ type: "ERROR", error: message });
    }
  }, [eventId, state.sessionId, state.currentStepIndex]);

  /**
   * Save input data for a step
   */
  const saveInput = useCallback(
    async (stepId: string, value: StepInputValue) => {
      if (!state.sessionId) {
        console.error("[JourneyRuntime] Cannot save input: no session ID");
        return;
      }

      try {
        await saveStepDataAction(eventId, state.sessionId, stepId, value);
      } catch (error) {
        console.error("[JourneyRuntime] Save input failed:", error);
        // Don't dispatch error for input saves - they're non-critical
      }
    },
    [eventId, state.sessionId]
  );

  /**
   * Retry journey after error
   */
  const retry = useCallback(() => {
    dispatch({ type: "RESET" });
    isInitializedRef.current = false;
  }, []);

  // Derived state
  const currentStep = steps[state.currentStepIndex] ?? null;
  const canGoBack = state.currentStepIndex > 0;
  const canGoNext = state.currentStepIndex < steps.length - 1;
  const isFirstStep = state.currentStepIndex === 0;
  const isLastStep = state.currentStepIndex === steps.length - 1;

  return {
    // State
    status: state.status,
    currentStepIndex: state.currentStepIndex,
    sessionId: state.sessionId,
    error: state.error,
    currentStep,

    // Navigation flags
    canGoBack,
    canGoNext,
    isFirstStep,
    isLastStep,

    // Actions
    next,
    previous,
    saveInput,
    retry,
  };
}
