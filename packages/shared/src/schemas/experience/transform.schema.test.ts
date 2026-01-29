/**
 * Transform Schema Tests
 *
 * Tests for AI image node schema:
 * - Model validation
 * - AspectRatio enum
 * - RefMedia array (uses mediaReferenceSchema)
 */
import { describe, expect, it } from 'vitest'
import {
  aiImageNodeConfigSchema,
  transformConfigSchema,
} from './transform.schema'

describe('aiImageNodeConfigSchema', () => {
  const validConfig = {
    model: 'gemini-2.5-pro',
    aspectRatio: '3:2',
    prompt: 'A photo of a cat in a park',
    refMedia: [],
  }

  describe('model field', () => {
    it('should accept valid model string', () => {
      const result = aiImageNodeConfigSchema.safeParse(validConfig)
      expect(result.success).toBe(true)
    })

    it('should require model', () => {
      const { model, ...rest } = validConfig
      const result = aiImageNodeConfigSchema.safeParse(rest)
      expect(result.success).toBe(false)
    })

    it('should accept valid model names from enum', () => {
      const models: Array<'gemini-2.5-pro' | 'gemini-2.5-flash' | 'gemini-3.0'> = [
        'gemini-2.5-pro',
        'gemini-2.5-flash',
        'gemini-3.0',
      ]
      models.forEach(model => {
        const result = aiImageNodeConfigSchema.safeParse({
          ...validConfig,
          model,
        })
        expect(result.success).toBe(true)
      })
    })

    it('should reject invalid model names', () => {
      const result = aiImageNodeConfigSchema.safeParse({
        ...validConfig,
        model: 'invalid-model',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('aspectRatio field', () => {
    it('should accept valid aspect ratios', () => {
      const aspectRatios = ['1:1', '3:2', '2:3', '9:16', '16:9'] as const
      aspectRatios.forEach(aspectRatio => {
        const result = aiImageNodeConfigSchema.safeParse({
          ...validConfig,
          aspectRatio,
        })
        expect(result.success).toBe(true)
      })
    })

    it('should reject invalid aspect ratio', () => {
      const result = aiImageNodeConfigSchema.safeParse({
        ...validConfig,
        aspectRatio: '4:3',
      })
      expect(result.success).toBe(false)
    })

    it('should require aspectRatio', () => {
      const { aspectRatio, ...rest } = validConfig
      const result = aiImageNodeConfigSchema.safeParse(rest)
      expect(result.success).toBe(false)
    })
  })

  describe('prompt field', () => {
    it('should accept valid prompt string', () => {
      const result = aiImageNodeConfigSchema.safeParse(validConfig)
      expect(result.success).toBe(true)
    })

    it('should require prompt', () => {
      const { prompt, ...rest } = validConfig
      const result = aiImageNodeConfigSchema.safeParse(rest)
      expect(result.success).toBe(false)
    })

    it('should accept prompt with step references', () => {
      const result = aiImageNodeConfigSchema.safeParse({
        ...validConfig,
        prompt: 'A photo of @{step:Pet Choice} in a park',
      })
      expect(result.success).toBe(true)
    })

    it('should accept prompt with ref media references', () => {
      const result = aiImageNodeConfigSchema.safeParse({
        ...validConfig,
        prompt: 'A photo with @{ref:style-guide-1}',
      })
      expect(result.success).toBe(true)
    })

    it('should accept long prompts', () => {
      const longPrompt = 'A'.repeat(1000)
      const result = aiImageNodeConfigSchema.safeParse({
        ...validConfig,
        prompt: longPrompt,
      })
      expect(result.success).toBe(true)
    })

    it('should reject empty prompt', () => {
      const result = aiImageNodeConfigSchema.safeParse({
        ...validConfig,
        prompt: '',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('refMedia field', () => {
    it('should accept empty refMedia array', () => {
      const result = aiImageNodeConfigSchema.safeParse({
        ...validConfig,
        refMedia: [],
      })
      expect(result.success).toBe(true)
    })

    it('should accept valid refMedia array', () => {
      const result = aiImageNodeConfigSchema.safeParse({
        ...validConfig,
        refMedia: [
          {
            mediaAssetId: 'ref-1',
            url: 'https://storage.googleapis.com/example/ref-1.jpg',
            filePath: 'ref-media/workspace-id/ref-1.jpg',
            displayName: 'Park Background',
          },
        ],
      })
      expect(result.success).toBe(true)
    })

    it('should accept multiple refMedia entries', () => {
      const result = aiImageNodeConfigSchema.safeParse({
        ...validConfig,
        refMedia: [
          {
            mediaAssetId: 'ref-1',
            url: 'https://storage.googleapis.com/example/ref-1.jpg',
            filePath: 'ref-media/workspace-id/ref-1.jpg',
            displayName: 'Background 1',
          },
          {
            mediaAssetId: 'ref-2',
            url: 'https://storage.googleapis.com/example/ref-2.jpg',
            filePath: 'ref-media/workspace-id/ref-2.jpg',
            displayName: 'Background 2',
          },
        ],
      })
      expect(result.success).toBe(true)
    })

    it('should require refMedia field', () => {
      const { refMedia, ...rest } = validConfig
      const result = aiImageNodeConfigSchema.safeParse(rest)
      expect(result.success).toBe(false)
    })

    it('should accept refMedia entries without displayName (uses default)', () => {
      const result = aiImageNodeConfigSchema.safeParse({
        ...validConfig,
        refMedia: [
          {
            mediaAssetId: 'ref-1',
            url: 'https://storage.googleapis.com/example/ref-1.jpg',
            // displayName will default to 'Untitled'
          },
        ],
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.refMedia[0].displayName).toBe('Untitled')
      }
    })

    it('should reject refMedia entries with missing required fields', () => {
      const result = aiImageNodeConfigSchema.safeParse({
        ...validConfig,
        refMedia: [
          {
            // Missing mediaAssetId and url (required fields)
            displayName: 'Background',
          },
        ],
      })
      expect(result.success).toBe(false)
    })
  })
})

describe('transformConfigSchema - variableMappings removal', () => {
  it('should not include variableMappings in schema', () => {
    const config = {
      nodes: [],
      outputFormat: null,
    }
    const result = transformConfigSchema.safeParse(config)
    expect(result.success).toBe(true)
    if (result.success) {
      // variableMappings should not exist in parsed result
      expect('variableMappings' in result.data).toBe(false)
    }
  })

  it('should accept config with AI image node', () => {
    const config = {
      nodes: [
        {
          id: 'node-1',
          type: 'ai.imageGeneration',
          config: {
            model: 'gemini-2.5-pro',
            aspectRatio: '3:2',
            prompt: 'A photo of @{step:Pet Choice}',
            refMedia: [],
          },
        },
      ],
      outputFormat: null,
    }
    const result = transformConfigSchema.safeParse(config)
    expect(result.success).toBe(true)
  })
})
