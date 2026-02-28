import { describe, it, expect } from 'vitest'
import {
  experienceStatusSchema,
  experienceTypeSchema,
  experienceMediaSchema,
  experienceConfigSchema,
  experienceSchema,
  surveyConfigSchema,
  aiImageConfigVariantSchema,
  photoConfigVariantSchema,
} from './index'

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

describe('experienceConfigSchema (discriminated union)', () => {
  it('rejects config without type discriminator', () => {
    expect(() => experienceConfigSchema.parse({})).toThrow()
    expect(() => experienceConfigSchema.parse({ steps: [] })).toThrow()
  })

  it('parses survey config with defaults', () => {
    const result = surveyConfigSchema.parse({ type: 'survey' })
    expect(result.type).toBe('survey')
    expect(result.steps).toEqual([])
  })

  it('accepts steps array in survey config', () => {
    const result = experienceConfigSchema.parse({
      type: 'survey',
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

  it('accepts photo config variant', () => {
    const result = photoConfigVariantSchema.parse({
      type: 'photo',
      photo: { captureStepId: 'step-1', aspectRatio: '1:1' },
    })
    expect(result.photo.captureStepId).toBe('step-1')
  })

  it('accepts ai.image config variant', () => {
    const result = aiImageConfigVariantSchema.parse({
      type: 'ai.image',
      aiImage: {
        task: 'text-to-image',
        captureStepId: null,
        aspectRatio: '1:1',
        imageGeneration: { prompt: 'test' },
      },
    })
    expect(result.aiImage.task).toBe('text-to-image')
  })

  it('preserves unknown fields (looseObject)', () => {
    const result: Record<string, unknown> = surveyConfigSchema.parse({
      type: 'survey',
      futureField: 'value',
    })
    expect(result['futureField']).toBe('value')
  })
})

describe('experienceSchema', () => {
  const validMinimalExperience = {
    id: 'exp-123',
    name: 'Test Experience',
    draftType: 'ai.image' as const,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    draft: {
      type: 'ai.image' as const,
      aiImage: {
        task: 'text-to-image' as const,
        captureStepId: null,
        aspectRatio: '1:1' as const,
        imageGeneration: { prompt: 'test prompt' },
      },
    },
  }

  it('parses minimal valid experience with defaults', () => {
    const result = experienceSchema.parse(validMinimalExperience)

    expect(result.id).toBe('exp-123')
    expect(result.name).toBe('Test Experience')
    expect(result.draftType).toBe('ai.image')
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

  it('requires draftType field', () => {
    const { draftType: _, ...withoutDraftType } = validMinimalExperience
    expect(() => experienceSchema.parse(withoutDraftType)).toThrow()
  })

  it('requires draft field', () => {
    const { draft: _, ...withoutDraft } = validMinimalExperience
    expect(() => experienceSchema.parse(withoutDraft)).toThrow()
  })

  describe('dual-state configuration', () => {
    it('draft is required, published is optional', () => {
      const result = experienceSchema.parse(validMinimalExperience)
      expect(result.draft.steps).toEqual([])
      expect(result.draft.type).toBe('ai.image')
      expect(result.published).toBeNull()
    })

    it('accepts both draft and published configs', () => {
      const surveyConfig = {
        type: 'survey' as const,
        steps: [
          {
            id: '123e4567-e89b-12d3-a456-426614174000',
            type: 'info',
            name: 'Info Step',
            config: { title: '', description: '', media: null },
          },
        ],
      }

      const result = experienceSchema.parse({
        ...validMinimalExperience,
        draftType: 'survey',
        draft: surveyConfig,
        published: surveyConfig,
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
        published: {
          type: 'ai.image',
          aiImage: {
            task: 'text-to-image',
            captureStepId: null,
            aspectRatio: '1:1',
            imageGeneration: { prompt: 'test' },
          },
        },
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
