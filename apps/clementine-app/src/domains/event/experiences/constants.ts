import type { ExperienceProfile } from '@/domains/experience/shared/types'

/**
 * Slot type definition
 * - main: Multiple experiences shown on welcome screen
 * - pregate: Single experience before welcome screen
 * - preshare: Single experience after main, before share screen
 */
export type SlotType = 'main' | 'pregate' | 'preshare'

/**
 * Slot mode definition
 * - list: Multiple items with drag-to-reorder
 * - single: 0 or 1 item, no reordering
 */
export type SlotMode = 'list' | 'single'

/**
 * Slot to profile mapping for filtering
 * Defines which experience profiles are compatible with each slot
 */
export const SLOT_PROFILES: Record<SlotType, ExperienceProfile[]> = {
  main: ['freeform', 'survey'],
  pregate: ['survey', 'story'],
  preshare: ['survey', 'story'],
} as const
