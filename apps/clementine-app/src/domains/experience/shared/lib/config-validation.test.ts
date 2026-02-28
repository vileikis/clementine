/**
 * Config Validation Tests
 *
 * Unit tests for validateConfig function with discriminated union config.
 *
 * @see specs/083-config-discriminated-union
 */
import { describe, expect, it } from 'vitest'
import { isCaptureStep, validateConfig } from './config-validation'
import type {
  AIVideoConfig,
  ExperienceConfig,
  ExperienceStep,
} from '@clementine/shared'

// Test helpers — build discriminated union config variants

function createSurveyConfig(): ExperienceConfig {
  return { type: 'survey', steps: [] } as ExperienceConfig
}

function createPhotoConfig(
  photo: { captureStepId: string; aspectRatio: string } = {
    captureStepId: '',
    aspectRatio: '1:1',
  },
): ExperienceConfig {
  return { type: 'photo', steps: [], photo } as ExperienceConfig
}

function createAiImageConfig(
  aiImage: {
    task: string
    captureStepId: string | null
    aspectRatio: string
    imageGeneration: {
      prompt: string
      model: string
      refMedia: {
        mediaAssetId: string
        url: string
        filePath: string
        displayName: string
      }[]
      aspectRatio: string | null
    }
  } = {
    task: 'text-to-image',
    captureStepId: null,
    aspectRatio: '1:1',
    imageGeneration: {
      prompt: '',
      model: 'gemini-2.5-flash-image',
      refMedia: [],
      aspectRatio: null,
    },
  },
): ExperienceConfig {
  return { type: 'ai.image', steps: [], aiImage } as ExperienceConfig
}

function createGifConfig(): ExperienceConfig {
  return {
    type: 'gif',
    steps: [],
    gif: { captureStepId: '', aspectRatio: '1:1' },
  } as ExperienceConfig
}

function createVideoConfig(): ExperienceConfig {
  return {
    type: 'video',
    steps: [],
    video: { captureStepId: '', aspectRatio: '9:16' },
  } as ExperienceConfig
}

const defaultAiVideo: AIVideoConfig = {
  task: 'image-to-video',
  captureStepId: 'step-1',
  aspectRatio: '9:16',
  startFrameImageGen: null,
  endFrameImageGen: null,
  videoGeneration: {
    prompt: 'Animate this',
    model: 'veo-3.1-fast-generate-001',
    duration: 6,
    aspectRatio: null,
    refMedia: [],
  },
}

function createAiVideoConfig(
  overrides: Partial<AIVideoConfig> = {},
): ExperienceConfig {
  return {
    type: 'ai.video',
    steps: [],
    aiVideo: { ...defaultAiVideo, ...overrides },
  } as ExperienceConfig
}

function createCaptureStep(id: string): ExperienceStep {
  return {
    id,
    type: 'capture.photo',
    name: 'Take Photo',
    config: {
      instructionText: 'Take a photo',
      aspectRatio: '1:1',
      facingMode: 'user',
      cameraOverlayMedia: null,
    },
  } as ExperienceStep
}

function createInfoStep(id: string): ExperienceStep {
  return {
    id,
    type: 'info',
    name: 'Info',
    config: {
      title: 'Welcome',
      description: 'Welcome to the experience',
      media: null,
    },
  } as ExperienceStep
}

describe('isCaptureStep', () => {
  it('returns true for capture.photo step', () => {
    const step = createCaptureStep('step-1')
    expect(isCaptureStep(step)).toBe(true)
  })

  it('returns false for info step', () => {
    const step = createInfoStep('step-1')
    expect(isCaptureStep(step)).toBe(false)
  })
})

