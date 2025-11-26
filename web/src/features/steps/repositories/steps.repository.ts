// Steps repository - CRUD operations for steps subcollection
// Collection path: /events/{eventId}/steps/{stepId}

import { db } from "@/lib/firebase/admin";
import type { Step, StepType } from "../types";
import { stepSchema } from "../schemas";
import { STEP_DEFAULTS } from "../constants";

/**
 * Helper to get the steps subcollection reference for an event
 */
function getStepsCollection(eventId: string) {
  return db.collection("events").doc(eventId).collection("steps");
}

/**
 * Helper to get the journeys subcollection reference for an event
 */
function getJourneysCollection(eventId: string) {
  return db.collection("events").doc(eventId).collection("journeys");
}

// ============================================================================
// Create
// ============================================================================

/**
 * Creates a new step and adds it to the journey's stepOrder
 */
export async function createStep(data: {
  eventId: string;
  journeyId: string;
  type: StepType;
  title?: string | null;
  description?: string | null;
  mediaUrl?: string | null;
  ctaLabel?: string | null;
  config?: Record<string, unknown>;
}): Promise<string> {
  const stepRef = getStepsCollection(data.eventId).doc();
  const defaults = STEP_DEFAULTS[data.type];

  const now = Date.now();
  const step: Record<string, unknown> = {
    id: stepRef.id,
    eventId: data.eventId,
    journeyId: data.journeyId,
    type: data.type,
    title: data.title ?? defaults.title,
    description: data.description ?? null,
    mediaUrl: data.mediaUrl ?? null,
    ctaLabel: data.ctaLabel ?? defaults.ctaLabel,
    createdAt: now,
    updatedAt: now,
  };

  // Add config if the step type has one
  if (defaults.config) {
    step.config = data.config ?? defaults.config;
  }

  // Create step document
  await stepRef.set(step);

  // Add step ID to journey's stepOrder array
  const journeyRef = getJourneysCollection(data.eventId).doc(data.journeyId);
  const journeyDoc = await journeyRef.get();

  if (journeyDoc.exists) {
    const currentOrder = (journeyDoc.data()?.stepOrder as string[]) || [];
    await journeyRef.update({
      stepOrder: [...currentOrder, stepRef.id],
      updatedAt: now,
    });
  }

  return stepRef.id;
}

// ============================================================================
// Read
// ============================================================================

/**
 * Lists all steps for a journey, ordered by journey's stepOrder array
 */
export async function listSteps(
  eventId: string,
  journeyId: string
): Promise<Step[]> {
  // Get journey to get stepOrder
  const journeyDoc = await getJourneysCollection(eventId).doc(journeyId).get();
  if (!journeyDoc.exists) {
    return [];
  }

  const stepOrder = (journeyDoc.data()?.stepOrder as string[]) || [];
  if (stepOrder.length === 0) {
    return [];
  }

  // Get all steps for this journey
  const stepsSnapshot = await getStepsCollection(eventId)
    .where("journeyId", "==", journeyId)
    .get();

  const stepsMap = new Map<string, Step>();
  stepsSnapshot.docs.forEach((doc) => {
    const parsed = stepSchema.safeParse({ id: doc.id, ...doc.data() });
    if (parsed.success) {
      stepsMap.set(doc.id, parsed.data as Step);
    }
  });

  // Return steps in stepOrder order
  return stepOrder
    .map((id) => stepsMap.get(id))
    .filter((step): step is Step => step !== undefined);
}

/**
 * Gets a single step by ID
 */
export async function getStep(
  eventId: string,
  stepId: string
): Promise<Step | null> {
  const doc = await getStepsCollection(eventId).doc(stepId).get();
  if (!doc.exists) {
    return null;
  }

  const parsed = stepSchema.safeParse({ id: doc.id, ...doc.data() });
  if (!parsed.success) {
    return null;
  }

  return parsed.data as Step;
}

// ============================================================================
// Update
// ============================================================================

/**
 * Updates an existing step
 */
export async function updateStep(
  eventId: string,
  stepId: string,
  data: {
    title?: string | null;
    description?: string | null;
    mediaUrl?: string | null;
    ctaLabel?: string | null;
    config?: Record<string, unknown>;
  }
): Promise<void> {
  const updateData: Record<string, unknown> = {
    updatedAt: Date.now(),
  };

  // Only include fields that are explicitly provided
  if (data.title !== undefined) updateData.title = data.title;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.mediaUrl !== undefined) updateData.mediaUrl = data.mediaUrl;
  if (data.ctaLabel !== undefined) updateData.ctaLabel = data.ctaLabel;
  if (data.config !== undefined) updateData.config = data.config;

  await getStepsCollection(eventId).doc(stepId).update(updateData);
}

// ============================================================================
// Delete
// ============================================================================

/**
 * Deletes a step and removes it from the journey's stepOrder
 */
export async function deleteStep(
  eventId: string,
  stepId: string,
  journeyId: string
): Promise<void> {
  const now = Date.now();

  // Delete the step document
  await getStepsCollection(eventId).doc(stepId).delete();

  // Remove from journey's stepOrder
  const journeyRef = getJourneysCollection(eventId).doc(journeyId);
  const journeyDoc = await journeyRef.get();

  if (journeyDoc.exists) {
    const currentOrder = (journeyDoc.data()?.stepOrder as string[]) || [];
    const newOrder = currentOrder.filter((id) => id !== stepId);
    await journeyRef.update({
      stepOrder: newOrder,
      updatedAt: now,
    });
  }
}

// ============================================================================
// Reorder
// ============================================================================

/**
 * Updates the stepOrder array in the journey document
 */
export async function reorderSteps(
  eventId: string,
  journeyId: string,
  newOrder: string[]
): Promise<void> {
  await getJourneysCollection(eventId).doc(journeyId).update({
    stepOrder: newOrder,
    updatedAt: Date.now(),
  });
}

// ============================================================================
// Duplicate
// ============================================================================

/**
 * Duplicates a step and adds it after the original in stepOrder
 */
export async function duplicateStep(
  eventId: string,
  stepId: string
): Promise<string> {
  // Get the original step
  const originalDoc = await getStepsCollection(eventId).doc(stepId).get();
  if (!originalDoc.exists) {
    throw new Error("Step not found");
  }

  const originalData = originalDoc.data();
  if (!originalData) {
    throw new Error("Step data not found");
  }

  const journeyId = originalData.journeyId as string;

  // Create new step with copied data
  const newStepRef = getStepsCollection(eventId).doc();
  const now = Date.now();

  const newStep = {
    ...originalData,
    id: newStepRef.id,
    title: `${originalData.title || "Step"} (Copy)`,
    createdAt: now,
    updatedAt: now,
  };

  await newStepRef.set(newStep);

  // Insert after original in stepOrder
  const journeyRef = getJourneysCollection(eventId).doc(journeyId);
  const journeyDoc = await journeyRef.get();

  if (journeyDoc.exists) {
    const currentOrder = (journeyDoc.data()?.stepOrder as string[]) || [];
    const originalIndex = currentOrder.indexOf(stepId);
    const newOrder = [...currentOrder];
    newOrder.splice(originalIndex + 1, 0, newStepRef.id);

    await journeyRef.update({
      stepOrder: newOrder,
      updatedAt: now,
    });
  }

  return newStepRef.id;
}
