// Steps repository - CRUD operations for steps subcollection
// Collection path: /experiences/{experienceId}/steps/{stepId}
//
// Note: Legacy functions with eventId/journeyId are provided for backwards
// compatibility with journeys and sessions modules until they are migrated.

import { db } from "@/lib/firebase/admin";
import type { Step, StepType } from "../types";
import { stepSchema } from "../schemas";
import { STEP_DEFAULTS } from "../constants";

/**
 * Helper to get the steps subcollection reference for an experience
 */
function getStepsCollection(experienceId: string) {
  return db.collection("experiences").doc(experienceId).collection("steps");
}

/**
 * Helper to get the experiences collection reference
 */
function getExperiencesCollection() {
  return db.collection("experiences");
}

// ============================================================================
// Legacy Helpers (for backwards compatibility with journeys/sessions)
// ============================================================================

/**
 * @deprecated Use getStepsCollection instead
 * Helper to get the steps subcollection reference for an event (legacy)
 */
function getLegacyStepsCollection(eventId: string) {
  return db.collection("events").doc(eventId).collection("steps");
}

/**
 * @deprecated Use experiences collection instead
 * Helper to get the journeys subcollection reference for an event (legacy)
 */
function getLegacyJourneysCollection(eventId: string) {
  return db.collection("events").doc(eventId).collection("journeys");
}

// ============================================================================
// Create
// ============================================================================

/**
 * Creates a new step and adds it to the experience's stepsOrder
 * Uses batch writes for atomicity
 */
