/**
 * Create Outcome Validation Tests
 *
 * Unit tests for validateCreateOutcome function.
 * Tests all validation rules V1-V8 as specified in data-model.md.
 */
import { describe, expect, it } from 'vitest'
import {
  isCaptureStep,
  validateCreateOutcome,
} from './create-outcome-validation'
import type { CreateOutcome, ExperienceStep } from '@clementine/shared'

// Test helpers
function createDefaultCreateOutcome(
  overrides: Partial<CreateOutcome> = {},
): CreateOutcome {
  return {
    type: 'image',
    captureStepId: null,
    aiEnabled: true,
    imageGeneration: {
      prompt: 'Test prompt',
      refMedia: [],
      model: 'gemini-2.5-flash-image',
      aspectRatio: '1:1',
    },
    options: null,
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

describe('validateCreateOutcome', () => {
  describe('Null create (no outcome configured)', () => {
    it('passes when create is null - no outcome generation is valid', () => {
      const result = validateCreateOutcome(null, [])

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
  })

  describe('V1: Type must be selected', () => {
    it('fails when type is null', () => {
      const create = createDefaultCreateOutcome({ type: null })
      const result = validateCreateOutcome(create, [])

      expect(result.valid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0]).toEqual({
        field: 'create.type',
        message: 'Select an outcome type (Image, GIF, or Video)',
      })
    })

    it('passes when type is image', () => {
      const create = createDefaultCreateOutcome({ type: 'image' })
      const result = validateCreateOutcome(create, [])

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
  })

  describe('V2: Passthrough mode requires source', () => {
    it('fails when aiEnabled is false and no captureStepId', () => {
      const create = createDefaultCreateOutcome({
        aiEnabled: false,
        captureStepId: null,
      })
      const result = validateCreateOutcome(create, [])

      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'create.captureStepId',
        message:
          'Passthrough mode requires a source image. Select a capture step or enable AI generation.',
      })
    })

    it('passes when aiEnabled is false but captureStepId is set', () => {
      const steps = [createCaptureStep('step-1')]
      const create = createDefaultCreateOutcome({
        aiEnabled: false,
        captureStepId: 'step-1',
        imageGeneration: {
          prompt: '',
          refMedia: [],
          model: 'gemini-2.5-flash-image',
          aspectRatio: '1:1',
        },
      })
      const result = validateCreateOutcome(create, steps)

      expect(result.valid).toBe(true)
    })

    it('passes when aiEnabled is true even without captureStepId', () => {
      const create = createDefaultCreateOutcome({
        aiEnabled: true,
        captureStepId: null,
      })
      const result = validateCreateOutcome(create, [])

      expect(result.valid).toBe(true)
    })
  })

  describe('V3: CaptureStepId must reference existing step', () => {
    it('fails when captureStepId references non-existent step', () => {
      const create = createDefaultCreateOutcome({
        captureStepId: 'non-existent-step',
      })
      const result = validateCreateOutcome(create, [])

      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'create.captureStepId',
        message: 'Selected source step no longer exists',
        stepId: 'non-existent-step',
      })
    })

    it('passes when captureStepId references existing capture step', () => {
      const steps = [createCaptureStep('step-1')]
      const create = createDefaultCreateOutcome({ captureStepId: 'step-1' })
      const result = validateCreateOutcome(create, steps)

      expect(result.valid).toBe(true)
    })
  })

  describe('V4: CaptureStepId must reference capture-type step', () => {
    it('fails when captureStepId references non-capture step', () => {
      const steps = [createInfoStep('step-1')]
      const create = createDefaultCreateOutcome({ captureStepId: 'step-1' })
      const result = validateCreateOutcome(create, steps)

      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'create.captureStepId',
        message: 'Source step must be a capture step',
        stepId: 'step-1',
      })
    })
  })

  describe('V5: AI enabled requires prompt', () => {
    it('fails when aiEnabled is true and prompt is empty', () => {
      const create = createDefaultCreateOutcome({
        aiEnabled: true,
        imageGeneration: {
          prompt: '',
          refMedia: [],
          model: 'gemini-2.5-flash-image',
          aspectRatio: '1:1',
        },
      })
      const result = validateCreateOutcome(create, [])

      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'create.imageGeneration.prompt',
        message: 'Prompt is required when AI is enabled',
      })
    })

    it('fails when aiEnabled is true and prompt is whitespace', () => {
      const create = createDefaultCreateOutcome({
        aiEnabled: true,
        imageGeneration: {
          prompt: '   ',
          refMedia: [],
          model: 'gemini-2.5-flash-image',
          aspectRatio: '1:1',
        },
      })
      const result = validateCreateOutcome(create, [])

      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'create.imageGeneration.prompt',
        message: 'Prompt is required when AI is enabled',
      })
    })

    it('passes when aiEnabled is false even without prompt', () => {
      const steps = [createCaptureStep('step-1')]
      const create = createDefaultCreateOutcome({
        aiEnabled: false,
        captureStepId: 'step-1',
        imageGeneration: {
          prompt: '',
          refMedia: [],
          model: 'gemini-2.5-flash-image',
          aspectRatio: '1:1',
        },
      })
      const result = validateCreateOutcome(create, steps)

      expect(result.valid).toBe(true)
    })

    it('passes when aiEnabled is true and prompt is non-empty', () => {
      const create = createDefaultCreateOutcome({
        aiEnabled: true,
        imageGeneration: {
          prompt: 'Transform this photo',
          refMedia: [],
          model: 'gemini-2.5-flash-image',
          aspectRatio: '1:1',
        },
      })
      const result = validateCreateOutcome(create, [])

      expect(result.valid).toBe(true)
    })
  })

  describe('V6: RefMedia displayNames must be unique', () => {
    it('fails when duplicate displayNames exist', () => {
      const create = createDefaultCreateOutcome({
        imageGeneration: {
          prompt: 'Test',
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
          model: 'gemini-2.5-flash-image',
          aspectRatio: '1:1',
        },
      })
      const result = validateCreateOutcome(create, [])

      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'create.imageGeneration.refMedia',
        message: 'Duplicate reference media names: style',
      })
    })

    it('lists all duplicate names in error message', () => {
      const create = createDefaultCreateOutcome({
        imageGeneration: {
          prompt: 'Test',
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
            {
              mediaAssetId: 'asset-3',
              url: 'https://example.com/3.jpg',
              filePath: 'path/3.jpg',
              displayName: 'background',
            },
            {
              mediaAssetId: 'asset-4',
              url: 'https://example.com/4.jpg',
              filePath: 'path/4.jpg',
              displayName: 'background',
            },
          ],
          model: 'gemini-2.5-flash-image',
          aspectRatio: '1:1',
        },
      })
      const result = validateCreateOutcome(create, [])

      expect(result.valid).toBe(false)
      const refMediaError = result.errors.find(
        (e) => e.field === 'create.imageGeneration.refMedia',
      )
      expect(refMediaError?.message).toContain('style')
      expect(refMediaError?.message).toContain('background')
    })

    it('passes with unique displayNames', () => {
      const create = createDefaultCreateOutcome({
        imageGeneration: {
          prompt: 'Test',
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
              displayName: 'background',
            },
          ],
          model: 'gemini-2.5-flash-image',
          aspectRatio: '1:1',
        },
      })
      const result = validateCreateOutcome(create, [])

      expect(result.valid).toBe(true)
    })
  })

  describe('V7: GIF/Video types are coming soon', () => {
    it('fails when type is gif', () => {
      const create = createDefaultCreateOutcome({ type: 'gif' })
      const result = validateCreateOutcome(create, [])

      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'create.type',
        message: 'GIF outcome is coming soon',
      })
    })

    it('fails when type is video', () => {
      const create = createDefaultCreateOutcome({ type: 'video' })
      const result = validateCreateOutcome(create, [])

      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'create.type',
        message: 'VIDEO outcome is coming soon',
      })
    })

    it('passes when type is image', () => {
      const create = createDefaultCreateOutcome({ type: 'image' })
      const result = validateCreateOutcome(create, [])

      expect(result.valid).toBe(true)
    })
  })

  describe('V8: Options kind must match outcome type', () => {
    it('fails when options.kind does not match type', () => {
      const create = createDefaultCreateOutcome({
        type: 'image',
        options: { kind: 'gif', fps: 24, duration: 3 },
      })
      const result = validateCreateOutcome(create, [])

      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'create.options',
        message: 'Options kind must match outcome type',
      })
    })

    it('passes when options.kind matches type', () => {
      const create = createDefaultCreateOutcome({
        type: 'image',
        options: { kind: 'image' },
      })
      const result = validateCreateOutcome(create, [])

      expect(result.valid).toBe(true)
    })

    it('passes when options is null', () => {
      const create = createDefaultCreateOutcome({
        type: 'image',
        options: null,
      })
      const result = validateCreateOutcome(create, [])

      expect(result.valid).toBe(true)
    })
  })

  describe('Multiple errors', () => {
    it('returns all errors when multiple validations fail', () => {
      const create = createDefaultCreateOutcome({
        type: 'gif', // V7 fail
        captureStepId: 'non-existent', // V3 fail
        aiEnabled: true,
        imageGeneration: {
          prompt: '', // V5 fail
          refMedia: [
            {
              mediaAssetId: 'asset-1',
              url: 'https://example.com/1.jpg',
              filePath: 'path/1.jpg',
              displayName: 'dup',
            },
            {
              mediaAssetId: 'asset-2',
              url: 'https://example.com/2.jpg',
              filePath: 'path/2.jpg',
              displayName: 'dup',
            },
          ], // V6 fail
          model: 'gemini-2.5-flash-image',
          aspectRatio: '1:1',
        },
        options: { kind: 'image' }, // V8 fail
      })
      const result = validateCreateOutcome(create, [])

      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThanOrEqual(5)
    })
  })

  describe('Valid configuration', () => {
    it('passes with minimal valid image configuration', () => {
      const create = createDefaultCreateOutcome({
        type: 'image',
        aiEnabled: true,
        imageGeneration: {
          prompt: 'Transform photo',
          refMedia: [],
          model: 'gemini-2.5-flash-image',
          aspectRatio: '1:1',
        },
      })
      const result = validateCreateOutcome(create, [])

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('passes with full valid image configuration', () => {
      const steps = [createCaptureStep('step-1')]
      const create = createDefaultCreateOutcome({
        type: 'image',
        captureStepId: 'step-1',
        aiEnabled: true,
        imageGeneration: {
          prompt: 'Transform photo into art',
          refMedia: [
            {
              mediaAssetId: 'asset-1',
              url: 'https://example.com/1.jpg',
              filePath: 'path/1.jpg',
              displayName: 'style',
            },
          ],
          model: 'gemini-2.5-flash-image',
          aspectRatio: '1:1',
        },
        options: { kind: 'image' },
      })
      const result = validateCreateOutcome(create, steps)

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('passes with valid passthrough configuration', () => {
      const steps = [createCaptureStep('step-1')]
      const create = createDefaultCreateOutcome({
        type: 'image',
        captureStepId: 'step-1',
        aiEnabled: false,
        imageGeneration: {
          prompt: '',
          refMedia: [],
          model: 'gemini-2.5-flash-image',
          aspectRatio: '1:1',
        },
        options: { kind: 'image' },
      })
      const result = validateCreateOutcome(create, steps)

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
  })
})
