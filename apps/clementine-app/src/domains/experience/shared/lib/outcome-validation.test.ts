/**
 * Outcome Validation Tests
 *
 * Unit tests for validateOutcome function with per-type config architecture.
 *
 * @see specs/072-outcome-schema-redesign
 */
import { describe, expect, it } from 'vitest'
import { isCaptureStep, validateOutcome } from './outcome-validation'
import type {
  AIVideoOutcomeConfig,
  ExperienceStep,
  Outcome,
} from '@clementine/shared'

// Test helpers
function createDefaultOutcome(overrides: Partial<Outcome> = {}): Outcome {
  return {
    type: null,
    photo: null,
    gif: null,
    video: null,
    aiImage: null,
    aiVideo: null,
    ...overrides,
  }
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
  describe('Null outcome (no outcome configured)', () => {
    it('passes when outcome is null - no outcome generation is valid', () => {
      const result = validateOutcome(null, [])

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
  })

  describe('V1: Type must be selected', () => {
    it('fails when type is null', () => {
      const outcome = createDefaultOutcome({ type: null })
      const result = validateOutcome(outcome, [])

      expect(result.valid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0]).toEqual({
        field: 'outcome.type',
        message: 'Select an output type',
      })
    })
  })

  describe('V2: Coming soon types', () => {
    it('fails when type is gif', () => {
      const outcome = createDefaultOutcome({ type: 'gif' })
      const result = validateOutcome(outcome, [])

      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'outcome.type',
        message: 'GIF output is coming soon',
      })
    })

    it('fails when type is video', () => {
      const outcome = createDefaultOutcome({ type: 'video' })
      const result = validateOutcome(outcome, [])

      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'outcome.type',
        message: 'VIDEO output is coming soon',
      })
    })
  })

  describe('V3: Photo type validation', () => {
    it('fails when photo config is missing', () => {
      const outcome = createDefaultOutcome({ type: 'photo', photo: null })
      const result = validateOutcome(outcome, [])

      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'outcome.photo',
        message: 'Photo configuration is missing',
      })
    })

    it('fails when photo captureStepId is empty', () => {
      const outcome = createDefaultOutcome({
        type: 'photo',
        photo: { captureStepId: '', aspectRatio: '1:1' },
      })
      const result = validateOutcome(outcome, [])

      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'outcome.photo.captureStepId',
        message: 'Select a source image step',
      })
    })

    it('fails when photo captureStepId references non-existent step', () => {
      const outcome = createDefaultOutcome({
        type: 'photo',
        photo: { captureStepId: 'non-existent', aspectRatio: '1:1' },
      })
      const result = validateOutcome(outcome, [])

      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'outcome.photo.captureStepId',
        message: 'Selected source step no longer exists',
        stepId: 'non-existent',
      })
    })

    it('fails when photo captureStepId references non-capture step', () => {
      const steps = [createInfoStep('step-1')]
      const outcome = createDefaultOutcome({
        type: 'photo',
        photo: { captureStepId: 'step-1', aspectRatio: '1:1' },
      })
      const result = validateOutcome(outcome, steps)

      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'outcome.photo.captureStepId',
        message: 'Source step must be a capture step',
        stepId: 'step-1',
      })
    })

    it('passes with valid photo configuration', () => {
      const steps = [createCaptureStep('step-1')]
      const outcome = createDefaultOutcome({
        type: 'photo',
        photo: { captureStepId: 'step-1', aspectRatio: '1:1' },
      })
      const result = validateOutcome(outcome, steps)

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
  })

  describe('V4: AI Image type validation', () => {
    it('fails when aiImage config is missing', () => {
      const outcome = createDefaultOutcome({
        type: 'ai.image',
        aiImage: null,
      })
      const result = validateOutcome(outcome, [])

      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'outcome.aiImage',
        message: 'AI Image configuration is missing',
      })
    })

    it('fails when prompt is empty', () => {
      const outcome = createDefaultOutcome({
        type: 'ai.image',
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
      const result = validateOutcome(outcome, [])

      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'outcome.aiImage.imageGeneration.prompt',
        message: 'Prompt is required for AI Image output',
      })
    })

    it('fails when prompt is whitespace', () => {
      const outcome = createDefaultOutcome({
        type: 'ai.image',
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
      const result = validateOutcome(outcome, [])

      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'outcome.aiImage.imageGeneration.prompt',
        message: 'Prompt is required for AI Image output',
      })
    })

    it('fails when i2i has no captureStepId', () => {
      const outcome = createDefaultOutcome({
        type: 'ai.image',
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
      const result = validateOutcome(outcome, [])

      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'outcome.aiImage.captureStepId',
        message: 'Select a source image step',
      })
    })

    it('fails when i2i captureStepId references non-existent step', () => {
      const outcome = createDefaultOutcome({
        type: 'ai.image',
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
      const result = validateOutcome(outcome, [])

      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'outcome.aiImage.captureStepId',
        message: 'Selected source step no longer exists',
        stepId: 'non-existent',
      })
    })

    it('fails with duplicate refMedia displayNames', () => {
      const outcome = createDefaultOutcome({
        type: 'ai.image',
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
      const result = validateOutcome(outcome, [])

      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'outcome.aiImage.imageGeneration.refMedia',
        message: 'Duplicate reference media names: style',
      })
    })

    it('passes with valid t2i configuration', () => {
      const outcome = createDefaultOutcome({
        type: 'ai.image',
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
      const result = validateOutcome(outcome, [])

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('passes with valid i2i configuration', () => {
      const steps = [createCaptureStep('step-1')]
      const outcome = createDefaultOutcome({
        type: 'ai.image',
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
      const result = validateOutcome(outcome, steps)

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('passes t2i even without captureStepId', () => {
      const outcome = createDefaultOutcome({
        type: 'ai.image',
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
      const result = validateOutcome(outcome, [])

      expect(result.valid).toBe(true)
    })
  })

  describe('V5: AI Video type validation', () => {
    const defaultAiVideo: AIVideoOutcomeConfig = {
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

    function createAiVideoOutcome(
      overrides: Partial<AIVideoOutcomeConfig> = {},
    ) {
      return createDefaultOutcome({
        type: 'ai.video',
        aiVideo: {
          ...defaultAiVideo,
          ...overrides,
        },
      })
    }

    it('fails when aiVideo config is missing', () => {
      const outcome = createDefaultOutcome({
        type: 'ai.video',
        aiVideo: null,
      })
      const result = validateOutcome(outcome, [])

      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'outcome.aiVideo',
        message: 'AI Video configuration is missing',
      })
    })

    it('fails when captureStepId is empty', () => {
      const outcome = createAiVideoOutcome({ captureStepId: '' })
      const result = validateOutcome(outcome, [])

      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'outcome.aiVideo.captureStepId',
        message: 'Select a source image step',
      })
    })

    it('fails when videoGeneration prompt is empty', () => {
      const steps = [createCaptureStep('step-1')]
      const outcome = createAiVideoOutcome({
        videoGeneration: {
          prompt: '',
          model: 'veo-3.1-fast-generate-001',
          duration: 6,
          aspectRatio: null,
          refMedia: [],
        },
      })
      const result = validateOutcome(outcome, steps)

      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'outcome.aiVideo.videoGeneration.prompt',
        message: 'Video generation prompt is required',
      })
    })

    it('fails when captureStepId references non-existent step', () => {
      const outcome = createAiVideoOutcome({ captureStepId: 'non-existent' })
      const result = validateOutcome(outcome, [])

      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'outcome.aiVideo.captureStepId',
        message: 'Selected source step no longer exists',
        stepId: 'non-existent',
      })
    })

    it('fails when captureStepId references non-capture step', () => {
      const steps = [createInfoStep('step-1')]
      const outcome = createAiVideoOutcome({ captureStepId: 'step-1' })
      const result = validateOutcome(outcome, steps)

      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'outcome.aiVideo.captureStepId',
        message: 'Source step must be a capture step',
        stepId: 'step-1',
      })
    })

    it('fails with duplicate startFrameImageGen refMedia displayNames', () => {
      const steps = [createCaptureStep('step-1')]
      const outcome = createAiVideoOutcome({
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
      const result = validateOutcome(outcome, steps)

      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'outcome.aiVideo.startFrameImageGen.refMedia',
        message: 'Duplicate reference media names: style',
      })
    })

    it('fails with duplicate endFrameImageGen refMedia displayNames', () => {
      const steps = [createCaptureStep('step-1')]
      const outcome = createAiVideoOutcome({
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
      const result = validateOutcome(outcome, steps)

      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'outcome.aiVideo.endFrameImageGen.refMedia',
        message: 'Duplicate reference media names: ref',
      })
    })

    it('passes with valid ai.video configuration', () => {
      const steps = [createCaptureStep('step-1')]
      const outcome = createAiVideoOutcome()
      const result = validateOutcome(outcome, steps)

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('passes with startFrameImageGen and endFrameImageGen having unique refMedia', () => {
      const steps = [createCaptureStep('step-1')]
      const outcome = createAiVideoOutcome({
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
      const result = validateOutcome(outcome, steps)

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
  })
})
