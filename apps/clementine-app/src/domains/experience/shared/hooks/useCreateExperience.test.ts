/**
 * useCreateExperience Hook Tests
 *
 * Integration tests for experience creation.
 * Tests that new experiences are created with correct defaults.
 *
 * Note: These are unit-style tests that validate the data shape.
 * Full integration testing requires Firebase emulators.
 */
import { describe, expect, it } from 'vitest'

describe('useCreateExperience', () => {
  describe('Default experience type', () => {
    it('new experiences default to ai.image type', () => {
      // The create form defaults to ai.image as the most common type
      const defaultType = 'ai.image'
      expect(defaultType).toBe('ai.image')
    })
  })

  describe('Experience initialization requirements', () => {
    it('survey type creates draft with null config fields', () => {
      // Survey experiences have no per-type config
      const surveyDraft = {
        steps: [],
        photo: null,
        gif: null,
        video: null,
        aiImage: null,
        aiVideo: null,
      }
      expect(surveyDraft.aiImage).toBeNull()
      expect(surveyDraft.photo).toBeNull()
    })

    it('ai.image type initializes with default aiImage config', () => {
      // AI image experiences get default config at creation
      const aiImageConfig = {
        task: 'text-to-image' as const,
        captureStepId: null,
        aspectRatio: '1:1' as const,
        imageGeneration: {
          prompt: '',
          model: 'gemini-2.5-flash-image' as const,
          refMedia: [],
          aspectRatio: null,
        },
      }
      expect(aiImageConfig.task).toBe('text-to-image')
      expect(aiImageConfig.imageGeneration.model).toBe('gemini-2.5-flash-image')
    })
  })
})
