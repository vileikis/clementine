"use server";

/**
 * Server Actions: Survey Step CRUD Operations
 *
 * Handles create, update, delete, and reorder operations for survey steps.
 * Part of 001-survey-experience implementation (Phase 2 - Foundational Layer).
 *
 * These actions:
 * - Validate input using Zod schemas
 * - Call repository functions with Firebase Admin SDK
 * - Handle transactions for atomic operations
 * - Revalidate cache after mutations
 */

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  createSurveyStepSchema,
  updateSurveyStepSchema,
  type SurveyStep,
  type CreateSurveyStepData,
  type UpdateSurveyStepData,
} from "../lib/schemas";
import {
  createSurveyStep as createSurveyStepRepository,
  updateSurveyStep as updateSurveyStepRepository,
  deleteSurveyStep as deleteSurveyStepRepository,
  reorderSurveySteps as reorderSurveyStepsRepository,
  getSurveyStep,
} from "../lib/repository";
import type { ActionResponse } from "./types";
import { ErrorCodes } from "./types";
import {
  checkAuth,
  validateEventExists,
  createSuccessResponse,
  createErrorResponse,
} from "./utils";

/**
 * Creates a new survey step for an event.
 *
 * @param eventId - Event ID
 * @param experienceId - Experience ID
 * @param input - Survey step creation data
 * @returns ActionResponse with created step ID or error
 */
export async function createSurveyStepAction(
  eventId: string,
  experienceId: string,
  input: CreateSurveyStepData
): Promise<ActionResponse<{ id: string; step: SurveyStep }>> {
  try {
    // Check authentication
    const authError = await checkAuth();
    if (authError) return authError;

    // Validate input with Zod schema
    const validated = createSurveyStepSchema.parse(input);

    // Check if event exists
    const eventError = await validateEventExists(eventId);
    if (eventError) return eventError;

    // Create survey step using repository
    const stepId = await createSurveyStepRepository(
      eventId,
      experienceId,
      validated
    );

    // Fetch the created step to return full data
    const step = await getSurveyStep(eventId, stepId);
    if (!step) {
      return createErrorResponse(
        ErrorCodes.UNKNOWN_ERROR,
        "Failed to fetch created step"
      );
    }

    // Revalidate the event page
    revalidatePath(`/events/${eventId}`);

    return createSuccessResponse({ id: stepId, step });
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return createErrorResponse(
        ErrorCodes.VALIDATION_ERROR,
        error.issues.map((e) => e.message).join(", ")
      );
    }

    // Handle unknown errors
    return createErrorResponse(
      ErrorCodes.UNKNOWN_ERROR,
      error instanceof Error ? error.message : "Unknown error occurred"
    );
  }
}

/**
 * Updates an existing survey step.
 *
 * @param eventId - Event ID
 * @param stepId - Step ID
 * @param input - Partial survey step fields to update
 * @returns ActionResponse with success or error
 */
export async function updateSurveyStepAction(
  eventId: string,
  stepId: string,
  input: UpdateSurveyStepData
): Promise<ActionResponse<void>> {
  try {
    // Check authentication
    const authError = await checkAuth();
    if (authError) return authError;

    // Validate input with Zod schema
    const validated = updateSurveyStepSchema.parse(input);

    // Check if event exists
    const eventError = await validateEventExists(eventId);
    if (eventError) return eventError;

    // Check if step exists
    const existingStep = await getSurveyStep(eventId, stepId);
    if (!existingStep) {
      return createErrorResponse(
        "STEP_NOT_FOUND",
        `Survey step ${stepId} not found`
      );
    }

    // Update survey step using repository
    await updateSurveyStepRepository(eventId, stepId, validated);

    // Revalidate the event page
    revalidatePath(`/events/${eventId}`);

    return createSuccessResponse(undefined);
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return createErrorResponse(
        ErrorCodes.VALIDATION_ERROR,
        error.issues.map((e) => e.message).join(", ")
      );
    }

    // Handle unknown errors
    return createErrorResponse(
      ErrorCodes.UNKNOWN_ERROR,
      error instanceof Error ? error.message : "Unknown error occurred"
    );
  }
}

/**
 * Deletes a survey step from an event.
 *
 * @param eventId - Event ID
 * @param experienceId - Experience ID
 * @param stepId - Step ID
 * @returns ActionResponse with success or error
 */
export async function deleteSurveyStepAction(
  eventId: string,
  experienceId: string,
  stepId: string
): Promise<ActionResponse<void>> {
  try {
    // Check authentication
    const authError = await checkAuth();
    if (authError) return authError;

    // Check if event exists
    const eventError = await validateEventExists(eventId);
    if (eventError) return eventError;

    // Check if step exists
    const existingStep = await getSurveyStep(eventId, stepId);
    if (!existingStep) {
      return createErrorResponse(
        "STEP_NOT_FOUND",
        `Survey step ${stepId} not found`
      );
    }

    // Delete survey step using repository
    await deleteSurveyStepRepository(eventId, experienceId, stepId);

    // Revalidate the event page
    revalidatePath(`/events/${eventId}`);

    return createSuccessResponse(undefined);
  } catch (error) {
    // Handle unknown errors
    return createErrorResponse(
      ErrorCodes.UNKNOWN_ERROR,
      error instanceof Error ? error.message : "Unknown error occurred"
    );
  }
}

/**
 * Reorders survey steps by updating the stepsOrder array.
 *
 * @param eventId - Event ID
 * @param experienceId - Experience ID
 * @param newStepsOrder - New order of step IDs
 * @returns ActionResponse with success or error
 */
export async function reorderSurveyStepsAction(
  eventId: string,
  experienceId: string,
  newStepsOrder: string[]
): Promise<ActionResponse<void>> {
  try {
    // Check authentication
    const authError = await checkAuth();
    if (authError) return authError;

    // Validate newStepsOrder is a non-empty array of strings
    if (!Array.isArray(newStepsOrder) || newStepsOrder.length === 0) {
      return createErrorResponse(
        ErrorCodes.VALIDATION_ERROR,
        "newStepsOrder must be a non-empty array of step IDs"
      );
    }

    if (newStepsOrder.length > 10) {
      return createErrorResponse(
        ErrorCodes.VALIDATION_ERROR,
        "Maximum 10 steps allowed"
      );
    }

    // Check if event exists
    const eventError = await validateEventExists(eventId);
    if (eventError) return eventError;

    // Reorder survey steps using repository
    await reorderSurveyStepsRepository(eventId, experienceId, newStepsOrder);

    // Revalidate the event page
    revalidatePath(`/events/${eventId}`);

    return createSuccessResponse(undefined);
  } catch (error) {
    // Handle unknown errors
    return createErrorResponse(
      ErrorCodes.UNKNOWN_ERROR,
      error instanceof Error ? error.message : "Unknown error occurred"
    );
  }
}
