import { describe, it, expect } from 'vitest'
import {
  experienceStatusSchema,
  experienceTypeSchema,
  experienceMediaSchema,
  experienceConfigSchema,
  experienceSchema,
} from './experience.schema'

describe('experienceStatusSchema', () => {
  it('accepts valid status values', () => {
    expect(experienceStatusSchema.parse('active')).toBe('active')
    expect(experienceStatusSchema.parse('deleted')).toBe('deleted')
  })

  it('rejects invalid status values', () => {
    expect(() => experienceStatusSchema.parse('draft')).toThrow()
    expect(() => experienceStatusSchema.parse('archived')).toThrow()
  })
})

describe('experienceTypeSchema', () => {
  it('accepts valid type values', () => {
    expect(experienceTypeSchema.parse('survey')).toBe('survey')
    expect(experienceTypeSchema.parse('photo')).toBe('photo')
    expect(experienceTypeSchema.parse('gif')).toBe('gif')
    expect(experienceTypeSchema.parse('video')).toBe('video')
    expect(experienceTypeSchema.parse('ai.image')).toBe('ai.image')
    expect(experienceTypeSchema.parse('ai.video')).toBe('ai.video')
  })

  it('rejects invalid type values', () => {
    expect(() => experienceTypeSchema.parse('freeform')).toThrow()
    expect(() => experienceTypeSchema.parse('story')).toThrow()
    expect(() => experienceTypeSchema.parse('custom')).toThrow()
  })
})

describe('experienceMediaSchema', () => {
  it('accepts valid media reference', () => {
    const result = experienceMediaSchema.parse({
      mediaAssetId: 'asset-123',
      url: 'https://example.com/image.png',
    })
    expect(result).toEqual({
      mediaAssetId: 'asset-123',
      url: 'https://example.com/image.png',
      filePath: null,
      displayName: 'Untitled', // Default from merged media-naming feature
    })
  })

  it('accepts null', () => {
    expect(experienceMediaSchema.parse(null)).toBeNull()
  })

  it('accepts empty mediaAssetId (for backward compatibility)', () => {
    // Note: The new schema allows empty strings for backward compatibility
    // with legacy data that may have empty mediaAssetIds
    const result = experienceMediaSchema.parse({
      mediaAssetId: '',
      url: 'https://example.com/image.png',
    })
    expect(result?.mediaAssetId).toBe('')
  })

  it('validates URL format', () => {
    expect(() =>
      experienceMediaSchema.parse({
        mediaAssetId: 'asset-123',
        url: 'not-a-url',
      })
    ).toThrow()
  })
})

describe('experienceConfigSchema', () => {
  it('applies defaults when parsing empty object', () => {
    const result = experienceConfigSchema.parse({})
    expect(result.steps).toEqual([])
    expect(result.photo).toBeNull()
    expect(result.gif).toBeNull()
    expect(result.video).toBeNull()
    expect(result.aiImage).toBeNull()
    expect(result.aiVideo).toBeNull()
  })

  it('accepts steps array', () => {
    const result = experienceConfigSchema.parse({
      steps: [
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          type: 'info',
          name: 'Info Step',
          config: { title: '', description: '', media: null },
        },
        {
          id: '123e4567-e89b-12d3-a456-426614174001',
          type: 'capture.photo',
          name: 'Photo Step',
          config: { aspectRatio: '1:1' },
        },
      ],
    })
    expect(result.steps).toHaveLength(2)
  })

  it('accepts flattened per-type config', () => {
    const result = experienceConfigSchema.parse({
      photo: { captureStepId: 'step-1', aspectRatio: '1:1' },
    })
    expect(result.photo?.captureStepId).toBe('step-1')
  })

  it('accepts ai image config directly', () => {
    const result = experienceConfigSchema.parse({
      aiImage: {
        task: 'text-to-image',
        captureStepId: null,
        aspectRatio: '1:1',
        imageGeneration: { prompt: 'test' },
      },
    })
    expect(result.aiImage?.task).toBe('text-to-image')
  })

  it('preserves unknown fields (looseObject)', () => {
    const result: Record<string, unknown> = experienceConfigSchema.parse({
      futureField: 'value',
    })
    expect(result['futureField']).toBe('value')
  })
})

