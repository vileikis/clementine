"use server"

import {
  createEvent,
  getEvent,
  listEvents,
  updateEventBranding,
  updateEventStatus,
  getCurrentScene,
} from "@/lib/repositories/events"
import { getCompany } from "@/lib/repositories/companies"
import { verifyAdminSecret } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const createEventInput = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title too long"),
  brandColor: z.string().regex(/^#[0-9A-F]{6}$/i, "Invalid hex color"),
  showTitleOverlay: z.boolean(),
  companyId: z.string().min(1, "Company is required"),
})

export async function createEventAction(
  input: z.infer<typeof createEventInput>
) {
  // Verify admin authentication
  const auth = await verifyAdminSecret()
  if (!auth.authorized) {
    return { success: false, error: auth.error }
  }

  try {
    const validated = createEventInput.parse(input)

    // Validate company exists
    const company = await getCompany(validated.companyId)
    if (!company) {
      return { success: false, error: "Company not found" }
    }
    if (company.status !== "active") {
      return { success: false, error: "Company is not active" }
    }

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

export async function listEventsAction(filters?: {
  companyId?: string | null;
}) {
  try {
    const events = await listEvents(filters)
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
  // Verify admin authentication
  const auth = await verifyAdminSecret()
  if (!auth.authorized) {
    return { success: false, error: auth.error }
  }

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
  // Verify admin authentication
  const auth = await verifyAdminSecret()
  if (!auth.authorized) {
    return { success: false, error: auth.error }
  }

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
