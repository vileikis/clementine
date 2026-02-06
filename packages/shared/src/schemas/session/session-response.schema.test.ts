/**
 * Session Response Schema Tests
 *
 * Tests for unified response format replacing answers[] and capturedMedia[].
 * Part of Transform v3 - PRD 1A Schema Foundations.
 */
import { describe, expect, it } from 'vitest'
import {
  sessionResponseSchema,
  type SessionResponse,
} from './session-response.schema'

describe('sessionResponseSchema', () => {
  const baseTimestamps = {
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }

  describe('text input response', () => {
    it('accepts valid text input with stepName, stepType, data', () => {
      const response = sessionResponseSchema.parse({
        stepId: 'step-1',
        stepName: 'user_name',
        stepType: 'input.shortText',
        data: 'John Doe',
        ...baseTimestamps,
      })
      expect(response.stepId).toBe('step-1')
      expect(response.stepName).toBe('user_name')
      expect(response.stepType).toBe('input.shortText')
      expect(response.data).toBe('John Doe')
    })
  })

  describe('capture response', () => {
    it('accepts capture response with MediaReference[] in data', () => {
      const mediaRefs = [
        {
          mediaAssetId: 'asset-123',
          url: 'https://storage.example.com/photo.jpg',
          filePath: 'uploads/photo.jpg',
          displayName: 'User Photo',
        },
      ]
      const response = sessionResponseSchema.parse({
        stepId: 'step-2',
        stepName: 'photo',
        stepType: 'capture.photo',
        data: mediaRefs,
        ...baseTimestamps,
      })
      expect(response.stepId).toBe('step-2')
      expect(response.stepType).toBe('capture.photo')
      expect(response.data).toEqual(mediaRefs)
    })
  })

  describe('multi-select response', () => {
    it('accepts multi-select response with MultiSelectOption[] in data', () => {
      const multiSelectOptions = [
        { value: 'opt1', promptFragment: null, promptMedia: null },
        { value: 'opt2', promptFragment: null, promptMedia: null },
      ]
      const response = sessionResponseSchema.parse({
        stepId: 'step-3',
        stepName: 'preferences',
        stepType: 'input.multiSelect',
        data: multiSelectOptions,
        ...baseTimestamps,
      })
      expect(response.stepId).toBe('step-3')
      expect(response.stepType).toBe('input.multiSelect')
      expect(response.data).toEqual(multiSelectOptions)
    })
  })

  describe('required field validation', () => {
    it('fails validation when stepName is missing', () => {
      const result = sessionResponseSchema.safeParse({
        stepId: 'step-1',
        stepType: 'input.shortText',
        ...baseTimestamps,
      })
      expect(result.success).toBe(false)
    })

    it('fails validation when stepId is missing', () => {
      const result = sessionResponseSchema.safeParse({
        stepName: 'user_name',
        stepType: 'input.shortText',
        ...baseTimestamps,
      })
      expect(result.success).toBe(false)
    })

    it('fails validation when stepType is missing', () => {
      const result = sessionResponseSchema.safeParse({
        stepId: 'step-1',
        stepName: 'user_name',
        ...baseTimestamps,
      })
      expect(result.success).toBe(false)
    })
  })

  describe('default values', () => {
    it('defaults data to null when not provided', () => {
      const response = sessionResponseSchema.parse({
        stepId: 'step-1',
        stepName: 'user_name',
        stepType: 'input.shortText',
        ...baseTimestamps,
      })
      expect(response.data).toBeNull()
    })
  })

  describe('timestamp validation', () => {
    it('requires createdAt timestamp', () => {
      const result = sessionResponseSchema.safeParse({
        stepId: 'step-1',
        stepName: 'user_name',
        stepType: 'input.shortText',
        updatedAt: Date.now(),
      })
      expect(result.success).toBe(false)
    })

    it('requires updatedAt timestamp', () => {
      const result = sessionResponseSchema.safeParse({
        stepId: 'step-1',
        stepName: 'user_name',
        stepType: 'input.shortText',
        createdAt: Date.now(),
      })
      expect(result.success).toBe(false)
    })

    it('accepts valid timestamps', () => {
      const now = Date.now()
      const response = sessionResponseSchema.parse({
        stepId: 'step-1',
        stepName: 'user_name',
        stepType: 'input.shortText',
        createdAt: now,
        updatedAt: now,
      })
      expect(response.createdAt).toBe(now)
      expect(response.updatedAt).toBe(now)
    })
  })

  describe('type inference', () => {
    it('infers correct type', () => {
      const response: SessionResponse = sessionResponseSchema.parse({
        stepId: 'step-1',
        stepName: 'user_name',
        stepType: 'input.shortText',
        data: 'test',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      })
      expect(response).toBeDefined()
      expect(response.stepId).toBe('step-1')
    })
  })
})
