/**
 * Media Reference Schema Tests
 *
 * Tests for media references and display name validation.
 * Part of Transform v3 - PRD 1A Schema Foundations (US3).
 */
import { describe, expect, it } from 'vitest'
import {
  mediaDisplayNameSchema,
  mediaReferenceSchema,
  type MediaDisplayName,
  type MediaReference,
} from './media-reference.schema'

describe('mediaDisplayNameSchema', () => {
  describe('valid display names', () => {
    it('accepts alphanumeric with hyphen: "hero-shot"', () => {
      const result = mediaDisplayNameSchema.parse('hero-shot')
      expect(result).toBe('hero-shot')
    })

    it('accepts alphanumeric with space: "User Photo 1"', () => {
      const result = mediaDisplayNameSchema.parse('User Photo 1')
      expect(result).toBe('User Photo 1')
    })

    it('accepts alphanumeric with period: "logo.v2"', () => {
      const result = mediaDisplayNameSchema.parse('logo.v2')
      expect(result).toBe('logo.v2')
    })

    it('accepts alphanumeric with underscore: "my_photo"', () => {
      const result = mediaDisplayNameSchema.parse('my_photo')
      expect(result).toBe('my_photo')
    })

    it('trims whitespace from valid names', () => {
      const result = mediaDisplayNameSchema.parse('  trimmed name  ')
      expect(result).toBe('trimmed name')
    })
  })

  describe('invalid display names - fallback to Untitled', () => {
    it('rejects display name with } (mention-breaking character)', () => {
      const result = mediaDisplayNameSchema.parse('logo}test')
      expect(result).toBe('Untitled')
    })

    it('rejects display name with : (mention-breaking character)', () => {
      const result = mediaDisplayNameSchema.parse('name:value')
      expect(result).toBe('Untitled')
    })

    it('rejects display name with { (mention-breaking character)', () => {
      const result = mediaDisplayNameSchema.parse('test{name')
      expect(result).toBe('Untitled')
    })

    it('falls back to Untitled for empty display name', () => {
      const result = mediaDisplayNameSchema.parse('')
      expect(result).toBe('Untitled')
    })

    it('falls back to Untitled for display name over 100 chars', () => {
      const longName = 'a'.repeat(101)
      const result = mediaDisplayNameSchema.parse(longName)
      expect(result).toBe('Untitled')
    })

    it('falls back to Untitled for whitespace-only display name', () => {
      const result = mediaDisplayNameSchema.parse('   ')
      expect(result).toBe('Untitled')
    })

    it('rejects special characters like @', () => {
      const result = mediaDisplayNameSchema.parse('user@photo')
      expect(result).toBe('Untitled')
    })

    it('rejects special characters like #', () => {
      const result = mediaDisplayNameSchema.parse('photo#1')
      expect(result).toBe('Untitled')
    })
  })

  describe('boundary cases', () => {
    it('accepts exactly 100 characters', () => {
      const maxName = 'a'.repeat(100)
      const result = mediaDisplayNameSchema.parse(maxName)
      expect(result).toBe(maxName)
    })

    it('accepts single character', () => {
      const result = mediaDisplayNameSchema.parse('A')
      expect(result).toBe('A')
    })
  })
})

describe('mediaReferenceSchema', () => {
  it('uses validated displayName from mediaDisplayNameSchema', () => {
    const ref = mediaReferenceSchema.parse({
      mediaAssetId: 'asset-123',
      url: 'https://storage.example.com/image.jpg',
      displayName: 'Valid Name',
    })
    expect(ref.displayName).toBe('Valid Name')
  })

  it('applies displayName validation to media reference', () => {
    const ref = mediaReferenceSchema.parse({
      mediaAssetId: 'asset-123',
      url: 'https://storage.example.com/image.jpg',
      displayName: 'invalid}name',
    })
    expect(ref.displayName).toBe('Untitled')
  })

  it('defaults displayName to Untitled when not provided', () => {
    const ref = mediaReferenceSchema.parse({
      mediaAssetId: 'asset-123',
      url: 'https://storage.example.com/image.jpg',
    })
    expect(ref.displayName).toBe('Untitled')
  })

  it('defaults filePath to null when not provided', () => {
    const ref = mediaReferenceSchema.parse({
      mediaAssetId: 'asset-123',
      url: 'https://storage.example.com/image.jpg',
    })
    expect(ref.filePath).toBeNull()
  })
})

describe('type inference', () => {
  it('infers MediaDisplayName type', () => {
    const name: MediaDisplayName = mediaDisplayNameSchema.parse('valid-name')
    expect(name).toBe('valid-name')
  })

  it('infers MediaReference type', () => {
    const ref: MediaReference = mediaReferenceSchema.parse({
      mediaAssetId: 'asset-123',
      url: 'https://storage.example.com/image.jpg',
      displayName: 'Test',
    })
    expect(ref.mediaAssetId).toBe('asset-123')
  })
})
