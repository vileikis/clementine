// Events repository - CRUD operations for events subcollection

import { db } from "@/lib/firebase/admin";
import type { Event, EventExperienceLink, EventOutro, EventShareOptions } from "../types/event.types";
import { DEFAULT_EVENT_WELCOME } from "../types/event.types";
import { eventSchema, type UpdateEventWelcomeInput, type UpdateEventOutroInput, type UpdateEventOverlayInput } from "../schemas";
import { DEFAULT_EVENT_THEME, DEFAULT_EVENT_EXTRAS, DEFAULT_EVENT_OVERLAY } from "../constants";
import type { ExtraSlot } from "../schemas";

/**
 * Get the events collection reference for a project
 */
function getEventsCollection(projectId: string) {
  return db.collection("projects").doc(projectId).collection("events");
}

/**
 * Create a new event under a project
 */
export async function createEvent(data: {
  projectId: string;
  companyId: string;
  name: string;
}): Promise<string> {
  const eventsRef = getEventsCollection(data.projectId);
  const eventRef = eventsRef.doc();

  const now = Date.now();
  const eventId = eventRef.id;

  const event: Event = {
    id: eventId,
    projectId: data.projectId,
    companyId: data.companyId,
    name: data.name,
    publishStartAt: null,
    publishEndAt: null,
    experiences: [],
    extras: DEFAULT_EVENT_EXTRAS,
    theme: DEFAULT_EVENT_THEME,
    welcome: DEFAULT_EVENT_WELCOME,
    deletedAt: null,
    createdAt: now,
    updatedAt: now,
  };

  await eventRef.set(event);

  return eventId;
}

/**
 * Normalize event data by applying defaults for missing fields (migration support)
 */
function normalizeEvent(data: FirebaseFirestore.DocumentData, docId: string): Event {
  // Apply defaults for optional fields to support migration
  const normalizedData = {
    id: docId,
    ...data,
    welcome: data.welcome ?? DEFAULT_EVENT_WELCOME,
    overlay: data.overlay ? {
      square: data.overlay.square ?? { enabled: false, frameUrl: null },
      story: data.overlay.story ?? { enabled: false, frameUrl: null },
    } : DEFAULT_EVENT_OVERLAY,
  };

  return eventSchema.parse(normalizedData) as Event;
}

/**
 * Get a single event by ID
 */
export async function getEvent(
  projectId: string,
  eventId: string
): Promise<Event | null> {
  const doc = await getEventsCollection(projectId).doc(eventId).get();

  if (!doc.exists) return null;

  const data = doc.data();
  if (!data) return null;

  // Check for soft delete
  if (data.deletedAt) return null;

  return normalizeEvent(data, doc.id);
}

/**
 * List all non-deleted events for a project
 */
export async function listEvents(
  projectId: string,
  options?: { includeDeleted?: boolean }
): Promise<Event[]> {
  let query: FirebaseFirestore.Query<FirebaseFirestore.DocumentData> =
    getEventsCollection(projectId);

  // Sort by createdAt DESC (newest first)
  query = query.orderBy("createdAt", "desc");

  const snapshot = await query.get();

  const events: Event[] = [];

  for (const doc of snapshot.docs) {
    try {
      const parsed = normalizeEvent(doc.data(), doc.id);
      events.push(parsed);
    } catch {
      // Skip invalid documents
    }
  }

  // Filter out deleted events unless includeDeleted is true
  if (!options?.includeDeleted) {
    return events.filter((event) => event.deletedAt === null);
  }

  return events;
}

/**
 * Update event fields (partial update)
 */