export async function createStep(data: {
  experienceId: string;
  type: StepType;
  title?: string | null;
  description?: string | null;
  mediaUrl?: string | null;
  ctaLabel?: string | null;
  config?: Record<string, unknown>;
}): Promise<string> {
  const stepRef = getStepsCollection(data.experienceId).doc();
  const defaults = STEP_DEFAULTS[data.type];

  const now = Date.now();
  const step: Record<string, unknown> = {
    id: stepRef.id,
    experienceId: data.experienceId,
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

  // Get current stepsOrder from experience
  const experienceRef = getExperiencesCollection().doc(data.experienceId);
  const experienceDoc = await experienceRef.get();
  const currentOrder = (experienceDoc.data()?.stepsOrder as string[]) || [];
  const newOrder = [...currentOrder, stepRef.id];

  // Use batch write for atomicity
  const batch = db.batch();
  batch.set(stepRef, step);
  batch.update(experienceRef, {
    stepsOrder: newOrder,
    updatedAt: now,
  });

  await batch.commit();

  return stepRef.id;
}

// ============================================================================
// Read
// ============================================================================

/**
 * Lists all steps for an experience, ordered by experience's stepsOrder array
 */
export async function listSteps(experienceId: string): Promise<Step[]> {
  // Get experience to get stepsOrder
  const experienceDoc = await getExperiencesCollection().doc(experienceId).get();
  if (!experienceDoc.exists) {
    return [];
  }

  const stepsOrder = (experienceDoc.data()?.stepsOrder as string[]) || [];
  if (stepsOrder.length === 0) {
    return [];
  }

  // Get all steps for this experience
  const stepsSnapshot = await getStepsCollection(experienceId).get();

  const stepsMap = new Map<string, Step>();
  stepsSnapshot.docs.forEach((doc) => {
    const parsed = stepSchema.safeParse({ id: doc.id, ...doc.data() });
    if (parsed.success) {
      stepsMap.set(doc.id, parsed.data as Step);
    }
  });

  // Return steps in stepsOrder order
  return stepsOrder
    .map((id) => stepsMap.get(id))
    .filter((step): step is Step => step !== undefined);
}

/**
 * Gets a single step by ID
 */
export async function getStep(
  experienceId: string,
  stepId: string
): Promise<Step | null> {
  const doc = await getStepsCollection(experienceId).doc(stepId).get();
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
  experienceId: string,
  stepId: string,
  data: {
    title?: string | null;
    description?: string | null;
    mediaUrl?: string | null;
    mediaType?: string | null;
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
  if (data.mediaType !== undefined) updateData.mediaType = data.mediaType;
  if (data.ctaLabel !== undefined) updateData.ctaLabel = data.ctaLabel;
  if (data.config !== undefined) updateData.config = data.config;

  await getStepsCollection(experienceId).doc(stepId).update(updateData);
}

// ============================================================================
// Delete
// ============================================================================

/**
 * Deletes a step and removes it from the experience's stepsOrder
 * Uses batch writes for atomicity
 */
export async function deleteStep(
  experienceId: string,
  stepId: string
): Promise<void> {
  const now = Date.now();

  // Get current stepsOrder from experience
  const experienceRef = getExperiencesCollection().doc(experienceId);
  const experienceDoc = await experienceRef.get();
  const currentOrder = (experienceDoc.data()?.stepsOrder as string[]) || [];
  const newOrder = currentOrder.filter((id) => id !== stepId);

  // Use batch write for atomicity
  const batch = db.batch();
  const stepRef = getStepsCollection(experienceId).doc(stepId);

  batch.delete(stepRef);
  batch.update(experienceRef, {
    stepsOrder: newOrder,
    updatedAt: now,
  });

  await batch.commit();
}

// ============================================================================
// Reorder
// ============================================================================

/**
 * Updates the stepsOrder array in the experience document
 */
export async function reorderSteps(
  experienceId: string,
  newOrder: string[]
): Promise<void> {
  await getExperiencesCollection().doc(experienceId).update({
    stepsOrder: newOrder,
    updatedAt: Date.now(),
  });
}

// ============================================================================
// Duplicate
// ============================================================================

/**
 * Duplicates a step and adds it after the original in stepsOrder
 * Uses batch writes for atomicity
 */
export async function duplicateStep(
  experienceId: string,
  stepId: string
): Promise<string> {
  // Get the original step
  const originalDoc = await getStepsCollection(experienceId).doc(stepId).get();
  if (!originalDoc.exists) {
    throw new Error("Step not found");
  }

  const originalData = originalDoc.data();
  if (!originalData) {
    throw new Error("Step data not found");
  }

  // Create new step with copied data
  const newStepRef = getStepsCollection(experienceId).doc();
  const now = Date.now();

  const newStep = {
    ...originalData,
    id: newStepRef.id,
    title: `${originalData.title || "Step"} (Copy)`,
    createdAt: now,
    updatedAt: now,
  };

  // Get current stepsOrder and insert after original
  const experienceRef = getExperiencesCollection().doc(experienceId);
  const experienceDoc = await experienceRef.get();
  const currentOrder = (experienceDoc.data()?.stepsOrder as string[]) || [];
  const originalIndex = currentOrder.indexOf(stepId);
  const newOrder = [...currentOrder];
  newOrder.splice(originalIndex + 1, 0, newStepRef.id);

  // Use batch write for atomicity
  const batch = db.batch();
  batch.set(newStepRef, newStep);
  batch.update(experienceRef, {
    stepsOrder: newOrder,
    updatedAt: now,
  });

  await batch.commit();

  return newStepRef.id;
}

// ============================================================================
// Legacy Functions (for backwards compatibility)
// These functions use the old eventId/journeyId pattern and will be removed
// once journeys and sessions modules are migrated to use experiences.
// ============================================================================

/**
 * @deprecated Use listSteps(experienceId) instead
 * Lists all steps for a journey, ordered by journey's stepOrder array
 */
export async function listStepsLegacy(
  eventId: string,
  journeyId: string
): Promise<Step[]> {
  // Get journey to get stepOrder
  const journeyDoc = await getLegacyJourneysCollection(eventId).doc(journeyId).get();
  if (!journeyDoc.exists) {
    return [];
  }

  const stepOrder = (journeyDoc.data()?.stepOrder as string[]) || [];
  if (stepOrder.length === 0) {
    return [];
  }

  // Get all steps for this journey
  const stepsSnapshot = await getLegacyStepsCollection(eventId)
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
 * @deprecated Use createStep(data) with experienceId instead
 * Creates a new step and adds it to the journey's stepOrder
 */
export async function createStepLegacy(data: {
  eventId: string;
  journeyId: string;
  type: StepType;
  title?: string | null;
  description?: string | null;
  mediaUrl?: string | null;
  ctaLabel?: string | null;
  config?: Record<string, unknown>;
}): Promise<string> {
  const stepRef = getLegacyStepsCollection(data.eventId).doc();
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
  const journeyRef = getLegacyJourneysCollection(data.eventId).doc(data.journeyId);
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

/**
 * @deprecated Use getStep(experienceId, stepId) instead
 * Gets a single step by ID
 */
export async function getStepLegacy(
  eventId: string,
  stepId: string
): Promise<Step | null> {
  const doc = await getLegacyStepsCollection(eventId).doc(stepId).get();
  if (!doc.exists) {
    return null;
  }

  const parsed = stepSchema.safeParse({ id: doc.id, ...doc.data() });
  if (!parsed.success) {
    return null;
  }

  return parsed.data as Step;
}

/**
 * @deprecated Use updateStep(experienceId, stepId, data) instead
 * Updates an existing step
 */
export async function updateStepLegacy(
  eventId: string,
  stepId: string,
  data: {
    title?: string | null;
    description?: string | null;
    mediaUrl?: string | null;
    mediaType?: string | null;
    ctaLabel?: string | null;
    config?: Record<string, unknown>;
  }
): Promise<void> {
  const updateData: Record<string, unknown> = {
    updatedAt: Date.now(),
  };

  if (data.title !== undefined) updateData.title = data.title;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.mediaUrl !== undefined) updateData.mediaUrl = data.mediaUrl;
  if (data.mediaType !== undefined) updateData.mediaType = data.mediaType;
  if (data.ctaLabel !== undefined) updateData.ctaLabel = data.ctaLabel;
  if (data.config !== undefined) updateData.config = data.config;

  await getLegacyStepsCollection(eventId).doc(stepId).update(updateData);
}

/**
 * @deprecated Use deleteStep(experienceId, stepId) instead
 * Deletes a step and removes it from the journey's stepOrder
 */
export async function deleteStepLegacy(
  eventId: string,
  stepId: string,
  journeyId: string
): Promise<void> {
  const now = Date.now();

  // Delete the step document
  await getLegacyStepsCollection(eventId).doc(stepId).delete();

  // Remove from journey's stepOrder
  const journeyRef = getLegacyJourneysCollection(eventId).doc(journeyId);
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

/**
 * @deprecated Use reorderSteps(experienceId, newOrder) instead
 * Updates the stepOrder array in the journey document
 */
export async function reorderStepsLegacy(
  eventId: string,
  journeyId: string,
  newOrder: string[]
): Promise<void> {
  await getLegacyJourneysCollection(eventId).doc(journeyId).update({
    stepOrder: newOrder,
    updatedAt: Date.now(),
  });
}

/**
 * @deprecated Use duplicateStep(experienceId, stepId) instead
 * Duplicates a step and adds it after the original in stepOrder
 */
export async function duplicateStepLegacy(
  eventId: string,
  stepId: string
): Promise<string> {
  // Get the original step
  const originalDoc = await getLegacyStepsCollection(eventId).doc(stepId).get();
  if (!originalDoc.exists) {
    throw new Error("Step not found");
  }

  const originalData = originalDoc.data();
  if (!originalData) {
    throw new Error("Step data not found");
  }

  const journeyId = originalData.journeyId as string;

  // Create new step with copied data
  const newStepRef = getLegacyStepsCollection(eventId).doc();
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
  const journeyRef = getLegacyJourneysCollection(eventId).doc(journeyId);
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
