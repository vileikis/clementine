/**
 * Outcome Validation Tests
 *
 * Unit tests for validateOutcome function with per-type config architecture.
 *
 * @see specs/081-experience-type-flattening
 */
import { describe, expect, it } from 'vitest'
import { isCaptureStep, validateOutcome } from './outcome-validation'
import type {
  AIVideoConfig,
  ExperienceConfig,
  ExperienceStep,
  ExperienceType,
} from '@clementine/shared'

// Test helpers
function createDefaultConfig(
  overrides: Partial<ExperienceConfig> = {},
): ExperienceConfig {
  return {
    steps: [],
    photo: null,
    gif: null,
    video: null,
    aiImage: null,
    aiVideo: null,
    ...overrides,
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

describe('validateOutcome', () => {
  describe('Survey type (no per-type config)', () => {
    it('passes for survey type - no outcome generation needed', () => {
      const result = validateOutcome('survey', null, [])

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('passes for survey type even with config', () => {
      const config = createDefaultConfig()
      const result = validateOutcome('survey', config, [])

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
  })

  describe('Null config', () => {
    it('passes when config is null', () => {
      const result = validateOutcome('photo', null, [])

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
  })

  describe('Coming soon types', () => {
    it('fails when type is gif', () => {
      const config = createDefaultConfig()
      const result = validateOutcome('gif', config, [])

      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'type',
        message: 'GIF output is coming soon',
      })
    })

    it('fails when type is video', () => {
      const config = createDefaultConfig()
      const result = validateOutcome('video', config, [])

      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'type',
        message: 'VIDEO output is coming soon',
      })
    })
  })

  describe('Photo type validation', () => {
    const type: ExperienceType = 'photo'

    it('fails when photo config is missing', () => {
      const config = createDefaultConfig({ photo: null })
      const result = validateOutcome(type, config, [])

      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'photo',
        message: 'Photo configuration is missing',
      })
    })

    it('fails when photo captureStepId is empty', () => {
      const config = createDefaultConfig({
        photo: { captureStepId: '', aspectRatio: '1:1' },
      })
      const result = validateOutcome(type, config, [])

      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'photo.captureStepId',
        message: 'Select a source image step',
      })
    })

    it('fails when photo captureStepId references non-existent step', () => {
      const config = createDefaultConfig({
        photo: { captureStepId: 'non-existent', aspectRatio: '1:1' },
      })
      const result = validateOutcome(type, config, [])

      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'photo.captureStepId',
        message: 'Selected source step no longer exists',
        stepId: 'non-existent',
      })
    })

    it('fails when photo captureStepId references non-capture step', () => {
      const steps = [createInfoStep('step-1')]
      const config = createDefaultConfig({
        photo: { captureStepId: 'step-1', aspectRatio: '1:1' },
      })
      const result = validateOutcome(type, config, steps)

      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'photo.captureStepId',
        message: 'Source step must be a capture step',
        stepId: 'step-1',
      })
    })

    it('passes with valid photo configuration', () => {
      const steps = [createCaptureStep('step-1')]
      const config = createDefaultConfig({
        photo: { captureStepId: 'step-1', aspectRatio: '1:1' },
      })
      const result = validateOutcome(type, config, steps)

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
  })

  describe('AI Image type validation', () => {
    const type: ExperienceType = 'ai.image'

    it('fails when aiImage config is missing', () => {
      const config = createDefaultConfig({ aiImage: null })
      const result = validateOutcome(type, config, [])

      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'aiImage',
        message: 'AI Image configuration is missing',
      })
    })

    it('fails when prompt is empty', () => {
      const config = createDefaultConfig({
        aiImage: {
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
      })
      const result = validateOutcome(type, config, [])

      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'aiImage.imageGeneration.prompt',
        message: 'Prompt is required for AI Image output',
      })
    })

    it('fails when prompt is whitespace', () => {
      const config = createDefaultConfig({
        aiImage: {
          task: 'text-to-image',
          captureStepId: null,
          aspectRatio: '1:1',
          imageGeneration: {
            prompt: '   ',
            model: 'gemini-2.5-flash-image',
            refMedia: [],
            aspectRatio: null,
          },
        },
      })
      const result = validateOutcome(type, config, [])

      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'aiImage.imageGeneration.prompt',
        message: 'Prompt is required for AI Image output',
      })
    })

    it('fails when i2i has no captureStepId', () => {
      const config = createDefaultConfig({
        aiImage: {
          task: 'image-to-image',
          captureStepId: null,
          aspectRatio: '1:1',
          imageGeneration: {
            prompt: 'Transform photo',
            model: 'gemini-2.5-flash-image',
            refMedia: [],
            aspectRatio: null,
          },
        },
      })
      const result = validateOutcome(type, config, [])

      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'aiImage.captureStepId',
        message: 'Select a source image step',
      })
    })

    it('fails when i2i captureStepId references non-existent step', () => {
      const config = createDefaultConfig({
        aiImage: {
          task: 'image-to-image',
          captureStepId: 'non-existent',
          aspectRatio: '1:1',
          imageGeneration: {
            prompt: 'Transform photo',
            model: 'gemini-2.5-flash-image',
            refMedia: [],
            aspectRatio: null,
          },
        },
      })
      const result = validateOutcome(type, config, [])

      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'aiImage.captureStepId',
        message: 'Selected source step no longer exists',
        stepId: 'non-existent',
      })
    })

    it('fails with duplicate refMedia displayNames', () => {
      const config = createDefaultConfig({
        aiImage: {
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
        },
      })
      const result = validateOutcome(type, config, [])

      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'aiImage.imageGeneration.refMedia',
        message: 'Duplicate reference media names: style',
      })
    })

    it('passes with valid t2i configuration', () => {
      const config = createDefaultConfig({
        aiImage: {
          task: 'text-to-image',
          captureStepId: null,
          aspectRatio: '1:1',
          imageGeneration: {
            prompt: 'Generate a beautiful landscape',
            model: 'gemini-2.5-flash-image',
            refMedia: [],
            aspectRatio: null,
          },
        },
      })
      const result = validateOutcome(type, config, [])

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('passes with valid i2i configuration', () => {
      const steps = [createCaptureStep('step-1')]
      const config = createDefaultConfig({
        aiImage: {
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
        },
      })
      const result = validateOutcome(type, config, steps)

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('passes t2i even without captureStepId', () => {
      const config = createDefaultConfig({
        aiImage: {
          task: 'text-to-image',
          captureStepId: null,
          aspectRatio: '1:1',
          imageGeneration: {
            prompt: 'Generate an image',
            model: 'gemini-2.5-flash-image',
            refMedia: [],
            aspectRatio: null,
          },
        },
      })
      const result = validateOutcome(type, config, [])

      expect(result.valid).toBe(true)
    })
  })

  describe('AI Video type validation', () => {
    const type: ExperienceType = 'ai.video'

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
      return createDefaultConfig({
        aiVideo: {
          ...defaultAiVideo,
          ...overrides,
        },
      })
    }

    it('fails when aiVideo config is missing', () => {
      const config = createDefaultConfig({ aiVideo: null })
      const result = validateOutcome(type, config, [])

      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'aiVideo',
        message: 'AI Video configuration is missing',
      })
    })

    it('fails when captureStepId is empty', () => {
      const config = createAiVideoConfig({ captureStepId: '' })
      const result = validateOutcome(type, config, [])

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
      const result = validateOutcome(type, config, steps)

      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'aiVideo.videoGeneration.prompt',
        message: 'Video generation prompt is required',
      })
    })

    it('fails when captureStepId references non-existent step', () => {
      const config = createAiVideoConfig({ captureStepId: 'non-existent' })
      const result = validateOutcome(type, config, [])

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
      const result = validateOutcome(type, config, steps)

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
      const result = validateOutcome(type, config, steps)

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
      const result = validateOutcome(type, config, steps)

      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'aiVideo.endFrameImageGen.refMedia',
        message: 'Duplicate reference media names: ref',
      })
    })

    it('passes with valid ai.video configuration', () => {
      const steps = [createCaptureStep('step-1')]
      const config = createAiVideoConfig()
      const result = validateOutcome(type, config, steps)

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
      const result = validateOutcome(type, config, steps)

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
  })
})
