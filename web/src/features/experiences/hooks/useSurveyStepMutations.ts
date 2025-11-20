"use client";

/**
 * Hook: useSurveyStepMutations
 *
 * Provides mutation functions for survey step CRUD operations.
 * Wraps Server Actions with loading/error states.
 * Part of 001-survey-experience implementation (Phase 2 - Foundational Layer).
 */

import { useState, useCallback } from "react";
import {
  createSurveyStepAction,
  updateSurveyStepAction,
  deleteSurveyStepAction,
  reorderSurveyStepsAction,
} from "../actions/survey-steps";
import type { CreateSurveyStepData, UpdateSurveyStepData } from "../lib/schemas";

interface MutationState {
  loading: boolean;
  error: string | null;
}

interface UseSurveyStepMutationsReturn {
  // Create
  createStep: (
    eventId: string,
    experienceId: string,
    data: CreateSurveyStepData
  ) => Promise<{ success: boolean; stepId?: string; error?: string }>;
  createLoading: boolean;
  createError: string | null;

  // Update
  updateStep: (
    eventId: string,
    stepId: string,
    data: UpdateSurveyStepData
  ) => Promise<{ success: boolean; error?: string }>;
  updateLoading: boolean;
  updateError: string | null;

  // Delete
  deleteStep: (
    eventId: string,
    experienceId: string,
    stepId: string
  ) => Promise<{ success: boolean; error?: string }>;
  deleteLoading: boolean;
  deleteError: string | null;

  // Reorder
  reorderSteps: (
    eventId: string,
    experienceId: string,
    newOrder: string[]
  ) => Promise<{ success: boolean; error?: string }>;
  reorderLoading: boolean;
  reorderError: string | null;
}

/**
 * Hook for survey step mutations (create, update, delete, reorder).
 *
 * @returns Object with mutation functions and their loading/error states
 *
 * @example
 * ```tsx
 * const { createStep, createLoading, createError } = useSurveyStepMutations();
 *
 * const handleCreate = async () => {
 *   const result = await createStep(eventId, experienceId, {
 *     type: "short_text",
 *     title: "What's your name?",
 *   });
 *
 *   if (result.success) {
 *     console.log("Created step:", result.stepId);
 *   } else {
 *     console.error("Failed:", result.error);
 *   }
 * };
 * ```
 */
export function useSurveyStepMutations(): UseSurveyStepMutationsReturn {
  const [createState, setCreateState] = useState<MutationState>({
    loading: false,
    error: null,
  });
  const [updateState, setUpdateState] = useState<MutationState>({
    loading: false,
    error: null,
  });
  const [deleteState, setDeleteState] = useState<MutationState>({
    loading: false,
    error: null,
  });
  const [reorderState, setReorderState] = useState<MutationState>({
    loading: false,
    error: null,
  });

  /**
   * Create a new survey step
   */
  const createStep = useCallback(
    async (
      eventId: string,
      experienceId: string,
      data: CreateSurveyStepData
    ) => {
      setCreateState({ loading: true, error: null });

      try {
        const result = await createSurveyStepAction(eventId, experienceId, data);

        if (result.success) {
          setCreateState({ loading: false, error: null });
          return { success: true, stepId: result.data.id };
        } else {
          const errorMessage = result.error.message;
          setCreateState({ loading: false, error: errorMessage });
          return { success: false, error: errorMessage };
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error occurred";
        setCreateState({ loading: false, error: errorMessage });
        return { success: false, error: errorMessage };
      }
    },
    []
  );

  /**
   * Update an existing survey step
   */
  const updateStep = useCallback(
    async (eventId: string, stepId: string, data: UpdateSurveyStepData) => {
      setUpdateState({ loading: true, error: null });

      try {
        const result = await updateSurveyStepAction(eventId, stepId, data);

        if (result.success) {
          setUpdateState({ loading: false, error: null });
          return { success: true };
        } else {
          const errorMessage = result.error.message;
          setUpdateState({ loading: false, error: errorMessage });
          return { success: false, error: errorMessage };
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error occurred";
        setUpdateState({ loading: false, error: errorMessage });
        return { success: false, error: errorMessage };
      }
    },
    []
  );

  /**
   * Delete a survey step
   */
  const deleteStep = useCallback(
    async (eventId: string, experienceId: string, stepId: string) => {
      setDeleteState({ loading: true, error: null });

      try {
        const result = await deleteSurveyStepAction(
          eventId,
          experienceId,
          stepId
        );

        if (result.success) {
          setDeleteState({ loading: false, error: null });
          return { success: true };
        } else {
          const errorMessage = result.error.message;
          setDeleteState({ loading: false, error: errorMessage });
          return { success: false, error: errorMessage };
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error occurred";
        setDeleteState({ loading: false, error: errorMessage });
        return { success: false, error: errorMessage };
      }
    },
    []
  );

  /**
   * Reorder survey steps
   */
  const reorderSteps = useCallback(
    async (eventId: string, experienceId: string, newOrder: string[]) => {
      setReorderState({ loading: true, error: null });

      try {
        const result = await reorderSurveyStepsAction(
          eventId,
          experienceId,
          newOrder
        );

        if (result.success) {
          setReorderState({ loading: false, error: null });
          return { success: true };
        } else {
          const errorMessage = result.error.message;
          setReorderState({ loading: false, error: errorMessage });
          return { success: false, error: errorMessage };
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error occurred";
        setReorderState({ loading: false, error: errorMessage });
        return { success: false, error: errorMessage };
      }
    },
    []
  );

  return {
    createStep,
    createLoading: createState.loading,
    createError: createState.error,

    updateStep,
    updateLoading: updateState.loading,
    updateError: updateState.error,

    deleteStep,
    deleteLoading: deleteState.loading,
    deleteError: deleteState.error,

    reorderSteps,
    reorderLoading: reorderState.loading,
    reorderError: reorderState.error,
  };
}
