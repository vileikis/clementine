"use server";

import { z } from "zod";
import {
  startSession,
  saveCapture,
  getSession,
} from "@/lib/repositories/sessions";
import { uploadInputImage } from "@/lib/storage/upload";
import { revalidatePath } from "next/cache";

export async function startSessionAction(eventId: string) {
  const sessionId = await startSession(eventId);
  return { sessionId };
}

const saveCaptureInput = z.object({
  eventId: z.string(),
  sessionId: z.string(),
});

export async function saveCaptureAction(formData: FormData) {
  const eventId = formData.get("eventId") as string;
  const sessionId = formData.get("sessionId") as string;
  const photo = formData.get("photo") as File;

  const validated = saveCaptureInput.parse({ eventId, sessionId });

  if (!photo) {
    throw new Error("No photo provided");
  }

  const inputImagePath = await uploadInputImage(
    validated.eventId,
    validated.sessionId,
    photo
  );
  await saveCapture(validated.eventId, validated.sessionId, inputImagePath);

  revalidatePath(`/join/${validated.eventId}`);
  return { success: true, inputImagePath };
}

export async function getSessionAction(eventId: string, sessionId: string) {
  return await getSession(eventId, sessionId);
}
