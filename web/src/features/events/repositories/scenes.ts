// Scene repository - CRUD operations for scenes subcollection

import { db } from "@/lib/firebase/admin";
import type { Scene } from "../types/event.types";
import { sceneSchema } from "../lib/schemas";

export async function updateScene(
  eventId: string,
  sceneId: string,
  updates: {
    prompt?: string | null;
    referenceImagePath?: string | null;
  }
): Promise<void> {
  // Validate prompt length
  if (updates.prompt !== undefined && updates.prompt !== null && updates.prompt.length > 600) {
    throw new Error("Prompt must be 600 characters or less");
  }

  await db
    .collection("events")
    .doc(eventId)
    .collection("scenes")
    .doc(sceneId)
    .update({
      ...updates,
      updatedAt: Date.now(),
    });
}

export async function getScene(
  eventId: string,
  sceneId: string
): Promise<Scene | null> {
  const doc = await db
    .collection("events")
    .doc(eventId)
    .collection("scenes")
    .doc(sceneId)
    .get();

  if (!doc.exists) return null;

  return sceneSchema.parse({ id: doc.id, ...doc.data() });
}
