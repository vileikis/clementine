/**
 * Create Outcome Schema Tests
 *
 * Tests for outcome-based generation configuration (image/gif/video).
 * Part of Transform v3 - PRD 1A Schema Foundations.
 */
import { describe, expect, it } from 'vitest'
import {
  aiImageAspectRatioSchema,
  aiImageModelSchema,
  createOutcomeSchema,
  createOutcomeTypeSchema,
  gifOptionsSchema,
  imageGenerationConfigSchema,
  imageOptionsSchema,
  outcomeOptionsSchema,
  videoOptionsSchema,
  type AIImageAspectRatio,
  type AIImageModel,
  type CreateOutcome,
  type CreateOutcomeType,
  type GifOptions,
  type ImageGenerationConfig,
  type ImageOptions,
  type OutcomeOptions,
  type VideoOptions,
} from './create-outcome.schema'

describe('createOutcomeTypeSchema', () => {
  it('accepts valid outcome types', () => {
    expect(createOutcomeTypeSchema.parse('image')).toBe('image')
    expect(createOutcomeTypeSchema.parse('gif')).toBe('gif')
    expect(createOutcomeTypeSchema.parse('video')).toBe('video')
  })

  it('rejects invalid outcome type', () => {
    expect(() => createOutcomeTypeSchema.parse('audio')).toThrow()
    expect(() => createOutcomeTypeSchema.parse('')).toThrow()
  })
})

describe('aiImageModelSchema', () => {
  it('accepts valid model values', () => {
    expect(aiImageModelSchema.parse('gemini-2.5-flash-image')).toBe(
      'gemini-2.5-flash-image'
    )
    expect(aiImageModelSchema.parse('gemini-3-pro-image-preview')).toBe(
      'gemini-3-pro-image-preview'
    )
  })

  it('rejects invalid model value with descriptive error', () => {
    const result = aiImageModelSchema.safeParse('invalid-model')
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.message).toContain('Invalid option')
    }
  })
})

describe('aiImageAspectRatioSchema', () => {
  it('accepts valid aspect ratios', () => {
    expect(aiImageAspectRatioSchema.parse('1:1')).toBe('1:1')
    expect(aiImageAspectRatioSchema.parse('3:2')).toBe('3:2')
    expect(aiImageAspectRatioSchema.parse('2:3')).toBe('2:3')
    expect(aiImageAspectRatioSchema.parse('9:16')).toBe('9:16')
    expect(aiImageAspectRatioSchema.parse('16:9')).toBe('16:9')
  })

  it('rejects invalid aspect ratio', () => {
    expect(() => aiImageAspectRatioSchema.parse('4:3')).toThrow()
  })
})

describe('imageGenerationConfigSchema', () => {
  it('applies defaults for missing fields', () => {
    const result = imageGenerationConfigSchema.parse({})
    expect(result).toEqual({
      prompt: '',
      refMedia: [],
      model: 'gemini-2.5-flash-image',
      aspectRatio: '1:1',
    })
  })

  it('accepts full configuration', () => {
    const config = {
      prompt: 'Transform @{step:photo} into a cartoon',
      refMedia: [
        {
          mediaAssetId: 'asset-123',
          url: 'https://example.com/ref.jpg',
          displayName: 'Reference',
        },
      ],
      model: 'gemini-3-pro-image-preview',
      aspectRatio: '16:9',
    }
    const result = imageGenerationConfigSchema.parse(config)
    expect(result.prompt).toBe('Transform @{step:photo} into a cartoon')
    expect(result.model).toBe('gemini-3-pro-image-preview')
    expect(result.aspectRatio).toBe('16:9')
    expect(result.refMedia).toHaveLength(1)
  })
})

describe('imageOptionsSchema', () => {
  it('accepts image options with kind literal', () => {
    const result = imageOptionsSchema.parse({ kind: 'image' })
    expect(result).toEqual({ kind: 'image' })
  })

  it('rejects wrong kind literal', () => {
    expect(() => imageOptionsSchema.parse({ kind: 'gif' })).toThrow()
  })
})

describe('gifOptionsSchema', () => {
  it('accepts GIF options with defaults', () => {
    const result = gifOptionsSchema.parse({ kind: 'gif' })
    expect(result).toEqual({
      kind: 'gif',
      fps: 24,
      duration: 3,
    })
  })

  it('accepts custom fps and duration', () => {
    const result = gifOptionsSchema.parse({ kind: 'gif', fps: 30, duration: 5 })
    expect(result.fps).toBe(30)
    expect(result.duration).toBe(5)
  })

  it('validates fps range (1-60)', () => {
    expect(() => gifOptionsSchema.parse({ kind: 'gif', fps: 0 })).toThrow()
    expect(() => gifOptionsSchema.parse({ kind: 'gif', fps: 61 })).toThrow()
    expect(gifOptionsSchema.parse({ kind: 'gif', fps: 1 }).fps).toBe(1)
    expect(gifOptionsSchema.parse({ kind: 'gif', fps: 60 }).fps).toBe(60)
  })

  it('validates duration range (0.5-30)', () => {
    expect(() =>
      gifOptionsSchema.parse({ kind: 'gif', duration: 0.4 })
    ).toThrow()
    expect(() =>
      gifOptionsSchema.parse({ kind: 'gif', duration: 31 })
    ).toThrow()
    expect(gifOptionsSchema.parse({ kind: 'gif', duration: 0.5 }).duration).toBe(
      0.5
    )
    expect(gifOptionsSchema.parse({ kind: 'gif', duration: 30 }).duration).toBe(
      30
    )
  })
})

