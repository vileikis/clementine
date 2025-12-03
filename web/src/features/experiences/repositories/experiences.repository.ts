// Experience repository - CRUD operations for experiences collection
// Collection path: /experiences/{experienceId}

import { db } from "@/lib/firebase/admin";
import type { Experience } from "../types/experiences.types";
import { experienceSchema } from "../schemas";

/**
 * Helper to get the experiences collection reference
 */
function getExperiencesCollection() {
  return db.collection("experiences");
}

/**
 * Creates a new experience
 */
export async function createExperience(data: {
  companyId: string;
  name: string;
}): Promise<string> {
  const experienceRef = getExperiencesCollection().doc();

  const now = Date.now();
  const experience: Experience = {
    id: experienceRef.id,
    companyId: data.companyId,
    name: data.name,
    description: null,
    stepsOrder: [],
    status: "active",
    deletedAt: null,
    createdAt: now,
    updatedAt: now,
  };

  await experienceRef.set(experience);

  return experienceRef.id;
}

/**
 * Lists all non-deleted experiences for a company, sorted by createdAt descending
 */
export async function listExperiences(companyId: string): Promise<Experience[]> {
  const snapshot = await getExperiencesCollection()
    .where("companyId", "==", companyId)
    .where("status", "==", "active")
    .orderBy("createdAt", "desc")
    .get();

  return snapshot.docs.map((doc) =>
    experienceSchema.parse({ id: doc.id, ...doc.data() })
  );
}

/**
 * Gets a single experience by ID
 * Returns null if experience doesn't exist or is deleted
 */
export async function getExperience(
  experienceId: string
): Promise<Experience | null> {
  const doc = await getExperiencesCollection().doc(experienceId).get();
  if (!doc.exists) return null;

  const data = doc.data();
  if (data?.status === "deleted") return null;

  return experienceSchema.parse({ id: doc.id, ...data });
}

/**
 * Updates an experience
 */
export async function updateExperience(
  experienceId: string,
  updates: {
    name?: string;
    description?: string | null;
  }
): Promise<void> {
  const updateData: Record<string, unknown> = {
    updatedAt: Date.now(),
  };

  if (updates.name !== undefined) {
    updateData.name = updates.name;
  }

  if (updates.description !== undefined) {
    updateData.description = updates.description;
  }

  await getExperiencesCollection().doc(experienceId).update(updateData);
}

/**
 * Soft deletes an experience by setting status to "deleted" and deletedAt timestamp
 */
export async function deleteExperience(experienceId: string): Promise<void> {
  await getExperiencesCollection().doc(experienceId).update({
    status: "deleted",
    deletedAt: Date.now(),
    updatedAt: Date.now(),
  });
}

/**
 * Updates the step order for an experience
 */
export async function updateStepsOrder(
  experienceId: string,
  stepsOrder: string[]
): Promise<void> {
  await getExperiencesCollection().doc(experienceId).update({
    stepsOrder,
    updatedAt: Date.now(),
  });
}

/**
 * Adds a step ID to the end of the steps order
 */
export async function addStepToOrder(
  experienceId: string,
  stepId: string
): Promise<void> {
  const experience = await getExperience(experienceId);
  if (!experience) {
    throw new Error("Experience not found");
  }

  const newOrder = [...experience.stepsOrder, stepId];
  await updateStepsOrder(experienceId, newOrder);
}

/**
 * Removes a step ID from the steps order
 */
export async function removeStepFromOrder(
  experienceId: string,
  stepId: string
): Promise<void> {
  const experience = await getExperience(experienceId);
  if (!experience) {
    throw new Error("Experience not found");
  }

  const newOrder = experience.stepsOrder.filter((id) => id !== stepId);
  await updateStepsOrder(experienceId, newOrder);
}

/**
 * Inserts a step ID after a specific position in the steps order
 */
export async function insertStepAfter(
  experienceId: string,
  newStepId: string,
  afterStepId: string
): Promise<void> {
  const experience = await getExperience(experienceId);
  if (!experience) {
    throw new Error("Experience not found");
  }

  const afterIndex = experience.stepsOrder.indexOf(afterStepId);
  if (afterIndex === -1) {
    // If afterStepId not found, add to end
    await addStepToOrder(experienceId, newStepId);
    return;
  }

  const newOrder = [
    ...experience.stepsOrder.slice(0, afterIndex + 1),
    newStepId,
    ...experience.stepsOrder.slice(afterIndex + 1),
  ];
  await updateStepsOrder(experienceId, newOrder);
}
