"use client";

/**
 * Hook: useStepMutations
 *
 * Provides mutation functions for step CRUD operations within experiences.
 * Wraps server actions with loading/error state management.
 */

import { useState, useCallback } from "react";
import { toast } from "sonner";
import {
  createStepAction,
  updateStepAction,
  deleteStepAction,
  reorderStepsAction,
  duplicateStepAction,
} from "@/features/steps/actions";
import type { StepType, StepUpdateInput } from "@/features/steps/types";

interface UseStepMutationsResult {
  createStep: (
    experienceId: string,
    type: StepType
  ) => Promise<{ success: boolean; stepId?: string }>;
  updateStep: (
    experienceId: string,
    stepId: string,
    updates: StepUpdateInput
  ) => Promise<{ success: boolean }>;
  deleteStep: (
    experienceId: string,
    stepId: string
  ) => Promise<{ success: boolean }>;
  reorderSteps: (
    experienceId: string,
    newOrder: string[]
  ) => Promise<{ success: boolean }>;
  duplicateStep: (
    experienceId: string,
    stepId: string
  ) => Promise<{ success: boolean; stepId?: string }>;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  isReordering: boolean;
  isDuplicating: boolean;
}

export function useStepMutations(): UseStepMutationsResult {
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isReordering, setIsReordering] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);

  const createStep = useCallback(
    async (
      experienceId: string,
      type: StepType
    ): Promise<{ success: boolean; stepId?: string }> => {
      setIsCreating(true);
      try {
        const result = await createStepAction({
          experienceId,
          type,
        });

        if (result.success) {
          toast.success("Step created");
          return { success: true, stepId: result.data.stepId };
        } else {
          toast.error(result.error.message);
          return { success: false };
        }
      } catch (err) {
        toast.error("Failed to create step");
        console.error("Create step error:", err);
        return { success: false };
      } finally {
        setIsCreating(false);
      }
    },
    []
  );

  const updateStep = useCallback(
    async (
      experienceId: string,
      stepId: string,
      updates: StepUpdateInput
    ): Promise<{ success: boolean }> => {
      setIsUpdating(true);
      try {
        const result = await updateStepAction(experienceId, stepId, updates);

        if (result.success) {
          return { success: true };
        } else {
          toast.error(result.error.message);
          return { success: false };
        }
      } catch (err) {
        toast.error("Failed to update step");
        console.error("Update step error:", err);
        return { success: false };
      } finally {
        setIsUpdating(false);
      }
    },
    []
  );

  const deleteStep = useCallback(
    async (
      experienceId: string,
      stepId: string
    ): Promise<{ success: boolean }> => {
      setIsDeleting(true);
      try {
        const result = await deleteStepAction(experienceId, stepId);

        if (result.success) {
          toast.success("Step deleted");
          return { success: true };
        } else {
          toast.error(result.error.message);
          return { success: false };
        }
      } catch (err) {
        toast.error("Failed to delete step");
        console.error("Delete step error:", err);
        return { success: false };
      } finally {
        setIsDeleting(false);
      }
    },
    []
  );

  const reorderSteps = useCallback(
    async (
      experienceId: string,
      newOrder: string[]
    ): Promise<{ success: boolean }> => {
      setIsReordering(true);
      try {
        const result = await reorderStepsAction(experienceId, newOrder);

        if (result.success) {
          return { success: true };
        } else {
          toast.error(result.error.message);
          return { success: false };
        }
      } catch (err) {
        toast.error("Failed to reorder steps");
        console.error("Reorder steps error:", err);
        return { success: false };
      } finally {
        setIsReordering(false);
      }
    },
    []
  );

  const duplicateStep = useCallback(
    async (
      experienceId: string,
      stepId: string
    ): Promise<{ success: boolean; stepId?: string }> => {
      setIsDuplicating(true);
      try {
        const result = await duplicateStepAction(experienceId, stepId);

        if (result.success) {
          toast.success("Step duplicated");
          return { success: true, stepId: result.data.stepId };
        } else {
          toast.error(result.error.message);
          return { success: false };
        }
      } catch (err) {
        toast.error("Failed to duplicate step");
        console.error("Duplicate step error:", err);
        return { success: false };
      } finally {
        setIsDuplicating(false);
      }
    },
    []
  );

  return {
    createStep,
    updateStep,
    deleteStep,
    reorderSteps,
    duplicateStep,
    isCreating,
    isUpdating,
    isDeleting,
    isReordering,
    isDuplicating,
  };
}