describe('videoOptionsSchema', () => {
  it('accepts video options with defaults', () => {
    const result = videoOptionsSchema.parse({ kind: 'video' })
    expect(result).toEqual({
      kind: 'video',
      videoPrompt: '',
      duration: 5,
    })
  })

  it('accepts custom videoPrompt and duration', () => {
    const result = videoOptionsSchema.parse({
      kind: 'video',
      videoPrompt: 'Camera slowly zooms in',
      duration: 10,
    })
    expect(result.videoPrompt).toBe('Camera slowly zooms in')
    expect(result.duration).toBe(10)
  })

  it('validates duration range (1-60)', () => {
    expect(() =>
      videoOptionsSchema.parse({ kind: 'video', duration: 0 })
    ).toThrow()
    expect(() =>
      videoOptionsSchema.parse({ kind: 'video', duration: 61 })
    ).toThrow()
    expect(
      videoOptionsSchema.parse({ kind: 'video', duration: 1 }).duration
    ).toBe(1)
    expect(
      videoOptionsSchema.parse({ kind: 'video', duration: 60 }).duration
    ).toBe(60)
  })
})

describe('outcomeOptionsSchema (discriminated union)', () => {
  it('correctly narrows to ImageOptions by kind', () => {
    const result = outcomeOptionsSchema.parse({ kind: 'image' })
    expect(result.kind).toBe('image')
  })

  it('correctly narrows to GifOptions by kind', () => {
    const result = outcomeOptionsSchema.parse({ kind: 'gif', fps: 30 })
    expect(result.kind).toBe('gif')
    if (result.kind === 'gif') {
      expect(result.fps).toBe(30)
    }
  })

  it('correctly narrows to VideoOptions by kind', () => {
    const result = outcomeOptionsSchema.parse({
      kind: 'video',
      videoPrompt: 'test',
    })
    expect(result.kind).toBe('video')
    if (result.kind === 'video') {
      expect(result.videoPrompt).toBe('test')
    }
  })

  it('rejects invalid kind discriminator', () => {
    expect(() => outcomeOptionsSchema.parse({ kind: 'invalid' })).toThrow()
  })
})

describe('createOutcomeSchema', () => {
  it('applies all defaults for empty input', () => {
    const result = createOutcomeSchema.parse({})
    expect(result).toEqual({
      type: null,
      captureStepId: null,
      aiEnabled: true,
      imageGeneration: {
        prompt: '',
        refMedia: [],
        model: 'gemini-2.5-flash-image',
        aspectRatio: '1:1',
      },
      options: null,
    })
  })

  it('accepts valid image outcome configuration', () => {
    const config = {
      type: 'image',
      captureStepId: 'step-123',
      aiEnabled: true,
      imageGeneration: {
        prompt: 'Transform @{step:photo} into a cartoon',
        refMedia: [],
        model: 'gemini-2.5-flash-image',
        aspectRatio: '1:1',
      },
      options: { kind: 'image' },
    }
    const result = createOutcomeSchema.parse(config)
    expect(result.type).toBe('image')
    expect(result.captureStepId).toBe('step-123')
    expect(result.aiEnabled).toBe(true)
    expect(result.options).toEqual({ kind: 'image' })
  })

  it('accepts GIF options with fps and duration', () => {
    const result = createOutcomeSchema.parse({
      type: 'gif',
      options: { kind: 'gif', fps: 30, duration: 5 },
    })
    expect(result.type).toBe('gif')
    expect(result.options).toEqual({ kind: 'gif', fps: 30, duration: 5 })
  })

  it('accepts video options with videoPrompt and duration', () => {
    const result = createOutcomeSchema.parse({
      type: 'video',
      options: { kind: 'video', videoPrompt: 'Zoom in', duration: 10 },
    })
    expect(result.type).toBe('video')
    expect(result.options).toEqual({
      kind: 'video',
      videoPrompt: 'Zoom in',
      duration: 10,
    })
  })

  it('null type is valid (not configured state)', () => {
    const result = createOutcomeSchema.parse({ type: null })
    expect(result.type).toBeNull()
  })

  it('null options is valid', () => {
    const result = createOutcomeSchema.parse({ options: null })
    expect(result.options).toBeNull()
  })

  it('rejects invalid model value', () => {
    const result = createOutcomeSchema.safeParse({
      imageGeneration: { model: 'invalid-model' },
    })
    expect(result.success).toBe(false)
  })
})

// Type inference verification (compile-time checks)
describe('type inference', () => {
  it('infers correct types', () => {
    // These are compile-time checks - if they compile, the types are correct
    const outcome: CreateOutcome = createOutcomeSchema.parse({})
    const outcomeType: CreateOutcomeType = createOutcomeTypeSchema.parse('image')
    const model: AIImageModel = aiImageModelSchema.parse('gemini-2.5-flash-image')
    const aspectRatio: AIImageAspectRatio = aiImageAspectRatioSchema.parse('1:1')
    const imageConfig: ImageGenerationConfig =
      imageGenerationConfigSchema.parse({})
    const imageOpts: ImageOptions = imageOptionsSchema.parse({ kind: 'image' })
    const gifOpts: GifOptions = gifOptionsSchema.parse({ kind: 'gif' })
    const videoOpts: VideoOptions = videoOptionsSchema.parse({ kind: 'video' })
    const outcomeOpts: OutcomeOptions = outcomeOptionsSchema.parse({
      kind: 'image',
    })

    // Runtime assertions to use the variables
    expect(outcome).toBeDefined()
    expect(outcomeType).toBe('image')
    expect(model).toBeDefined()
    expect(aspectRatio).toBeDefined()
    expect(imageConfig).toBeDefined()
    expect(imageOpts.kind).toBe('image')
    expect(gifOpts.kind).toBe('gif')
    expect(videoOpts.kind).toBe('video')
    expect(outcomeOpts).toBeDefined()
  })
})
