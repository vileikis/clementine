/**
 * Server Actions Contract: Event Experiences & Extras
 *
 * This file defines the API contract for server actions managing
 * event experiences and extras. It serves as documentation and
 * type reference for implementation.
 *
 * NOTE: This is a contract file, not implementation code.
 * Implementation goes in web/src/features/events/actions/events.actions.ts
 */

import { z } from "zod";

// =============================================================================
// SHARED TYPES
// =============================================================================

/**
 * Standard action response type used across all server actions
 */
export type ActionResponse<T = void> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string } };

/**
 * Error codes used by event experience/extras actions
 */
export type ErrorCode =
  | "PERMISSION_DENIED" // User not authorized
  | "VALIDATION_ERROR" // Input validation failed
  | "PROJECT_NOT_FOUND" // Project doesn't exist
  | "EVENT_NOT_FOUND" // Event doesn't exist
  | "EXPERIENCE_NOT_FOUND" // Experience doesn't exist
  | "DUPLICATE_EXPERIENCE" // Experience already attached
  | "EXTRA_SLOT_EMPTY" // Trying to update/remove empty slot
  | "INTERNAL_ERROR"; // Unexpected error

// =============================================================================
// ZOD SCHEMAS (Input Validation)
// =============================================================================

/**
 * Frequency options for extra slots
 */
export const extraSlotFrequencySchema = z.enum(["always", "once_per_session"]);
export type ExtraSlotFrequency = z.infer<typeof extraSlotFrequencySchema>;

/**
 * Extra slot identifier
 */
export const extraSlotSchema = z.enum(["preEntryGate", "preReward"]);
export type ExtraSlot = z.infer<typeof extraSlotSchema>;

// -----------------------------------------------------------------------------
// Experience Actions Input Schemas
// -----------------------------------------------------------------------------

/**
 * Add experience to event
 * POST-like operation: creates new entry in experiences array
 */
export const addEventExperienceInputSchema = z.object({
  projectId: z.string().min(1, "Project ID is required"),
  eventId: z.string().min(1, "Event ID is required"),
  experienceId: z.string().min(1, "Experience ID is required"),
  label: z.string().max(200).nullable().optional(),
});
export type AddEventExperienceInput = z.infer<
  typeof addEventExperienceInputSchema
>;

/**
 * Update attached experience (label, enabled)
 * PATCH-like operation: partial update of existing entry
 */
export const updateEventExperienceInputSchema = z.object({
  projectId: z.string().min(1, "Project ID is required"),
  eventId: z.string().min(1, "Event ID is required"),
  experienceId: z.string().min(1, "Experience ID is required"),
  label: z.string().max(200).nullable().optional(),
  enabled: z.boolean().optional(),
});
export type UpdateEventExperienceInput = z.infer<
  typeof updateEventExperienceInputSchema
>;

/**
 * Remove experience from event
 * DELETE-like operation: removes entry from experiences array
 */
export const removeEventExperienceInputSchema = z.object({
  projectId: z.string().min(1, "Project ID is required"),
  eventId: z.string().min(1, "Event ID is required"),
  experienceId: z.string().min(1, "Experience ID is required"),
});
export type RemoveEventExperienceInput = z.infer<
  typeof removeEventExperienceInputSchema
>;

// -----------------------------------------------------------------------------
// Extras Actions Input Schemas
// -----------------------------------------------------------------------------

/**
 * Set extra slot (create or replace)
 * PUT-like operation: sets slot to new value
 */
export const setEventExtraInputSchema = z.object({
  projectId: z.string().min(1, "Project ID is required"),
  eventId: z.string().min(1, "Event ID is required"),
  slot: extraSlotSchema,
  experienceId: z.string().min(1, "Experience ID is required"),
  label: z.string().max(200).nullable().optional(),
  enabled: z.boolean().optional().default(true),
  frequency: extraSlotFrequencySchema,
});
export type SetEventExtraInput = z.infer<typeof setEventExtraInputSchema>;

/**
 * Update extra slot (label, enabled, frequency)
 * PATCH-like operation: partial update of existing slot
 */
export const updateEventExtraInputSchema = z.object({
  projectId: z.string().min(1, "Project ID is required"),
  eventId: z.string().min(1, "Event ID is required"),
  slot: extraSlotSchema,
  label: z.string().max(200).nullable().optional(),
  enabled: z.boolean().optional(),
  frequency: extraSlotFrequencySchema.optional(),
});
export type UpdateEventExtraInput = z.infer<typeof updateEventExtraInputSchema>;

/**
 * Remove extra from slot (set to null)
 * DELETE-like operation: clears slot
 */
