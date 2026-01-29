/**
 * Experience Step Schema Tests
 *
 * Tests for step name validation rules:
 * - Required (no empty strings after trim)
 * - Regex validation (alphanumeric, spaces, hyphens, underscores only)
 * - Max length (50 characters)
 * - Trim whitespace
 */
import { describe, expect, it } from 'vitest'
import { experienceStepNameSchema } from './step.schema'

describe('experienceStepNameSchema', () => {
  describe('required validation', () => {
    it('should reject empty string', () => {
      const result = experienceStepNameSchema.safeParse('')
      expect(result.success).toBe(false)
    })

    it('should reject whitespace-only string', () => {
      const result = experienceStepNameSchema.safeParse('   ')
      expect(result.success).toBe(false)
    })

    it('should reject undefined', () => {
      const result = experienceStepNameSchema.safeParse(undefined)
      expect(result.success).toBe(false)
    })

    it('should reject null', () => {
      const result = experienceStepNameSchema.safeParse(null)
      expect(result.success).toBe(false)
    })
  })

  describe('regex validation', () => {
    it('should accept valid names with letters, numbers, spaces, hyphens, underscores', () => {
      const validNames = [
        'Pet Choice',
        'User Photo',
        'Text Input',
        'Option-Selection',
        'Option_Selection',
        'Option123',
        'a',
        'A-B_C 123',
      ]

      validNames.forEach(name => {
        const result = experienceStepNameSchema.safeParse(name)
        expect(result.success).toBe(true)
      })
    })

    it('should reject special characters', () => {
      const invalidNames = [
        'Pet Choice!',
        'User@Photo',
        'Text#Input',
        'Option$Selection',
        'Option%Selection',
        'Option^Selection',
        'Option&Selection',
        'Option*Selection',
        'Option(Selection',
        'Option)Selection',
        'Option+Selection',
        'Option=Selection',
        'Option[Selection',
        'Option]Selection',
        'Option{Selection',
        'Option}Selection',
        'Option|Selection',
        'Option\\Selection',
        'Option/Selection',
        'Option<Selection',
        'Option>Selection',
        'Option?Selection',
        'Option.Selection',
        'Option,Selection',
        'Option;Selection',
        "Option'Selection",
        'Option"Selection',
        'Option`Selection',
        'Option~Selection',
      ]

      invalidNames.forEach(name => {
        const result = experienceStepNameSchema.safeParse(name)
        expect(result.success).toBe(false)
      })
    })

    it('should reject emoji', () => {
      const result = experienceStepNameSchema.safeParse('Pet Choice 🐶')
      expect(result.success).toBe(false)
    })

    it('should reject unicode characters', () => {
      const result = experienceStepNameSchema.safeParse('Señor Option')
      expect(result.success).toBe(false)
    })
  })

  describe('max length validation', () => {
    it('should accept names up to 50 characters', () => {
      const name50 = 'A'.repeat(50)
      const result = experienceStepNameSchema.safeParse(name50)
      expect(result.success).toBe(true)
    })

    it('should reject names longer than 50 characters', () => {
      const name51 = 'A'.repeat(51)
      const result = experienceStepNameSchema.safeParse(name51)
      expect(result.success).toBe(false)
    })
  })

  describe('trim behavior', () => {
    it('should trim leading whitespace', () => {
      const result = experienceStepNameSchema.safeParse('  Pet Choice')
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toBe('Pet Choice')
      }
    })

    it('should trim trailing whitespace', () => {
      const result = experienceStepNameSchema.safeParse('Pet Choice  ')
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toBe('Pet Choice')
      }
    })

    it('should trim leading and trailing whitespace', () => {
      const result = experienceStepNameSchema.safeParse('  Pet Choice  ')
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toBe('Pet Choice')
      }
    })

    it('should preserve internal spaces', () => {
      const result = experienceStepNameSchema.safeParse('Pet  Choice')
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toBe('Pet  Choice')
      }
    })
  })

  describe('edge cases', () => {
    it('should accept single character', () => {
      const result = experienceStepNameSchema.safeParse('A')
      expect(result.success).toBe(true)
    })

    it('should accept single digit', () => {
      const result = experienceStepNameSchema.safeParse('1')
      expect(result.success).toBe(true)
    })

    it('should accept all hyphens', () => {
      const result = experienceStepNameSchema.safeParse('---')
      expect(result.success).toBe(true)
    })

    it('should accept all underscores', () => {
      const result = experienceStepNameSchema.safeParse('___')
      expect(result.success).toBe(true)
    })

    it('should accept mixed case', () => {
      const result = experienceStepNameSchema.safeParse('PeTChoIcE')
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toBe('PeTChoIcE')
      }
    })
  })
})
