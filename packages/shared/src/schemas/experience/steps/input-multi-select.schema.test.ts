/**
 * Experience Input Multi-Select Step Config Schema Tests
 *
 * Tests for MultiSelectOption schema with AI-aware fields:
 * - promptFragment: optional, max 500 characters
 * - promptMedia: optional MediaReference
 */
import { describe, expect, it } from 'vitest'
import { multiSelectOptionSchema } from './input-multi-select.schema'

describe('multiSelectOptionSchema', () => {
  describe('value field', () => {
    it('should accept valid string value', () => {
      const result = multiSelectOptionSchema.safeParse({
        value: 'Cat',
      })
      expect(result.success).toBe(true)
    })

    it('should reject empty value', () => {
      const result = multiSelectOptionSchema.safeParse({
        value: '',
      })
      expect(result.success).toBe(false)
    })

    it('should reject value longer than 100 characters', () => {
      const result = multiSelectOptionSchema.safeParse({
        value: 'A'.repeat(101),
      })
      expect(result.success).toBe(false)
    })

    it('should accept value exactly 100 characters', () => {
      const result = multiSelectOptionSchema.safeParse({
        value: 'A'.repeat(100),
      })
      expect(result.success).toBe(true)
    })
  })

  describe('promptFragment field', () => {
    it('should be optional', () => {
      const result = multiSelectOptionSchema.safeParse({
        value: 'Cat',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.promptFragment).toBeNull()
      }
    })

    it('should accept valid prompt fragment', () => {
      const result = multiSelectOptionSchema.safeParse({
        value: 'Cat',
        promptFragment: 'fluffy orange tabby cat with green eyes',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.promptFragment).toBe('fluffy orange tabby cat with green eyes')
      }
    })

    it('should accept empty string', () => {
      const result = multiSelectOptionSchema.safeParse({
        value: 'Cat',
        promptFragment: '',
      })
      expect(result.success).toBe(true)
    })

    it('should accept prompt fragment up to 500 characters', () => {
      const fragment500 = 'A'.repeat(500)
      const result = multiSelectOptionSchema.safeParse({
        value: 'Cat',
        promptFragment: fragment500,
      })
      expect(result.success).toBe(true)
    })

    it('should reject prompt fragment longer than 500 characters', () => {
      const fragment501 = 'A'.repeat(501)
      const result = multiSelectOptionSchema.safeParse({
        value: 'Cat',
        promptFragment: fragment501,
      })
      expect(result.success).toBe(false)
    })

    it('should accept prompt fragment with special characters', () => {
      const result = multiSelectOptionSchema.safeParse({
        value: 'Cat',
        promptFragment: 'A cat with @#$%^&*() special characters!',
      })
      expect(result.success).toBe(true)
    })

    it('should accept prompt fragment with newlines', () => {
      const result = multiSelectOptionSchema.safeParse({
        value: 'Cat',
        promptFragment: 'Line 1\nLine 2\nLine 3',
      })
      expect(result.success).toBe(true)
    })
  })

  describe('promptMedia field', () => {
    it('should be optional', () => {
      const result = multiSelectOptionSchema.safeParse({
        value: 'Cat',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.promptMedia).toBeNull()
      }
    })

    it('should accept valid MediaReference', () => {
      const result = multiSelectOptionSchema.safeParse({
        value: 'Cat',
        promptMedia: {
          mediaAssetId: 'abc-123',
          url: 'https://storage.googleapis.com/example/abc-123.jpg',
          filePath: 'prompt-media/workspace-id/abc-123.jpg',
        },
      })
      expect(result.success).toBe(true)
    })

    it('should accept MediaReference with null filePath', () => {
      const result = multiSelectOptionSchema.safeParse({
        value: 'Cat',
        promptMedia: {
          mediaAssetId: 'abc-123',
          url: 'https://storage.googleapis.com/example/abc-123.jpg',
          filePath: null,
        },
      })
      expect(result.success).toBe(true)
    })

    it('should reject invalid MediaReference (missing mediaAssetId)', () => {
      const result = multiSelectOptionSchema.safeParse({
        value: 'Cat',
        promptMedia: {
          url: 'https://storage.googleapis.com/example/abc-123.jpg',
          filePath: 'prompt-media/workspace-id/abc-123.jpg',
        },
      })
      expect(result.success).toBe(false)
    })

    it('should reject invalid MediaReference (missing url)', () => {
      const result = multiSelectOptionSchema.safeParse({
        value: 'Cat',
        promptMedia: {
          mediaAssetId: 'abc-123',
          filePath: 'prompt-media/workspace-id/abc-123.jpg',
        },
      })
      expect(result.success).toBe(false)
    })

    it('should reject invalid url format', () => {
      const result = multiSelectOptionSchema.safeParse({
        value: 'Cat',
        promptMedia: {
          mediaAssetId: 'abc-123',
          url: 'not-a-url',
          filePath: 'prompt-media/workspace-id/abc-123.jpg',
        },
      })
      expect(result.success).toBe(false)
    })
  })

  describe('combined AI fields', () => {
    it('should accept both promptFragment and promptMedia', () => {
      const result = multiSelectOptionSchema.safeParse({
        value: 'Cat',
        promptFragment: 'fluffy orange tabby cat',
        promptMedia: {
          mediaAssetId: 'abc-123',
          url: 'https://storage.googleapis.com/example/abc-123.jpg',
          filePath: 'prompt-media/workspace-id/abc-123.jpg',
        },
      })
      expect(result.success).toBe(true)
    })

    it('should accept plain option (no AI fields)', () => {
      const result = multiSelectOptionSchema.safeParse({
        value: 'Dog',
      })
      expect(result.success).toBe(true)
    })
  })
})
