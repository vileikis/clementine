"use client";

// ============================================================================
// useEngine Hook
// ============================================================================
// Main engine hook providing state management and navigation control.
// Implements engine initialization, step navigation, and lifecycle callbacks.

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import type { Step } from "@/features/steps/types";
import type { StepInputValue, EngineSession } from "@/features/sessions";
import type {
  EngineConfig,
  EngineState,
  EngineStatus,
  EngineActions,
  EngineError,
  StepChangeInfo,
} from "../types";
import { useEngineSession } from "./useEngineSession";

// ============================================================================
// Types
// ============================================================================

export interface UseEngineOptions {
  config: EngineConfig;
}

export interface UseEngineReturn {
  /** Current engine state */
  state: EngineState;

  /** Navigation actions */
  actions: EngineActions;

  /** Current session */
  session: EngineSession;

  /** Whether engine is ready for interaction */
  isReady: boolean;
}

// ============================================================================
// Constants
// ============================================================================

/** Debounce delay for navigation actions in milliseconds */
const NAV_DEBOUNCE_MS = 150;

// ============================================================================
// Hook Implementation
// ============================================================================

export function useEngine({ config }: UseEngineOptions): UseEngineReturn {
  // --- Session Management ---
  const {
    session,
    isLoading: sessionLoading,
    error: sessionError,
    updateData,
    updateStepIndex,
    // setTransformStatus - will be used when real transform is implemented
    reset: resetSession,
  } = useEngineSession({
    mode: config.persistSession ? "persisted" : "ephemeral",
    experienceId: config.experienceId,
    eventId: config.eventId,
    projectId: config.projectId,
    companyId: config.companyId,
    existingSessionId: config.existingSessionId,
  });

  // --- Engine Status ---
  const [status, setStatus] = useState<EngineStatus>("loading");
  const [error, setError] = useState<EngineError | null>(null);
  const [isAutoAdvancing, setIsAutoAdvancing] = useState(false);

  // --- Navigation Debouncing ---
  const lastNavTimeRef = useRef<number>(0);

  // --- Ordered Steps ---
  const orderedSteps = useMemo(() => {
    const stepMap = new Map(config.steps.map((s) => [s.id, s]));
    return config.stepsOrder
      .map((id) => stepMap.get(id))
      .filter((s): s is Step => s !== undefined);
  }, [config.steps, config.stepsOrder]);

  // --- Current Step ---
  const currentStep = useMemo(() => {
    if (session.currentStepIndex < 0 || session.currentStepIndex >= orderedSteps.length) {
      return null;
    }
    return orderedSteps[session.currentStepIndex];
  }, [orderedSteps, session.currentStepIndex]);

  // --- Navigation Flags ---
  const canGoBack = useMemo(() => {
    return config.allowBack && session.currentStepIndex > 0 && !isAutoAdvancing;
  }, [config.allowBack, session.currentStepIndex, isAutoAdvancing]);

  const canGoNext = useMemo(() => {
    return session.currentStepIndex < orderedSteps.length - 1 && !isAutoAdvancing;
  }, [session.currentStepIndex, orderedSteps.length, isAutoAdvancing]);

  const canSkip = useMemo(() => {
    return config.allowSkip && session.currentStepIndex < orderedSteps.length - 1 && !isAutoAdvancing;
  }, [config.allowSkip, session.currentStepIndex, orderedSteps.length, isAutoAdvancing]);

  // --- Check if navigation is allowed (debounce) ---
  const canNavigate = useCallback(() => {
    const now = Date.now();
    if (now - lastNavTimeRef.current < NAV_DEBOUNCE_MS) {
      return false;
    }
    lastNavTimeRef.current = now;
    return true;
  }, []);

  // --- Fire step change callback ---
  const fireStepChange = useCallback(
    (newIndex: number, direction: StepChangeInfo["direction"], previousIndex: number) => {
      const step = orderedSteps[newIndex];
      if (!step || !config.onStepChange) return;

      config.onStepChange({
        index: newIndex,
        step,
        direction,
        previousIndex,
      });
    },
    [orderedSteps, config]
  );

  // --- Navigation Actions ---
  const next = useCallback(() => {
    if (!canNavigate() || isAutoAdvancing) return;

    const previousIndex = session.currentStepIndex;
    const nextIndex = previousIndex + 1;

    // Check if this completes the experience
    if (nextIndex >= orderedSteps.length) {
      setStatus("completed");
      config.onComplete?.(session);
      return;
    }

    updateStepIndex(nextIndex);
    fireStepChange(nextIndex, "forward", previousIndex);
  }, [
    canNavigate,
    isAutoAdvancing,
    session,
    orderedSteps.length,
    updateStepIndex,
    fireStepChange,
    config,
  ]);

  const previous = useCallback(() => {
    if (!canNavigate() || !canGoBack) return;

    const previousIndex = session.currentStepIndex;
    const newIndex = previousIndex - 1;

    updateStepIndex(newIndex);
    fireStepChange(newIndex, "backward", previousIndex);
  }, [canNavigate, canGoBack, session.currentStepIndex, updateStepIndex, fireStepChange]);

  const skip = useCallback(() => {
    if (!canNavigate() || !canSkip) return;

    const previousIndex = session.currentStepIndex;
    const nextIndex = previousIndex + 1;

    if (nextIndex >= orderedSteps.length) {
      setStatus("completed");
      config.onComplete?.(session);
      return;
    }

    updateStepIndex(nextIndex);
    fireStepChange(nextIndex, "skip", previousIndex);
  }, [
    canNavigate,
    canSkip,
    session,
    orderedSteps.length,
    updateStepIndex,
    fireStepChange,
    config,
  ]);

  const restart = useCallback(() => {
    if (!canNavigate()) return;

    const previousIndex = session.currentStepIndex;
    resetSession();
    setStatus("running");
    setError(null);
    setIsAutoAdvancing(false);
    fireStepChange(0, "restart", previousIndex);
  }, [canNavigate, session.currentStepIndex, resetSession, fireStepChange]);

  const goToStep = useCallback(
    (index: number) => {
      // Only allow in debug mode
      if (!config.debugMode) return;
      if (index < 0 || index >= orderedSteps.length) return;
      if (!canNavigate()) return;

      const previousIndex = session.currentStepIndex;
      const direction = index > previousIndex ? "forward" : "backward";

      updateStepIndex(index);
      fireStepChange(index, direction, previousIndex);
    },
    [config.debugMode, orderedSteps.length, canNavigate, session.currentStepIndex, updateStepIndex, fireStepChange]
  );

  const updateInput = useCallback(
    (stepId: string, value: StepInputValue) => {
      updateData(stepId, value);
      config.onDataUpdate?.(session.data);
    },
    [updateData, config, session.data]
  );

  // --- Engine Initialization ---
  // Track if we've started to prevent re-initialization
  const [hasStarted, setHasStarted] = useState(false);

  // Fire callbacks and update status after session is ready
  useEffect(() => {
    // Skip if already started or still loading
    if (hasStarted || sessionLoading) return;

    // Handle session error
    if (sessionError) {
      const timer = setTimeout(() => {
        setHasStarted(true);
        setStatus("error");
        setError(sessionError);
        config.onError?.(sessionError);
      }, 0);
      return () => clearTimeout(timer);
    }

    // Handle empty steps
    if (orderedSteps.length === 0) {
      const timer = setTimeout(() => {
        setHasStarted(true);
        setStatus("completed");
      }, 0);
      return () => clearTimeout(timer);
    }

    // Start the engine
    const timer = setTimeout(() => {
      setHasStarted(true);
      setStatus("running");
      config.onStart?.(session);
    }, 0);
    return () => clearTimeout(timer);
  }, [hasStarted, sessionLoading, sessionError, orderedSteps.length, config, session]);

  // --- Build State Object ---
  const state: EngineState = useMemo(
    () => ({
      status,
      currentStepIndex: session.currentStepIndex,
      currentStep,
      sessionData: session.data,
      transformStatus: session.transformStatus,
      canGoBack,
      canGoNext,
      canSkip,
      isAutoAdvancing,
      error: error ?? undefined,
    }),
    [
      status,
      session.currentStepIndex,
      currentStep,
      session.data,
      session.transformStatus,
      canGoBack,
      canGoNext,
      canSkip,
      isAutoAdvancing,
      error,
    ]
  );

  // --- Build Actions Object ---
  const actions: EngineActions = useMemo(
    () => ({
      next,
      previous,
      skip,
      restart,
      updateInput,
      goToStep,
    }),
    [next, previous, skip, restart, updateInput, goToStep]
  );

  // --- Is Ready Check ---
  const isReady = status === "running" || status === "completed";

  return {
    state,
    actions,
    session,
    isReady,
  };
}
