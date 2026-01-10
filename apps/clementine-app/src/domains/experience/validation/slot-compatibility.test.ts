/**
 * Slot Compatibility Validation Tests
 *
 * Tests for isProfileCompatibleWithSlot and related utilities.
 */
import { describe, expect, it } from 'vitest'
import {
  SLOT_ALLOWED_PROFILES,
  getCompatibleProfiles,
  getCompatibleSlots,
  isProfileCompatibleWithSlot,
} from './slot-compatibility'

describe('SLOT_ALLOWED_PROFILES', () => {
  it('main slot should allow freeform and survey', () => {
    expect(SLOT_ALLOWED_PROFILES['main']).toContain('freeform')
    expect(SLOT_ALLOWED_PROFILES['main']).toContain('survey')
    expect(SLOT_ALLOWED_PROFILES['main']).not.toContain('informational')
  })

  it('pregate slot should allow informational and survey', () => {
    expect(SLOT_ALLOWED_PROFILES['pregate']).toContain('informational')
    expect(SLOT_ALLOWED_PROFILES['pregate']).toContain('survey')
    expect(SLOT_ALLOWED_PROFILES['pregate']).not.toContain('freeform')
  })

  it('preshare slot should allow informational and survey', () => {
    expect(SLOT_ALLOWED_PROFILES['preshare']).toContain('informational')
    expect(SLOT_ALLOWED_PROFILES['preshare']).toContain('survey')
    expect(SLOT_ALLOWED_PROFILES['preshare']).not.toContain('freeform')
  })
})

describe('isProfileCompatibleWithSlot', () => {
  describe('main slot', () => {
    it('should allow freeform profile', () => {
      expect(isProfileCompatibleWithSlot('freeform', 'main')).toBe(true)
    })

    it('should allow survey profile', () => {
      expect(isProfileCompatibleWithSlot('survey', 'main')).toBe(true)
    })

    it('should NOT allow informational profile', () => {
      expect(isProfileCompatibleWithSlot('informational', 'main')).toBe(false)
    })
  })

  describe('pregate slot', () => {
    it('should allow informational profile', () => {
      expect(isProfileCompatibleWithSlot('informational', 'pregate')).toBe(true)
    })

    it('should allow survey profile', () => {
      expect(isProfileCompatibleWithSlot('survey', 'pregate')).toBe(true)
    })

    it('should NOT allow freeform profile', () => {
      expect(isProfileCompatibleWithSlot('freeform', 'pregate')).toBe(false)
    })
  })

  describe('preshare slot', () => {
    it('should allow informational profile', () => {
      expect(isProfileCompatibleWithSlot('informational', 'preshare')).toBe(
        true,
      )
    })

    it('should allow survey profile', () => {
      expect(isProfileCompatibleWithSlot('survey', 'preshare')).toBe(true)
    })

    it('should NOT allow freeform profile', () => {
      expect(isProfileCompatibleWithSlot('freeform', 'preshare')).toBe(false)
    })
  })
})

describe('getCompatibleProfiles', () => {
  it('should return freeform and survey for main slot', () => {
    const profiles = getCompatibleProfiles('main')
    expect(profiles).toEqual(['freeform', 'survey'])
  })

  it('should return informational and survey for pregate slot', () => {
    const profiles = getCompatibleProfiles('pregate')
    expect(profiles).toEqual(['informational', 'survey'])
  })

  it('should return informational and survey for preshare slot', () => {
    const profiles = getCompatibleProfiles('preshare')
    expect(profiles).toEqual(['informational', 'survey'])
  })
})

describe('getCompatibleSlots', () => {
  it('should return only main for freeform profile', () => {
    const slots = getCompatibleSlots('freeform')
    expect(slots).toEqual(['main'])
  })

  it('should return all slots for survey profile', () => {
    const slots = getCompatibleSlots('survey')
    expect(slots).toContain('main')
    expect(slots).toContain('pregate')
    expect(slots).toContain('preshare')
    expect(slots).toHaveLength(3)
  })

  it('should return pregate and preshare for informational profile', () => {
    const slots = getCompatibleSlots('informational')
    expect(slots).not.toContain('main')
    expect(slots).toContain('pregate')
    expect(slots).toContain('preshare')
    expect(slots).toHaveLength(2)
  })
})
