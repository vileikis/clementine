import type { ExperienceType } from '@clementine/shared'
import {
  typeMetadata,
  type SlotType,
} from '@/domains/experience/shared/types/type-metadata'

/**
 * Slot mode definition
 * - list: Multiple items with drag-to-reorder
 * - single: 0 or 1 item, no reordering
 */
export type SlotMode = 'list' | 'single'

// Re-export SlotType from type-metadata (single source of truth)
export type { SlotType }

/**
 * Slot to type mapping for filtering
 * Derives which experience types are compatible with each slot from typeMetadata
 */
export const SLOT_TYPES: Record<SlotType, ExperienceType[]> = (() => {
  const result: Record<SlotType, ExperienceType[]> = {
    main: [],
    pregate: [],
    preshare: [],
  }
  for (const [type, meta] of Object.entries(typeMetadata)) {
    for (const slot of meta.slotCompatibility) {
      result[slot].push(type as ExperienceType)
    }
  }
  return result
})()