describe('validateConfig', () => {
  describe('Survey type (no per-type config)', () => {
    it('passes for survey type - no outcome generation needed', () => {
      const result = validateConfig(createSurveyConfig(), [])

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
  })

  describe('Coming soon types', () => {
    it('fails when type is gif', () => {
      const result = validateConfig(createGifConfig(), [])

      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'type',
        message: 'GIF output is coming soon',
      })
    })

    it('fails when type is video', () => {
      const result = validateConfig(createVideoConfig(), [])

      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'type',
        message: 'VIDEO output is coming soon',
      })
    })
  })

  describe('Photo type validation', () => {
    it('fails when photo captureStepId is empty', () => {
      const config = createPhotoConfig({
        captureStepId: '',
        aspectRatio: '1:1',
      })
      const result = validateConfig(config, [])

      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'photo.captureStepId',
        message: 'Select a source image step',
      })
    })

    it('fails when photo captureStepId references non-existent step', () => {
      const config = createPhotoConfig({
        captureStepId: 'non-existent',
        aspectRatio: '1:1',
      })
      const result = validateConfig(config, [])

      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'photo.captureStepId',
        message: 'Selected source step no longer exists',
        stepId: 'non-existent',
      })
    })

    it('fails when photo captureStepId references non-capture step', () => {
      const steps = [createInfoStep('step-1')]
      const config = createPhotoConfig({
        captureStepId: 'step-1',
        aspectRatio: '1:1',
      })
      const result = validateConfig(config, steps)

      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'photo.captureStepId',
        message: 'Source step must be a capture step',
        stepId: 'step-1',
      })
    })

    it('passes with valid photo configuration', () => {
      const steps = [createCaptureStep('step-1')]
      const config = createPhotoConfig({
        captureStepId: 'step-1',
        aspectRatio: '1:1',
      })
      const result = validateConfig(config, steps)

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
  })

  describe('AI Image type validation', () => {
    it('fails when prompt is empty', () => {
      const config = createAiImageConfig({
        task: 'text-to-image',
        captureStepId: null,
        aspectRatio: '1:1',
        imageGeneration: {
          prompt: '',
          model: 'gemini-2.5-flash-image',
          refMedia: [],
          aspectRatio: null,
        },
      })
      const result = validateConfig(config, [])

      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'aiImage.imageGeneration.prompt',
        message: 'Prompt is required for AI Image output',
      })
    })

    it('fails when prompt is whitespace', () => {
      const config = createAiImageConfig({
        task: 'text-to-image',
        captureStepId: null,
        aspectRatio: '1:1',
        imageGeneration: {
          prompt: '   ',
          model: 'gemini-2.5-flash-image',
          refMedia: [],
          aspectRatio: null,
        },
      })
      const result = validateConfig(config, [])

      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'aiImage.imageGeneration.prompt',
        message: 'Prompt is required for AI Image output',
      })
    })

    it('fails when i2i has no captureStepId', () => {
      const config = createAiImageConfig({
        task: 'image-to-image',
        captureStepId: null,
        aspectRatio: '1:1',
        imageGeneration: {
          prompt: 'Transform photo',
          model: 'gemini-2.5-flash-image',
          refMedia: [],
          aspectRatio: null,
        },
      })
      const result = validateConfig(config, [])

      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'aiImage.captureStepId',
        message: 'Select a source image step',
      })
    })

    it('fails when i2i captureStepId references non-existent step', () => {
      const config = createAiImageConfig({
        task: 'image-to-image',
        captureStepId: 'non-existent',
        aspectRatio: '1:1',
        imageGeneration: {
          prompt: 'Transform photo',
          model: 'gemini-2.5-flash-image',
          refMedia: [],
          aspectRatio: null,
        },
      })
      const result = validateConfig(config, [])

      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'aiImage.captureStepId',
        message: 'Selected source step no longer exists',
        stepId: 'non-existent',
      })
    })

    it('fails with duplicate refMedia displayNames', () => {
      const config = createAiImageConfig({
        task: 'text-to-image',
        captureStepId: null,
        aspectRatio: '1:1',
        imageGeneration: {
          prompt: 'Test',
          model: 'gemini-2.5-flash-image',
          refMedia: [
            {
              mediaAssetId: 'asset-1',
              url: 'https://example.com/1.jpg',
              filePath: 'path/1.jpg',
              displayName: 'style',
            },
            {
              mediaAssetId: 'asset-2',
              url: 'https://example.com/2.jpg',
              filePath: 'path/2.jpg',
              displayName: 'style',
            },
          ],
          aspectRatio: null,
        },
      })
      const result = validateConfig(config, [])

      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'aiImage.imageGeneration.refMedia',
        message: 'Duplicate reference media names: style',
      })
    })

    it('passes with valid t2i configuration', () => {
      const config = createAiImageConfig({
        task: 'text-to-image',
        captureStepId: null,
        aspectRatio: '1:1',
        imageGeneration: {
          prompt: 'Generate a beautiful landscape',
          model: 'gemini-2.5-flash-image',
          refMedia: [],
          aspectRatio: null,
        },
      })
      const result = validateConfig(config, [])

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('passes with valid i2i configuration', () => {
      const steps = [createCaptureStep('step-1')]
      const config = createAiImageConfig({
        task: 'image-to-image',
        captureStepId: 'step-1',
        aspectRatio: '1:1',
        imageGeneration: {
          prompt: 'Transform photo into art',
          model: 'gemini-2.5-flash-image',
          refMedia: [
            {
              mediaAssetId: 'asset-1',
              url: 'https://example.com/1.jpg',
              filePath: 'path/1.jpg',
              displayName: 'style',
            },
          ],
          aspectRatio: null,
        },
      })
      const result = validateConfig(config, steps)

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('passes t2i even without captureStepId', () => {
      const config = createAiImageConfig({
        task: 'text-to-image',
        captureStepId: null,
        aspectRatio: '1:1',
        imageGeneration: {
          prompt: 'Generate an image',
          model: 'gemini-2.5-flash-image',
          refMedia: [],
          aspectRatio: null,
        },
      })
      const result = validateConfig(config, [])

      expect(result.valid).toBe(true)
    })
  })

  describe('AI Video type validation', () => {
    it('fails when captureStepId is empty', () => {
      const config = createAiVideoConfig({ captureStepId: '' })
      const result = validateConfig(config, [])

      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'aiVideo.captureStepId',
        message: 'Select a source image step',
      })
    })

    it('fails when videoGeneration prompt is empty', () => {
      const steps = [createCaptureStep('step-1')]
      const config = createAiVideoConfig({
        videoGeneration: {
          prompt: '',
          model: 'veo-3.1-fast-generate-001',
          duration: 6,
          aspectRatio: null,
          refMedia: [],
        },
      })
      const result = validateConfig(config, steps)

      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'aiVideo.videoGeneration.prompt',
        message: 'Video generation prompt is required',
      })
    })

    it('fails when captureStepId references non-existent step', () => {
      const config = createAiVideoConfig({ captureStepId: 'non-existent' })
      const result = validateConfig(config, [])

      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'aiVideo.captureStepId',
        message: 'Selected source step no longer exists',
        stepId: 'non-existent',
      })
    })

    it('fails when captureStepId references non-capture step', () => {
      const steps = [createInfoStep('step-1')]
      const config = createAiVideoConfig({ captureStepId: 'step-1' })
      const result = validateConfig(config, steps)

      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'aiVideo.captureStepId',
        message: 'Source step must be a capture step',
        stepId: 'step-1',
      })
    })

    it('fails with duplicate startFrameImageGen refMedia displayNames', () => {
      const steps = [createCaptureStep('step-1')]
      const config = createAiVideoConfig({
        startFrameImageGen: {
          prompt: 'Start frame',
          model: 'gemini-2.5-flash-image',
          refMedia: [
            {
              mediaAssetId: 'a1',
              url: 'https://example.com/1.jpg',
              filePath: 'p/1.jpg',
              displayName: 'style',
            },
            {
              mediaAssetId: 'a2',
              url: 'https://example.com/2.jpg',
              filePath: 'p/2.jpg',
              displayName: 'style',
            },
          ],
          aspectRatio: null,
        },
      })
      const result = validateConfig(config, steps)

      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'aiVideo.startFrameImageGen.refMedia',
        message: 'Duplicate reference media names: style',
      })
    })

    it('fails with duplicate endFrameImageGen refMedia displayNames', () => {
      const steps = [createCaptureStep('step-1')]
      const config = createAiVideoConfig({
        endFrameImageGen: {
          prompt: 'End frame',
          model: 'gemini-2.5-flash-image',
          refMedia: [
            {
              mediaAssetId: 'a1',
              url: 'https://example.com/1.jpg',
              filePath: 'p/1.jpg',
              displayName: 'ref',
            },
            {
              mediaAssetId: 'a2',
              url: 'https://example.com/2.jpg',
              filePath: 'p/2.jpg',
              displayName: 'ref',
            },
          ],
          aspectRatio: null,
        },
      })
      const result = validateConfig(config, steps)

      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'aiVideo.endFrameImageGen.refMedia',
        message: 'Duplicate reference media names: ref',
      })
    })

    it('passes with valid ai.video configuration', () => {
      const steps = [createCaptureStep('step-1')]
      const config = createAiVideoConfig()
      const result = validateConfig(config, steps)

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('passes with startFrameImageGen and endFrameImageGen having unique refMedia', () => {
      const steps = [createCaptureStep('step-1')]
      const config = createAiVideoConfig({
        startFrameImageGen: {
          prompt: 'Start',
          model: 'gemini-2.5-flash-image',
          refMedia: [
            {
              mediaAssetId: 'a1',
              url: 'https://example.com/1.jpg',
              filePath: 'p/1.jpg',
              displayName: 'style-a',
            },
          ],
          aspectRatio: null,
        },
        endFrameImageGen: {
          prompt: 'End',
          model: 'gemini-2.5-flash-image',
          refMedia: [
            {
              mediaAssetId: 'a2',
              url: 'https://example.com/2.jpg',
              filePath: 'p/2.jpg',
              displayName: 'style-b',
            },
          ],
          aspectRatio: null,
        },
      })
      const result = validateConfig(config, steps)

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
  })
})