describe('experienceSchema', () => {
  const validMinimalExperience = {
    id: 'exp-123',
    name: 'Test Experience',
    type: 'ai.image',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    draft: { steps: [] },
  }

  it('parses minimal valid experience with defaults', () => {
    const result = experienceSchema.parse(validMinimalExperience)

    expect(result.id).toBe('exp-123')
    expect(result.name).toBe('Test Experience')
    expect(result.type).toBe('ai.image')
    expect(result.status).toBe('active')
    expect(result.media).toBeNull()
    expect(result.deletedAt).toBeNull()
    expect(result.published).toBeNull()
    expect(result.draftVersion).toBe(1)
    expect(result.publishedVersion).toBeNull()
    expect(result.publishedAt).toBeNull()
    expect(result.publishedBy).toBeNull()
  })

  it('requires id field', () => {
    const { id: _, ...withoutId } = validMinimalExperience
    expect(() => experienceSchema.parse(withoutId)).toThrow()
  })

  it('requires name field with min length', () => {
    expect(() =>
      experienceSchema.parse({ ...validMinimalExperience, name: '' })
    ).toThrow()
  })

  it('enforces name max length', () => {
    const longName = 'a'.repeat(101)
    expect(() =>
      experienceSchema.parse({ ...validMinimalExperience, name: longName })
    ).toThrow()
  })

  it('requires type field', () => {
    const { type: _, ...withoutType } = validMinimalExperience
    expect(() => experienceSchema.parse(withoutType)).toThrow()
  })

  it('requires draft field', () => {
    const { draft: _, ...withoutDraft } = validMinimalExperience
    expect(() => experienceSchema.parse(withoutDraft)).toThrow()
  })

  describe('dual-state configuration', () => {
    it('draft is required, published is optional', () => {
      const result = experienceSchema.parse(validMinimalExperience)
      expect(result.draft.steps).toEqual([])
      expect(result.draft.photo).toBeNull()
      expect(result.draft.aiImage).toBeNull()
      expect(result.published).toBeNull()
    })

    it('accepts both draft and published configs', () => {
      const result = experienceSchema.parse({
        ...validMinimalExperience,
        draft: {
          steps: [
            {
              id: '123e4567-e89b-12d3-a456-426614174000',
              type: 'info',
              name: 'Info Step',
              config: { title: '', description: '', media: null },
            },
          ],
        },
        published: {
          steps: [
            {
              id: '123e4567-e89b-12d3-a456-426614174000',
              type: 'info',
              name: 'Info Step',
              config: { title: '', description: '', media: null },
            },
          ],
        },
      })
      expect(result.draft.steps).toHaveLength(1)
      expect(result.published?.steps).toHaveLength(1)
    })
  })

  describe('version tracking', () => {
    it('draftVersion defaults to 1', () => {
      const result = experienceSchema.parse(validMinimalExperience)
      expect(result.draftVersion).toBe(1)
    })

    it('publishedVersion is null until first publish', () => {
      const result = experienceSchema.parse(validMinimalExperience)
      expect(result.publishedVersion).toBeNull()
    })

    it('accepts version numbers after publish', () => {
      const result = experienceSchema.parse({
        ...validMinimalExperience,
        draftVersion: 5,
        publishedVersion: 3,
      })
      expect(result.draftVersion).toBe(5)
      expect(result.publishedVersion).toBe(3)
    })
  })

  describe('publish tracking', () => {
    it('publishedAt and publishedBy are null before first publish', () => {
      const result = experienceSchema.parse(validMinimalExperience)
      expect(result.publishedAt).toBeNull()
      expect(result.publishedBy).toBeNull()
    })

    it('accepts publish metadata', () => {
      const now = Date.now()
      const result = experienceSchema.parse({
        ...validMinimalExperience,
        published: { steps: [] },
        publishedVersion: 1,
        publishedAt: now,
        publishedBy: 'user-123',
      })
      expect(result.publishedAt).toBe(now)
      expect(result.publishedBy).toBe('user-123')
    })
  })

  describe('soft delete pattern', () => {
    it('active experience has null deletedAt', () => {
      const result = experienceSchema.parse(validMinimalExperience)
      expect(result.status).toBe('active')
      expect(result.deletedAt).toBeNull()
    })

    it('deleted experience has deletedAt timestamp', () => {
      const deletedAt = Date.now()
      const result = experienceSchema.parse({
        ...validMinimalExperience,
        status: 'deleted',
        deletedAt,
      })
      expect(result.status).toBe('deleted')
      expect(result.deletedAt).toBe(deletedAt)
    })
  })

  it('preserves unknown fields (looseObject forward compatibility)', () => {
    const result: Record<string, unknown> = experienceSchema.parse({
      ...validMinimalExperience,
      futureField: 'value',
    })
    expect(result['futureField']).toBe('value')
  })
})
