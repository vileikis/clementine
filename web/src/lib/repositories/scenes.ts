// Scene repository - CRUD operations for scenes subcollection

import { db } from "@/lib/firebase/admin";
import type { Scene, EffectType } from "@/lib/types/firestore";
import { sceneSchema } from "@/lib/schemas/firestore";

export async function updateScene(
  eventId: string,
  sceneId: string,
  updates: {
    effect?: EffectType;
    prompt?: string;
    referenceImagePath?: string;
  }
): Promise<void> {
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
