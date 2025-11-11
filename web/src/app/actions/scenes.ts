"use server"

import { updateScene } from "@/lib/repositories/scenes"
import { uploadReferenceImage, getPublicUrl } from "@/lib/storage/upload"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const updateSceneInput = z.object({
  prompt: z.string().max(600, "Prompt must be 600 characters or less").nullable().optional(),
})

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export async function updateSceneAction(
  eventId: string,
  sceneId: string,
  updates: z.infer<typeof updateSceneInput>
) {
  try {
    const validated = updateSceneInput.parse(updates)
    await updateScene(eventId, sceneId, validated)
    revalidatePath(`/events/${eventId}`)
    return { success: true }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message }
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update scene",
    }
  }
}

export async function uploadReferenceImageAction(
  eventId: string,
  sceneId: string,
  formData: FormData
) {
  try {
    const file = formData.get("file") as File

    if (!file) {
      return { success: false, error: "No file provided" }
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return {
        success: false,
        error: "File size must be less than 10MB",
      }
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return {
        success: false,
        error: "File must be an image",
      }
    }

    const storagePath = await uploadReferenceImage(eventId, file)
    await updateScene(eventId, sceneId, { referenceImagePath: storagePath })

    revalidatePath(`/events/${eventId}`)
    return { success: true, path: storagePath }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to upload image",
    }
  }
}

export async function getImageUrlAction(path: string) {
  try {
    const url = await getPublicUrl(path)
    return { success: true, url }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get image URL",
    }
  }
}
