// Experience repository - CRUD operations for experiences subcollection

import { db } from "@/lib/firebase/admin";
import {
  photoExperienceSchema,
  experienceSchema,
  surveyStepSchema,
  type PhotoExperience,
  type Experience,
  type SurveyStep,
  type CreateSurveyStepData,
  type SurveyExperience,
} from "./schemas";
import { FieldValue } from "firebase-admin/firestore";

/**
 * Creates a new experience for an event
 */
export async function createExperience(
  eventId: string,
  data: {
    label: string;
    type: "photo";
    enabled: boolean;
  }
): Promise<string> {
  const experienceRef = db
    .collection("events")
    .doc(eventId)
    .collection("experiences")
    .doc();

  const now = Date.now();

  const experience = {
    id: experienceRef.id,
    eventId,
    label: data.label,
    type: "photo" as const,
    enabled: data.enabled,
    hidden: false,

    // Nested config object
    config: {
      countdown: 3,
      overlayFramePath: null,
    },

    // Nested aiConfig object
    aiConfig: {
      enabled: false,
      model: null,
      prompt: null,
      referenceImagePaths: null,
      aspectRatio: "1:1" as const,
    },

    createdAt: now,
    updatedAt: now,
  };

  await experienceRef.set(experience);

  // Increment experiencesCount on parent event
  await db
    .collection("events")
    .doc(eventId)
    .update({
      experiencesCount: FieldValue.increment(1),
      updatedAt: now,
    });

  return experienceRef.id;
}

/**
 * Updates an existing experience
 */
export async function updateExperience(
  eventId: string,
  experienceId: string,
  data: Partial<PhotoExperience>
): Promise<void> {
  const now = Date.now();

  await db
    .collection("events")
    .doc(eventId)
    .collection("experiences")
    .doc(experienceId)
    .update({
      ...data,
      updatedAt: now,
    });

  // Also update parent event's updatedAt
  await db.collection("events").doc(eventId).update({
    updatedAt: now,
  });
}

/**
 * Deletes an experience
 */
export async function deleteExperience(
  eventId: string,
  experienceId: string
): Promise<void> {
  const now = Date.now();

  await db
    .collection("events")
    .doc(eventId)
    .collection("experiences")
    .doc(experienceId)
    .delete();

  // Decrement experiencesCount on parent event
  await db
    .collection("events")
    .doc(eventId)
    .update({
      experiencesCount: FieldValue.increment(-1),
      updatedAt: now,
    });
}

/**
 * Gets a single experience by ID
 */
export async function getExperience(
  eventId: string,
  experienceId: string
): Promise<Experience | null> {
  const doc = await db
    .collection("events")
    .doc(eventId)
    .collection("experiences")
    .doc(experienceId)
    .get();

  if (!doc.exists) {
    return null;
  }

  return experienceSchema.parse({
    id: doc.id,
    ...doc.data(),
  });
}

/**
 * Lists all experiences for an event
 */
export async function listExperiences(eventId: string): Promise<Experience[]> {
  const snapshot = await db
    .collection("events")
    .doc(eventId)
    .collection("experiences")
    .orderBy("createdAt", "asc")
    .get();

  return snapshot.docs.map((doc) =>
    experienceSchema.parse({
      id: doc.id,
      ...doc.data(),
    })
  );
}

// ============================================================================
// Survey Step Repository Functions
// ============================================================================

/**
 * Creates a new survey step for an event
 * Uses a transaction to atomically:
 * 1. Create the step document
 * 2. Add step ID to the experience's stepsOrder array
 */
export async function createSurveyStep(
  eventId: string,
  experienceId: string,
  data: CreateSurveyStepData
): Promise<string> {
  const stepRef = db.collection("events").doc(eventId).collection("steps").doc();
  const experienceRef = db
    .collection("events")
    .doc(eventId)
    .collection("experiences")
    .doc(experienceId);

  const now = Date.now();

  const step: Omit<SurveyStep, "id" | "eventId" | "createdAt" | "updatedAt"> & {
    id: string;
    eventId: string;
    createdAt: number;
    updatedAt: number;
  } = {
    id: stepRef.id,
    eventId,
    ...data,
    createdAt: now,
    updatedAt: now,
  };

  // Use transaction to ensure atomic updates
  await db.runTransaction(async (transaction) => {
    // Create the step document
    transaction.set(stepRef, step);

    // Add step ID to experience's stepsOrder
    transaction.update(experienceRef, {
      "config.stepsOrder": FieldValue.arrayUnion(stepRef.id),
      updatedAt: now,
    });

    // Update parent event's updatedAt
    transaction.update(db.collection("events").doc(eventId), {
      updatedAt: now,
    });
  });

  return stepRef.id;
}

/**
 * Updates an existing survey step
 */
export async function updateSurveyStep(
  eventId: string,
  stepId: string,
  data: Partial<SurveyStep>
): Promise<void> {
  const now = Date.now();

  await db
    .collection("events")
    .doc(eventId)
    .collection("steps")
    .doc(stepId)
    .update({
      ...data,
      updatedAt: now,
    });

  // Also update parent event's updatedAt
  await db.collection("events").doc(eventId).update({
    updatedAt: now,
  });
}

/**
 * Deletes a survey step
 * Uses a transaction to atomically:
 * 1. Delete the step document
 * 2. Remove step ID from the experience's stepsOrder array
 */
export async function deleteSurveyStep(
  eventId: string,
  experienceId: string,
  stepId: string
): Promise<void> {
  const stepRef = db.collection("events").doc(eventId).collection("steps").doc(stepId);
  const experienceRef = db
    .collection("events")
    .doc(eventId)
    .collection("experiences")
    .doc(experienceId);

  const now = Date.now();

  // Use transaction to ensure atomic updates
  await db.runTransaction(async (transaction) => {
    // Delete the step document
    transaction.delete(stepRef);

    // Remove step ID from experience's stepsOrder
    transaction.update(experienceRef, {
      "config.stepsOrder": FieldValue.arrayRemove(stepId),
      updatedAt: now,
    });

    // Update parent event's updatedAt
    transaction.update(db.collection("events").doc(eventId), {
      updatedAt: now,
    });
  });
}

/**
 * Reorders survey steps by updating the stepsOrder array
 */
export async function reorderSurveySteps(
  eventId: string,
  experienceId: string,
  newStepsOrder: string[]
): Promise<void> {
  const now = Date.now();

  await db
    .collection("events")
    .doc(eventId)
    .collection("experiences")
    .doc(experienceId)
    .update({
      "config.stepsOrder": newStepsOrder,
      updatedAt: now,
    });

  // Also update parent event's updatedAt
  await db.collection("events").doc(eventId).update({
    updatedAt: now,
  });
}

/**
 * Gets a single survey step by ID
 */
export async function getSurveyStep(
  eventId: string,
  stepId: string
): Promise<SurveyStep | null> {
  const doc = await db
    .collection("events")
    .doc(eventId)
    .collection("steps")
    .doc(stepId)
    .get();

  if (!doc.exists) {
    return null;
  }

  return surveyStepSchema.parse({
    id: doc.id,
    ...doc.data(),
  });
}

/**
 * Lists all survey steps for an event
 */
export async function listSurveySteps(eventId: string): Promise<SurveyStep[]> {
  const snapshot = await db
    .collection("events")
    .doc(eventId)
    .collection("steps")
    .orderBy("createdAt", "asc")
    .get();

  return snapshot.docs.map((doc) =>
    surveyStepSchema.parse({
      id: doc.id,
      ...doc.data(),
    })
  );
}