export async function updateEvent(
  projectId: string,
  eventId: string,
  data: Partial<Pick<Event, "name" | "publishStartAt" | "publishEndAt">>
): Promise<void> {
  const eventRef = getEventsCollection(projectId).doc(eventId);

  const updateData: Record<string, unknown> = {
    updatedAt: Date.now(),
  };

  if (data.name !== undefined) {
    updateData.name = data.name;
  }
  if (data.publishStartAt !== undefined) {
    updateData.publishStartAt = data.publishStartAt;
  }
  if (data.publishEndAt !== undefined) {
    updateData.publishEndAt = data.publishEndAt;
  }

  await eventRef.update(updateData);
}

/**
 * Update event theme (partial update with dot notation)
 */
export async function updateEventTheme(
  projectId: string,
  eventId: string,
  themeData: {
    fontFamily?: string | null;
    primaryColor?: string;
    text?: {
      color?: string;
      alignment?: "left" | "center" | "right";
    };
    button?: {
      backgroundColor?: string | null;
      textColor?: string;
      radius?: "none" | "sm" | "md" | "full";
    };
    background?: {
      color?: string;
      image?: string | null;
      overlayOpacity?: number;
    };
  }
): Promise<void> {
  const eventRef = getEventsCollection(projectId).doc(eventId);

  const updateData: Record<string, unknown> = {
    updatedAt: Date.now(),
  };

  // Top-level theme fields
  if (themeData.fontFamily !== undefined) {
    updateData["theme.fontFamily"] = themeData.fontFamily;
  }
  if (themeData.primaryColor !== undefined) {
    updateData["theme.primaryColor"] = themeData.primaryColor;
  }

  // Nested text fields
  if (themeData.text) {
    Object.entries(themeData.text).forEach(([key, value]) => {
      if (value !== undefined) {
        updateData[`theme.text.${key}`] = value;
      }
    });
  }

  // Nested button fields
  if (themeData.button) {
    Object.entries(themeData.button).forEach(([key, value]) => {
      if (value !== undefined) {
        updateData[`theme.button.${key}`] = value;
      }
    });
  }

  // Nested background fields
  if (themeData.background) {
    Object.entries(themeData.background).forEach(([key, value]) => {
      if (value !== undefined) {
        updateData[`theme.background.${key}`] = value;
      }
    });
  }

  await eventRef.update(updateData);
}

/**
 * Soft delete an event (set deletedAt timestamp)
 */
export async function softDeleteEvent(
  projectId: string,
  eventId: string
): Promise<void> {
  const eventRef = getEventsCollection(projectId).doc(eventId);

  await eventRef.update({
    deletedAt: Date.now(),
    updatedAt: Date.now(),
  });
}

// ============================================================================
// Experience Array Operations
// ============================================================================

/**
 * Add an experience to the event's experiences array
 * Uses a Firestore transaction to prevent race conditions
 */
export async function addEventExperience(
  projectId: string,
  eventId: string,
  experienceLink: EventExperienceLink
): Promise<void> {
  const eventRef = getEventsCollection(projectId).doc(eventId);

  await db.runTransaction(async (tx) => {
    const doc = await tx.get(eventRef);
    if (!doc.exists) {
      throw new Error("Event not found");
    }

    const data = doc.data();
    const currentExperiences = (data?.experiences || []) as EventExperienceLink[];

    // Check for duplicate
    if (currentExperiences.some((exp) => exp.experienceId === experienceLink.experienceId)) {
      throw new Error("Experience already attached to this event");
    }

    tx.update(eventRef, {
      experiences: [...currentExperiences, experienceLink],
      updatedAt: Date.now(),
    });
  });
}

/**
 * Update an existing experience in the event's experiences array
 * Uses a Firestore transaction to prevent race conditions
 */
