"use server"

import {
  createEvent,
  getEvent,
  listEvents,
  updateEventBranding,
  updateEventStatus,
  getCurrentScene,
} from "@/lib/repositories/events"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const createEventInput = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title too long"),
  brandColor: z.string().regex(/^#[0-9A-F]{6}$/i, "Invalid hex color"),
  showTitleOverlay: z.boolean(),
})

export async function createEventAction(
  input: z.infer<typeof createEventInput>
) {
  try {
    const validated = createEventInput.parse(input)
    const eventId = await createEvent(validated)
    revalidatePath("/events")
    return { success: true, eventId }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message }
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create event",
    }
  }
}

export async function getEventAction(eventId: string) {
  try {
    const event = await getEvent(eventId)
    if (!event) {
      throw new Error("Event not found")
    }
    return { success: true, event }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch event",
    }
  }
}

export async function listEventsAction() {
  try {
    const events = await listEvents()
    return { success: true, events }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch events",
    }
  }
}

export async function updateEventBrandingAction(
  eventId: string,
  branding: { brandColor?: string; showTitleOverlay?: boolean }
) {
  try {
    await updateEventBranding(eventId, branding)
    revalidatePath(`/events/${eventId}`)
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update branding",
    }
  }
}

export async function getCurrentSceneAction(eventId: string) {
  try {
    const scene = await getCurrentScene(eventId)
    if (!scene) {
      throw new Error("Scene not found")
    }
    return { success: true, scene }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch scene",
    }
  }
}

export async function updateEventStatusAction(
  eventId: string,
  status: "draft" | "live" | "archived"
) {
  try {
    await updateEventStatus(eventId, status)
    revalidatePath("/events")
    revalidatePath(`/events/${eventId}`)
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update status",
    }
  }
}
