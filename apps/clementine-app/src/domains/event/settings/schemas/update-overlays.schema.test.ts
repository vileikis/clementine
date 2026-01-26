/**
 * Unit tests for Update Overlays Schema
 *
 * Tests validation rules for partial overlay updates.
 */
import { describe, expect, it } from 'vitest'
import { updateOverlaysConfigSchema } from './update-overlays.schema'
import { overlayReferenceSchema } from '@/domains/event/shared'

describe('updateOverlaysConfigSchema', () => {
  describe('valid partial updates', () => {
    it('should accept update with only 1:1 aspect ratio', () => {
      const update = {
        '1:1': {
          mediaAssetId: 'asset-123',
          url: 'https://storage.googleapis.com/square.png',
        },
      }

      const result = updateOverlaysConfigSchema.parse(update)

      expect(result['1:1']).toEqual({
        mediaAssetId: 'asset-123',
        url: 'https://storage.googleapis.com/square.png',
        filePath: null,
      })
    })

    it('should accept update with only 9:16 aspect ratio', () => {
      const update = {
        '9:16': {
          mediaAssetId: 'asset-456',
          url: 'https://storage.googleapis.com/portrait.png',
        },
      }

      const result = updateOverlaysConfigSchema.parse(update)

      expect(result['9:16']).toEqual({
        mediaAssetId: 'asset-456',
        url: 'https://storage.googleapis.com/portrait.png',
        filePath: null,
      })
    })

    it('should accept update with both aspect ratios', () => {
      const update = {
        '1:1': {
          mediaAssetId: 'asset-123',
          url: 'https://storage.googleapis.com/square.png',
        },
        '9:16': {
          mediaAssetId: 'asset-456',
          url: 'https://storage.googleapis.com/portrait.png',
        },
      }

      const result = updateOverlaysConfigSchema.parse(update)

      expect(result['1:1']).toEqual({
        mediaAssetId: 'asset-123',
        url: 'https://storage.googleapis.com/square.png',
        filePath: null,
      })
      expect(result['9:16']).toEqual({
        mediaAssetId: 'asset-456',
        url: 'https://storage.googleapis.com/portrait.png',
        filePath: null,
      })
    })

    it('should accept empty object as valid partial update', () => {
      const emptyUpdate = {}

      const result = updateOverlaysConfigSchema.parse(emptyUpdate)

      expect(result).toEqual({})
    })
  })

  describe('overlay removal', () => {
    it('should accept null to remove 1:1 overlay', () => {
      const update = {
        '1:1': null,
      }

      const result = updateOverlaysConfigSchema.parse(update)

      expect(result['1:1']).toBeNull()
    })

    it('should accept null to remove 9:16 overlay', () => {
      const update = {
        '9:16': null,
      }

      const result = updateOverlaysConfigSchema.parse(update)

      expect(result['9:16']).toBeNull()
    })

    it('should accept mixed update (add one, remove another)', () => {
      const update = {
        '1:1': {
          mediaAssetId: 'asset-123',
          url: 'https://storage.googleapis.com/square.png',
        },
        '9:16': null,
      }

      const result = updateOverlaysConfigSchema.parse(update)

      expect(result['1:1']).toBeDefined()
      expect(result['9:16']).toBeNull()
    })
  })

  describe('invalid overlay references', () => {
    it('should reject overlay reference with missing mediaAssetId', () => {
      const invalidUpdate = {
        '1:1': {
          url: 'https://storage.googleapis.com/square.png',
        },
      }

      expect(() => updateOverlaysConfigSchema.parse(invalidUpdate)).toThrow()
    })

    it('should reject overlay reference with missing url', () => {
      const invalidUpdate = {
        '1:1': {
          mediaAssetId: 'asset-123',
        },
      }

      expect(() => updateOverlaysConfigSchema.parse(invalidUpdate)).toThrow()
    })

    it('should reject overlay reference with invalid URL format', () => {
      const invalidUpdate = {
        '1:1': {
          mediaAssetId: 'asset-123',
          url: 'not-a-valid-url',
        },
      }

      expect(() => updateOverlaysConfigSchema.parse(invalidUpdate)).toThrow()
    })

    it('should reject overlay reference with wrong type for mediaAssetId', () => {
      const invalidUpdate = {
        '1:1': {
          mediaAssetId: 123, // Should be string
          url: 'https://storage.googleapis.com/square.png',
        },
      }

      expect(() => updateOverlaysConfigSchema.parse(invalidUpdate)).toThrow()
    })

    it('should reject overlay reference with wrong type for url', () => {
      const invalidUpdate = {
        '1:1': {
          mediaAssetId: 'asset-123',
          url: 12345, // Should be string
        },
      }

      expect(() => updateOverlaysConfigSchema.parse(invalidUpdate)).toThrow()
    })

    it('should reject non-null, non-object value', () => {
      const invalidUpdate = {
        '1:1': 'invalid-string-value',
      }

      expect(() => updateOverlaysConfigSchema.parse(invalidUpdate)).toThrow()
    })
  })

  describe('safeParse behavior', () => {
    it('should return success for valid update', () => {
      const validUpdate = {
        '1:1': {
          mediaAssetId: 'asset-123',
          url: 'https://storage.googleapis.com/square.png',
        },
      }

      const result = updateOverlaysConfigSchema.safeParse(validUpdate)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data['1:1']).toEqual({
          mediaAssetId: 'asset-123',
          url: 'https://storage.googleapis.com/square.png',
          filePath: null,
        })
      }
    })

    it('should return failure for invalid update', () => {
      const invalidUpdate = {
        '1:1': {
          mediaAssetId: 'asset-123',
          // Missing url
        },
      }

      const result = updateOverlaysConfigSchema.safeParse(invalidUpdate)

      expect(result.success).toBe(false)
    })

    it('should return success for empty object', () => {
      const emptyUpdate = {}

      const result = updateOverlaysConfigSchema.safeParse(emptyUpdate)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual({})
      }
    })

    it('should return success for null removal', () => {
      const nullUpdate = {
        '1:1': null,
      }

      const result = updateOverlaysConfigSchema.safeParse(nullUpdate)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data['1:1']).toBeNull()
      }
    })
  })

  describe('unknown fields (looseObject behavior)', () => {
    it('should allow unknown aspect ratio fields to pass through', () => {
      const updateWithUnknownField = {
        '1:1': {
          mediaAssetId: 'asset-123',
          url: 'https://storage.googleapis.com/square.png',
        },
        '4:3': {
          mediaAssetId: 'asset-789',
          url: 'https://storage.googleapis.com/landscape.png',
        },
      }

      const result = updateOverlaysConfigSchema.parse(updateWithUnknownField)

      expect(result['1:1']).toBeDefined()
      expect(result['4:3']).toBeDefined()
    })

    it('should allow additional fields for forward compatibility', () => {
      const updateWithFutureField = {
        '1:1': {
          mediaAssetId: 'asset-123',
          url: 'https://storage.googleapis.com/square.png',
        },
        futureField: 'future value',
      }

      const result = updateOverlaysConfigSchema.parse(updateWithFutureField)

      expect(result['1:1']).toBeDefined()
      expect(result).toHaveProperty('futureField', 'future value')
    })
  })
})