export async function updateEventExperience(
  projectId: string,
  eventId: string,
  experienceId: string,
  updates: Partial<Pick<EventExperienceLink, "label" | "enabled">>
): Promise<void> {
  const eventRef = getEventsCollection(projectId).doc(eventId);

  await db.runTransaction(async (tx) => {
    const doc = await tx.get(eventRef);
    if (!doc.exists) {
      throw new Error("Event not found");
    }

    const data = doc.data();
    const currentExperiences = (data?.experiences || []) as EventExperienceLink[];

    // Find and update the experience
    const experienceIndex = currentExperiences.findIndex(
      (exp) => exp.experienceId === experienceId
    );

    if (experienceIndex === -1) {
      throw new Error("Experience not found in event");
    }

    const updatedExperiences = [...currentExperiences];
    updatedExperiences[experienceIndex] = {
      ...updatedExperiences[experienceIndex],
      ...updates,
    };

    tx.update(eventRef, {
      experiences: updatedExperiences,
      updatedAt: Date.now(),
    });
  });
}

/**
 * Remove an experience from the event's experiences array
 * Uses a Firestore transaction to prevent race conditions
 */
export async function removeEventExperience(
  projectId: string,
  eventId: string,
  experienceId: string
): Promise<void> {
  const eventRef = getEventsCollection(projectId).doc(eventId);

  await db.runTransaction(async (tx) => {
    const doc = await tx.get(eventRef);
    if (!doc.exists) {
      throw new Error("Event not found");
    }

    const data = doc.data();
    const currentExperiences = (data?.experiences || []) as EventExperienceLink[];

    // Filter out the experience
    const updatedExperiences = currentExperiences.filter(
      (exp) => exp.experienceId !== experienceId
    );

    tx.update(eventRef, {
      experiences: updatedExperiences,
      updatedAt: Date.now(),
    });
  });
}

// ============================================================================
// Extras Slot Operations
// ============================================================================

/**
 * Set an extra slot (create or replace)
 */
export async function setEventExtra(
  projectId: string,
  eventId: string,
  slot: ExtraSlot,
  experienceLink: EventExperienceLink
): Promise<void> {
  const eventRef = getEventsCollection(projectId).doc(eventId);

  await eventRef.update({
    [`extras.${slot}`]: experienceLink,
    updatedAt: Date.now(),
  });
}

/**
 * Update an existing extra slot's configuration
 * Uses a Firestore transaction to prevent race conditions
 */
export async function updateEventExtra(
  projectId: string,
  eventId: string,
  slot: ExtraSlot,
  updates: Partial<Pick<EventExperienceLink, "label" | "enabled" | "frequency">>
): Promise<void> {
  const eventRef = getEventsCollection(projectId).doc(eventId);

  await db.runTransaction(async (tx) => {
    const doc = await tx.get(eventRef);
    if (!doc.exists) {
      throw new Error("Event not found");
    }

    const data = doc.data();
    const currentExtra = data?.extras?.[slot] as EventExperienceLink | null;

    if (!currentExtra) {
      throw new Error(`Extra slot '${slot}' is empty`);
    }

    // Merge updates with existing slot data
    const updatedExtra = {
      ...currentExtra,
      ...updates,
    };

    tx.update(eventRef, {
      [`extras.${slot}`]: updatedExtra,
      updatedAt: Date.now(),
    });
  });
}

/**
 * Remove an extra from a slot (set to null)
 */
export async function removeEventExtra(
  projectId: string,
  eventId: string,
  slot: ExtraSlot
): Promise<void> {
  const eventRef = getEventsCollection(projectId).doc(eventId);

  await eventRef.update({
    [`extras.${slot}`]: null,
    updatedAt: Date.now(),
  });
}

// ============================================================================
// Welcome Screen Operations
// ============================================================================

/**
 * Update welcome screen configuration (partial update with dot notation)
 */
