/**
 * Slot Compatibility Validation
 *
 * Validates experience profile compatibility with event slots.
 * Each slot has restrictions on which profiles can be assigned.
 *
 * Slot → Allowed Profiles:
 * - main: freeform, survey
 * - pregate: informational, survey
 * - preshare: informational, survey
 */
import type { ExperienceProfile, ExperienceSlot } from '../shared/schemas'

/**
 * Allowed profiles per slot type
 *
 * This mapping is also defined in slot-validation.ts but duplicated
 * here for the slot-compatibility module's independent API.
 */
export const SLOT_ALLOWED_PROFILES: Record<
  ExperienceSlot,
  ExperienceProfile[]
> = {
  main: ['freeform', 'survey'],
  pregate: ['informational', 'survey'],
  preshare: ['informational', 'survey'],
}

/**
 * Check if a profile is compatible with a slot
 *
 * @param profile - The experience profile to check
 * @param slot - The target slot
 * @returns true if the profile can be assigned to the slot
 *
 * @example
 * ```typescript
 * isProfileCompatibleWithSlot('freeform', 'main') // true
 * isProfileCompatibleWithSlot('freeform', 'pregate') // false
 * isProfileCompatibleWithSlot('survey', 'pregate') // true
 * ```
 */
export function isProfileCompatibleWithSlot(
  profile: ExperienceProfile,
  slot: ExperienceSlot,
): boolean {
  return SLOT_ALLOWED_PROFILES[slot].includes(profile)
}

/**
 * Get all compatible profiles for a slot
 *
 * @param slot - The slot to get compatible profiles for
 * @returns Array of compatible profile types
 *
 * @example
 * ```typescript
 * getCompatibleProfiles('main') // ['freeform', 'survey']
 * getCompatibleProfiles('pregate') // ['informational', 'survey']
 * ```
 */
export function getCompatibleProfiles(
  slot: ExperienceSlot,
): ExperienceProfile[] {
  return SLOT_ALLOWED_PROFILES[slot]
}

/**
 * Get all compatible slots for a profile
 *
 * @param profile - The profile to get compatible slots for
 * @returns Array of compatible slot types
 *
 * @example
 * ```typescript
 * getCompatibleSlots('freeform') // ['main']
 * getCompatibleSlots('survey') // ['main', 'pregate', 'preshare']
 * getCompatibleSlots('informational') // ['pregate', 'preshare']
 * ```
 */
export function getCompatibleSlots(
  profile: ExperienceProfile,
): ExperienceSlot[] {
  const slots: ExperienceSlot[] = []

  for (const [slot, allowedProfiles] of Object.entries(SLOT_ALLOWED_PROFILES)) {
    if (allowedProfiles.includes(profile)) {
      slots.push(slot as ExperienceSlot)
    }
  }

  return slots
}
