/**
 * Profile Validation Rules Tests
 *
 * Tests for validateExperienceSteps function and related utilities.
 */
import { describe, expect, it } from 'vitest'
import {
  PROFILE_ALLOWED_STEP_CATEGORIES,
  STEP_TYPE_CATEGORIES,
  getStepCategory,
  validateExperienceSteps,
} from './profile-rules'

describe('STEP_TYPE_CATEGORIES', () => {
  it('should map all info steps correctly', () => {
    expect(STEP_TYPE_CATEGORIES['info']).toBe('info')
  })

  it('should map all input steps correctly', () => {
    expect(STEP_TYPE_CATEGORIES['input.scale']).toBe('input')
    expect(STEP_TYPE_CATEGORIES['input.yesNo']).toBe('input')
    expect(STEP_TYPE_CATEGORIES['input.multiSelect']).toBe('input')
    expect(STEP_TYPE_CATEGORIES['input.shortText']).toBe('input')
    expect(STEP_TYPE_CATEGORIES['input.longText']).toBe('input')
  })

  it('should map all capture steps correctly', () => {
    expect(STEP_TYPE_CATEGORIES['capture.photo']).toBe('capture')
    expect(STEP_TYPE_CATEGORIES['capture.video']).toBe('capture')
    expect(STEP_TYPE_CATEGORIES['capture.gif']).toBe('capture')
  })

  it('should map transform steps correctly', () => {
    expect(STEP_TYPE_CATEGORIES['transform.pipeline']).toBe('transform')
  })

  it('should map share steps correctly', () => {
    expect(STEP_TYPE_CATEGORIES['share']).toBe('share')
  })
})

describe('PROFILE_ALLOWED_STEP_CATEGORIES', () => {
  it('freeform should allow all categories', () => {
    const allowed = PROFILE_ALLOWED_STEP_CATEGORIES['freeform']
    expect(allowed).toContain('info')
    expect(allowed).toContain('input')
    expect(allowed).toContain('capture')
    expect(allowed).toContain('transform')
    expect(allowed).toContain('share')
  })

  it('survey should allow info, input, capture, share but NOT transform', () => {
    const allowed = PROFILE_ALLOWED_STEP_CATEGORIES['survey']
    expect(allowed).toContain('info')
    expect(allowed).toContain('input')
    expect(allowed).toContain('capture')
    expect(allowed).toContain('share')
    expect(allowed).not.toContain('transform')
  })

  it('informational should only allow info', () => {
    const allowed = PROFILE_ALLOWED_STEP_CATEGORIES['informational']
    expect(allowed).toEqual(['info'])
  })
})

describe('getStepCategory', () => {
  it('should return correct category for known step types', () => {
    expect(getStepCategory('info')).toBe('info')
    expect(getStepCategory('input.scale')).toBe('input')
    expect(getStepCategory('capture.photo')).toBe('capture')
    expect(getStepCategory('transform.pipeline')).toBe('transform')
    expect(getStepCategory('share')).toBe('share')
  })

  it('should return undefined for unknown step types', () => {
    expect(getStepCategory('unknown')).toBeUndefined()
    expect(getStepCategory('foo.bar')).toBeUndefined()
  })
})

describe('validateExperienceSteps', () => {
  describe('freeform profile', () => {
    it('should pass with all step types', () => {
      const steps = [
        { id: '1', type: 'info' },
        { id: '2', type: 'input.scale' },
        { id: '3', type: 'capture.photo' },
        { id: '4', type: 'transform.pipeline' },
        { id: '5', type: 'share' },
      ]

      const result = validateExperienceSteps('freeform', steps)
      expect(result.valid).toBe(true)
      expect(result.violations).toEqual([])
    })

    it('should pass with empty steps', () => {
      const result = validateExperienceSteps('freeform', [])
      expect(result.valid).toBe(true)
    })
  })

  describe('survey profile', () => {
    it('should pass with info, input, capture, share steps', () => {
      const steps = [
        { id: '1', type: 'info' },
        { id: '2', type: 'input.yesNo' },
        { id: '3', type: 'capture.video' },
        { id: '4', type: 'share' },
      ]

      const result = validateExperienceSteps('survey', steps)
      expect(result.valid).toBe(true)
      expect(result.violations).toEqual([])
    })

    it('should fail with transform steps', () => {
      const steps = [
        { id: '1', type: 'info' },
        { id: '2', type: 'transform.pipeline' },
      ]

      const result = validateExperienceSteps('survey', steps)
      expect(result.valid).toBe(false)
      expect(result.violations).toHaveLength(1)
      expect(result.violations[0].stepId).toBe('2')
      expect(result.violations[0].stepType).toBe('transform.pipeline')
    })
  })

  describe('informational profile', () => {
    it('should pass with only info steps', () => {
      const steps = [
        { id: '1', type: 'info' },
        { id: '2', type: 'info' },
      ]

      const result = validateExperienceSteps('informational', steps)
      expect(result.valid).toBe(true)
    })

    it('should fail with input steps', () => {
      const steps = [
        { id: '1', type: 'info' },
        { id: '2', type: 'input.scale' },
      ]

      const result = validateExperienceSteps('informational', steps)
      expect(result.valid).toBe(false)
      expect(result.violations).toHaveLength(1)
      expect(result.violations[0].stepType).toBe('input.scale')
    })

    it('should fail with capture steps', () => {
      const steps = [{ id: '1', type: 'capture.photo' }]

      const result = validateExperienceSteps('informational', steps)
      expect(result.valid).toBe(false)
      expect(result.violations[0].stepType).toBe('capture.photo')
    })

    it('should fail with transform steps', () => {
      const steps = [{ id: '1', type: 'transform.pipeline' }]

      const result = validateExperienceSteps('informational', steps)
      expect(result.valid).toBe(false)
    })

    it('should fail with share steps', () => {
      const steps = [{ id: '1', type: 'share' }]

      const result = validateExperienceSteps('informational', steps)
      expect(result.valid).toBe(false)
    })
  })

  describe('unknown step types', () => {
    it('should flag unknown step types as violations', () => {
      const steps = [
        { id: '1', type: 'info' },
        { id: '2', type: 'unknown.type' },
      ]

      const result = validateExperienceSteps('freeform', steps)
      expect(result.valid).toBe(false)
      expect(result.violations).toHaveLength(1)
      expect(result.violations[0].stepId).toBe('2')
      expect(result.violations[0].message).toContain('Unknown step type')
    })
  })

  describe('multiple violations', () => {
    it('should report all violations', () => {
      const steps = [
        { id: '1', type: 'transform.pipeline' },
        { id: '2', type: 'share' },
        { id: '3', type: 'capture.photo' },
      ]

      const result = validateExperienceSteps('informational', steps)
      expect(result.valid).toBe(false)
      // All three should be violations for informational profile
      expect(result.violations).toHaveLength(3)
    })
  })
})