export async function updateEventWelcome(
  projectId: string,
  eventId: string,
  welcome: UpdateEventWelcomeInput
): Promise<void> {
  const eventRef = getEventsCollection(projectId).doc(eventId);

  // Build dot-notation update object
  const updateData: Record<string, unknown> = {
    updatedAt: Date.now(),
  };

  // Dynamic field mapping (scalable, DRY)
  const fieldMappings: Record<keyof UpdateEventWelcomeInput, string> = {
    title: "welcome.title",
    description: "welcome.description",
    mediaUrl: "welcome.mediaUrl",
    mediaType: "welcome.mediaType",
    layout: "welcome.layout",
  };

  Object.entries(welcome).forEach(([key, value]) => {
    if (value !== undefined && fieldMappings[key as keyof UpdateEventWelcomeInput]) {
      updateData[fieldMappings[key as keyof UpdateEventWelcomeInput]] = value;
    }
  });

  await eventRef.update(updateData);
}

// ============================================================================
// Outro Screen Operations
// ============================================================================

/**
 * Update outro configuration (partial update with dot notation)
 */
export async function updateEventOutro(
  projectId: string,
  eventId: string,
  outro: UpdateEventOutroInput
): Promise<void> {
  const eventRef = getEventsCollection(projectId).doc(eventId);

  // Build dot-notation update object
  const updateData: Record<string, unknown> = {
    updatedAt: Date.now(),
  };

  // Dynamic field mapping (scalable, DRY)
  const fieldMappings: Record<keyof UpdateEventOutroInput, string> = {
    title: "outro.title",
    description: "outro.description",
    ctaLabel: "outro.ctaLabel",
    ctaUrl: "outro.ctaUrl",
  };

  Object.entries(outro).forEach(([key, value]) => {
    if (value !== undefined && fieldMappings[key as keyof UpdateEventOutroInput]) {
      updateData[fieldMappings[key as keyof UpdateEventOutroInput]] = value;
    }
  });

  await eventRef.update(updateData);
}

/**
 * Update share options configuration (partial update with dot notation)
 */
export async function updateEventShareOptions(
  projectId: string,
  eventId: string,
  shareOptions: Partial<EventShareOptions>
): Promise<void> {
  const eventRef = getEventsCollection(projectId).doc(eventId);

  // Build dot-notation update object
  const updateData: Record<string, unknown> = {
    updatedAt: Date.now(),
  };

  // Dynamic field mapping (scalable, DRY)
  const fieldMappings: Record<keyof EventShareOptions, string> = {
    allowDownload: "shareOptions.allowDownload",
    allowSystemShare: "shareOptions.allowSystemShare",
    allowEmail: "shareOptions.allowEmail",
    socials: "shareOptions.socials",
  };

  Object.entries(shareOptions).forEach(([key, value]) => {
    if (value !== undefined && fieldMappings[key as keyof EventShareOptions]) {
      updateData[fieldMappings[key as keyof EventShareOptions]] = value;
    }
  });

  await eventRef.update(updateData);
}

// ============================================================================
// Overlay Configuration Operations
// ============================================================================

/**
 * Update overlay configuration (partial update with dot notation)
 * Supports updating individual aspect ratios without affecting others
 */
export async function updateEventOverlay(
  projectId: string,
  eventId: string,
  data: UpdateEventOverlayInput
): Promise<void> {
  const eventRef = getEventsCollection(projectId).doc(eventId);

  const updateData: Record<string, unknown> = {
    updatedAt: Date.now(),
  };

  // Flattened field mapping for nested structures (clearer than nested loops)
  const fieldMappings: Record<string, string> = {
    "square.enabled": "overlay.square.enabled",
    "square.frameUrl": "overlay.square.frameUrl",
    "story.enabled": "overlay.story.enabled",
    "story.frameUrl": "overlay.story.frameUrl",
  };

  // Map nested fields to Firestore dot notation
  Object.entries(data).forEach(([aspectRatio, aspectData]) => {
    if (aspectData !== undefined) {
      Object.entries(aspectData).forEach(([field, value]) => {
        const mappingKey = `${aspectRatio}.${field}`;
        if (value !== undefined && fieldMappings[mappingKey]) {
          updateData[fieldMappings[mappingKey]] = value;
        }
      });
    }
  });

  await eventRef.update(updateData);
}
