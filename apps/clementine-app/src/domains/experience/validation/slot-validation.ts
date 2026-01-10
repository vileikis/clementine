/**
 * Slot-to-profile validation
 *
 * Defines which experience profiles are allowed in each slot.
 */

import type { ExperienceProfile, ExperienceSlot } from '../shared/schemas'

/**
 * Slot-to-profile compatibility mapping
 *
 * Defines which profiles are allowed in each slot:
 * - main: freeform, survey (not informational)
 * - pregate: informational, survey (not freeform)
 * - preshare: informational, survey (not freeform)
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
 * Check if a profile is allowed in a specific slot
 *
 * @param profile - The experience profile to check
 * @param slot - The slot to check against
 * @returns true if the profile is allowed in the slot
 */
export function isProfileAllowedInSlot(
  profile: ExperienceProfile,
  slot: ExperienceSlot,
): boolean {
  return SLOT_ALLOWED_PROFILES[slot].includes(profile)
}