describe('overlayReferenceSchema', () => {
  describe('valid overlay references', () => {
    it('should validate complete overlay reference', () => {
      const validReference = {
        mediaAssetId: 'asset-123',
        url: 'https://storage.googleapis.com/image.png',
      }

      const result = overlayReferenceSchema.parse(validReference)

      expect(result).toEqual({
        mediaAssetId: 'asset-123',
        url: 'https://storage.googleapis.com/image.png',
        filePath: null,
      })
    })

    it('should validate overlay reference with Firebase Storage URL', () => {
      const validReference = {
        mediaAssetId: 'asset-456',
        url: 'https://firebasestorage.googleapis.com/v0/b/bucket/o/image.png?alt=media&token=abc123',
      }

      const result = overlayReferenceSchema.parse(validReference)

      expect(result).toEqual({
        mediaAssetId: 'asset-456',
        url: 'https://firebasestorage.googleapis.com/v0/b/bucket/o/image.png?alt=media&token=abc123',
        filePath: null,
      })
    })

    it('should accept null as valid overlay reference', () => {
      const result = overlayReferenceSchema.parse(null)

      expect(result).toBeNull()
    })
  })

  describe('invalid overlay references', () => {
    it('should reject reference missing mediaAssetId', () => {
      const invalidReference = {
        url: 'https://storage.googleapis.com/image.png',
      }

      expect(() => overlayReferenceSchema.parse(invalidReference)).toThrow()
    })

    it('should reject reference missing url', () => {
      const invalidReference = {
        mediaAssetId: 'asset-123',
      }

      expect(() => overlayReferenceSchema.parse(invalidReference)).toThrow()
    })

    it('should reject reference with invalid URL', () => {
      const invalidReference = {
        mediaAssetId: 'asset-123',
        url: 'invalid-url',
      }

      expect(() => overlayReferenceSchema.parse(invalidReference)).toThrow()
    })

    it('should reject reference with empty string URL', () => {
      const invalidReference = {
        mediaAssetId: 'asset-123',
        url: '',
      }

      expect(() => overlayReferenceSchema.parse(invalidReference)).toThrow()
    })

    it('should reject reference with wrong types', () => {
      const invalidReference = {
        mediaAssetId: 123,
        url: true,
      }

      expect(() => overlayReferenceSchema.parse(invalidReference)).toThrow()
    })
  })
})
