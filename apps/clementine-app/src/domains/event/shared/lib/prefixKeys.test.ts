/**
 * Unit tests for prefixKeys utility
 *
 * Tests key prefixing, special character handling, and value preservation.
 */
import { describe, expect, it } from 'vitest'
import { prefixKeys } from './prefixKeys'

describe('prefixKeys', () => {
  describe('basic key prefixing', () => {
    it('should prefix simple string keys', () => {
      const input = { download: false, copyLink: true }
      const result = prefixKeys(input, 'sharing')

      expect(result).toEqual({
        'sharing.download': false,
        'sharing.copyLink': true,
      })
    })

    it('should preserve original values unchanged', () => {
      const input = {
        stringValue: 'test',
        numberValue: 42,
        booleanValue: true,
        nullValue: null,
      }
      const result = prefixKeys(input, 'config')

      expect(result['config.stringValue']).toBe('test')
      expect(result['config.numberValue']).toBe(42)
      expect(result['config.booleanValue']).toBe(true)
      expect(result['config.nullValue']).toBeNull()
    })
  })

  describe('keys with special characters', () => {
    it('should handle aspect ratio keys (1:1, 9:16)', () => {
      const input = {
        '1:1': { mediaAssetId: 'abc', url: 'https://example.com/square.png' },
        '9:16': {
          mediaAssetId: 'xyz',
          url: 'https://example.com/portrait.png',
        },
      }
      const result = prefixKeys(input, 'overlays')

      expect(result).toEqual({
        'overlays.1:1': {
          mediaAssetId: 'abc',
          url: 'https://example.com/square.png',
        },
        'overlays.9:16': {
          mediaAssetId: 'xyz',
          url: 'https://example.com/portrait.png',
        },
      })
    })

    it('should handle keys with dots', () => {
      const input = { 'key.with.dots': 'value' }
      const result = prefixKeys(input, 'prefix')

      expect(result['prefix.key.with.dots']).toBe('value')
    })

    it('should handle keys with hyphens and underscores', () => {
      const input = {
        'key-with-hyphens': 'hyphen',
        key_with_underscores: 'underscore',
      }
      const result = prefixKeys(input, 'prefix')

      expect(result['prefix.key-with-hyphens']).toBe('hyphen')
      expect(result['prefix.key_with_underscores']).toBe('underscore')
    })
  })

  describe('edge cases', () => {
    it('should return empty object when input is empty', () => {
      const input = {}
      const result = prefixKeys(input, 'prefix')

      expect(result).toEqual({})
    })

    it('should handle empty string as prefix', () => {
      const input = { key: 'value' }
      const result = prefixKeys(input, '')

      expect(result['.key']).toBe('value')
    })

    it('should handle single character keys', () => {
      const input = { a: 1, b: 2, c: 3 }
      const result = prefixKeys(input, 'prefix')

      expect(result['prefix.a']).toBe(1)
      expect(result['prefix.b']).toBe(2)
      expect(result['prefix.c']).toBe(3)
    })
  })

  describe('value type preservation', () => {
    it('should preserve nested objects', () => {
      const nestedObject = {
        nested: {
          deeply: {
            nested: 'value',
          },
        },
      }
      const result = prefixKeys(nestedObject, 'config')

      expect(result['config.nested']).toEqual({
        deeply: {
          nested: 'value',
        },
      })
    })

    it('should preserve arrays', () => {
      const input = {
        arrayValue: [1, 2, 3],
        objectArray: [{ id: 1 }, { id: 2 }],
      }
      const result = prefixKeys(input, 'data')

      expect(result['data.arrayValue']).toEqual([1, 2, 3])
      expect(result['data.objectArray']).toEqual([{ id: 1 }, { id: 2 }])
    })

    it('should preserve null values', () => {
      const input = {
        nullField: null,
        nonNullField: 'value',
      }
      const result = prefixKeys(input, 'config')

      expect(result['config.nullField']).toBeNull()
      expect(result['config.nonNullField']).toBe('value')
    })

    it('should preserve boolean values', () => {
      const input = {
        trueValue: true,
        falseValue: false,
      }
      const result = prefixKeys(input, 'flags')

      expect(result['flags.trueValue']).toBe(true)
      expect(result['flags.falseValue']).toBe(false)
    })

    it('should preserve numbers (including 0)', () => {
      const input = {
        zero: 0,
        positive: 42,
        negative: -10,
        float: 3.14,
      }
      const result = prefixKeys(input, 'numbers')

      expect(result['numbers.zero']).toBe(0)
      expect(result['numbers.positive']).toBe(42)
      expect(result['numbers.negative']).toBe(-10)
      expect(result['numbers.float']).toBe(3.14)
    })
  })

  describe('Firestore use case examples', () => {
    it('should prepare sharing updates for Firestore', () => {
      const updates = { download: false, instagram: true }
      const result = prefixKeys(updates, 'sharing')

      expect(result).toEqual({
        'sharing.download': false,
        'sharing.instagram': true,
      })
    })

    it('should prepare overlay updates for Firestore', () => {
      const overlayUpdates = {
        '1:1': { mediaAssetId: 'abc', url: 'https://example.com/img.png' },
      }
      const result = prefixKeys(overlayUpdates, 'overlays')

      expect(result).toEqual({
        'overlays.1:1': {
          mediaAssetId: 'abc',
          url: 'https://example.com/img.png',
        },
      })
    })

    it('should handle overlay removal (null value)', () => {
      const overlayRemoval = { '9:16': null }
      const result = prefixKeys(overlayRemoval, 'overlays')

      expect(result).toEqual({
        'overlays.9:16': null,
      })
    })
  })
})