export const removeEventExtraInputSchema = z.object({
  projectId: z.string().min(1, "Project ID is required"),
  eventId: z.string().min(1, "Event ID is required"),
  slot: extraSlotSchema,
});
export type RemoveEventExtraInput = z.infer<typeof removeEventExtraInputSchema>;

// =============================================================================
// ACTION SIGNATURES
// =============================================================================

/**
 * Experience Management Actions
 */

/**
 * Add an experience to an event's experiences array
 *
 * @param input - Experience to add with optional label
 * @returns Updated event on success, error on failure
 *
 * Validation:
 * - projectId, eventId, experienceId required
 * - Experience must exist in company library
 * - Cannot add duplicate (same experienceId)
 *
 * Side effects:
 * - Revalidates event detail page cache
 */
export declare function addEventExperienceAction(
  input: AddEventExperienceInput
): Promise<ActionResponse<{ eventId: string }>>;

/**
 * Update an attached experience's configuration
 *
 * @param input - Experience ID with fields to update
 * @returns Updated event on success, error on failure
 *
 * Validation:
 * - All IDs required
 * - Experience must be attached to event
 * - At least one field (label or enabled) should be provided
 *
 * Side effects:
 * - Revalidates event detail page cache
 */
export declare function updateEventExperienceAction(
  input: UpdateEventExperienceInput
): Promise<ActionResponse<{ eventId: string }>>;

/**
 * Remove an experience from an event's experiences array
 *
 * @param input - Experience ID to remove
 * @returns Success/failure response
 *
 * Validation:
 * - All IDs required
 * - Experience must be attached to event
 *
 * Side effects:
 * - Revalidates event detail page cache
 */
export declare function removeEventExperienceAction(
  input: RemoveEventExperienceInput
): Promise<ActionResponse<void>>;

/**
 * Extras Management Actions
 */

/**
 * Set an extra slot (create or replace)
 *
 * @param input - Slot to set with experience and configuration
 * @returns Updated event on success, error on failure
 *
 * Validation:
 * - All IDs required
 * - Experience must exist in company library
 * - Frequency is required for extras
 *
 * Behavior:
 * - If slot is empty, creates new entry
 * - If slot has value, replaces entirely
 *
 * Side effects:
 * - Revalidates event detail page cache
 */
export declare function setEventExtraAction(
  input: SetEventExtraInput
): Promise<ActionResponse<{ eventId: string }>>;

/**
 * Update an extra slot's configuration
 *
 * @param input - Slot with fields to update
 * @returns Updated event on success, error on failure
 *
 * Validation:
 * - All IDs required
 * - Slot must have existing value (not null)
 * - At least one field should be provided
 *
 * Side effects:
 * - Revalidates event detail page cache
 */
export declare function updateEventExtraAction(
  input: UpdateEventExtraInput
): Promise<ActionResponse<{ eventId: string }>>;

/**
 * Remove an extra from a slot (set to null)
 *
 * @param input - Slot to clear
 * @returns Success/failure response
 *
 * Validation:
 * - All IDs required
 * - Slot must have existing value (not null)
 *
 * Side effects:
 * - Revalidates event detail page cache
 */
export declare function removeEventExtraAction(
  input: RemoveEventExtraInput
): Promise<ActionResponse<void>>;

// =============================================================================
// USAGE EXAMPLES
// =============================================================================

/*
Example 1: Add experience to event

const result = await addEventExperienceAction({
  projectId: "proj_123",
  eventId: "event_456",
  experienceId: "exp_789",
  label: "Custom Photo Booth Name",
});

if (result.success) {
  toast.success("Experience added!");
} else {
  toast.error(result.error.message);
}
*/

/*
Example 2: Toggle experience enabled state

const result = await updateEventExperienceAction({
  projectId: "proj_123",
  eventId: "event_456",
  experienceId: "exp_789",
  enabled: false, // Disable without removing
});
*/

/*
Example 3: Set pre-entry gate extra

const result = await setEventExtraAction({
  projectId: "proj_123",
  eventId: "event_456",
  slot: "preEntryGate",
  experienceId: "exp_age_verify",
  label: "Age Check",
  frequency: "always",
});
*/

/*
Example 4: Update extra frequency

const result = await updateEventExtraAction({
  projectId: "proj_123",
  eventId: "event_456",
  slot: "preReward",
  frequency: "once_per_session", // Change from "always"
});
*/

/*
Example 5: Remove extra from slot

const result = await removeEventExtraAction({
  projectId: "proj_123",
  eventId: "event_456",
  slot: "preEntryGate",
});
*/
