"use client";

// ============================================================================
// useEngineSession Hook
// ============================================================================
// Manages session state for both ephemeral and persisted modes.
// Ephemeral mode: All state in React, no Firestore calls.
// Persisted mode: Syncs to Firestore via server actions (future implementation).

import { useState, useCallback, useMemo } from "react";
import type { StepInputValue, TransformationStatus, EngineSession } from "@/features/sessions";
import type { EngineError } from "../types";

// ============================================================================
// Types
// ============================================================================

export interface UseEngineSessionOptions {
  mode: "ephemeral" | "persisted";
  experienceId: string;
  eventId?: string;
  projectId?: string;
  companyId?: string;
  existingSessionId?: string;
}

export interface UseEngineSessionReturn {
  /** Session object */
  session: EngineSession;

  /** Loading state */
  isLoading: boolean;

  /** Error state */
  error: EngineError | null;

  /** Update input data for a step */
  updateData: (stepId: string, value: StepInputValue) => void;

  /** Update current step index */
  updateStepIndex: (index: number) => void;

  /** Update transformation status */
  setTransformStatus: (status: TransformationStatus) => void;

  /** Reset session to initial state */
  reset: () => void;
}

// ============================================================================
// Initial State Factory
// ============================================================================

function createInitialSession(options: UseEngineSessionOptions): EngineSession {
  const now = Date.now();
  return {
    id: options.existingSessionId || `ephemeral-${crypto.randomUUID()}`,
    experienceId: options.experienceId,
    currentStepIndex: 0,
    data: {},
    transformStatus: { status: "idle" },
    createdAt: now,
    updatedAt: now,
    eventId: options.eventId,
    projectId: options.projectId,
    companyId: options.companyId,
  };
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Hook for managing engine session state.
 * Currently implements ephemeral mode only.
 * Persisted mode will be added in Phase 11.
 */
export function useEngineSession(
  options: UseEngineSessionOptions
): UseEngineSessionReturn {
  const [session, setSession] = useState<EngineSession>(() =>
    createInitialSession(options)
  );
  const [isLoading] = useState(false);
  const [error] = useState<EngineError | null>(null);

  // Update input data for a specific step
  const updateData = useCallback((stepId: string, value: StepInputValue) => {
    setSession((prev) => ({
      ...prev,
      data: {
        ...prev.data,
        [stepId]: value,
      },
      updatedAt: Date.now(),
    }));
  }, []);

  // Update current step index
  const updateStepIndex = useCallback((index: number) => {
    setSession((prev) => ({
      ...prev,
      currentStepIndex: index,
      updatedAt: Date.now(),
    }));
  }, []);

  // Update transformation status
  const setTransformStatus = useCallback((status: TransformationStatus) => {
    setSession((prev) => ({
      ...prev,
      transformStatus: {
        ...status,
        updatedAt: Date.now(),
      },
      updatedAt: Date.now(),
    }));
  }, []);

  // Reset session to initial state
  const reset = useCallback(() => {
    setSession(createInitialSession(options));
  }, [options]);

  return useMemo(
    () => ({
      session,
      isLoading,
      error,
      updateData,
      updateStepIndex,
      setTransformStatus,
      reset,
    }),
    [session, isLoading, error, updateData, updateStepIndex, setTransformStatus, reset]
  );
}
