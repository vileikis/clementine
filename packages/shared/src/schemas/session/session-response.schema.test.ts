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
    it('accepts valid text input with stepName, stepType, value', () => {
      const response = sessionResponseSchema.parse({
        stepId: 'step-1',
        stepName: 'user_name',
        stepType: 'input.shortText',
        value: 'John Doe',
        context: null,
        ...baseTimestamps,
      })
      expect(response.stepId).toBe('step-1')
      expect(response.stepName).toBe('user_name')
      expect(response.stepType).toBe('input.shortText')
      expect(response.value).toBe('John Doe')
      expect(response.context).toBeNull()
    })
  })

  describe('capture response', () => {
    it('accepts capture response with MediaReference[] in context', () => {
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
        value: null,
        context: mediaRefs,
        ...baseTimestamps,
      })
      expect(response.stepId).toBe('step-2')
      expect(response.stepType).toBe('capture.photo')
      expect(response.value).toBeNull()
      expect(response.context).toEqual(mediaRefs)
    })
  })

  describe('multi-select response', () => {
    it('accepts multi-select response with value array and context', () => {
      const multiSelectContext = [
        { value: 'opt1', label: 'Option 1' },
        { value: 'opt2', label: 'Option 2' },
      ]
      const response = sessionResponseSchema.parse({
        stepId: 'step-3',
        stepName: 'preferences',
        stepType: 'input.multiSelect',
        value: ['opt1', 'opt2'],
        context: multiSelectContext,
        ...baseTimestamps,
      })
      expect(response.stepId).toBe('step-3')
      expect(response.stepType).toBe('input.multiSelect')
      expect(response.value).toEqual(['opt1', 'opt2'])
      expect(response.context).toEqual(multiSelectContext)
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
    it('defaults value to null when not provided', () => {
      const response = sessionResponseSchema.parse({
        stepId: 'step-1',
        stepName: 'user_name',
        stepType: 'input.shortText',
        ...baseTimestamps,
      })
      expect(response.value).toBeNull()
    })

    it('defaults context to null when not provided', () => {
      const response = sessionResponseSchema.parse({
        stepId: 'step-1',
        stepName: 'user_name',
        stepType: 'input.shortText',
        ...baseTimestamps,
      })
      expect(response.context).toBeNull()
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
        value: 'test',
        context: null,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      })
      expect(response).toBeDefined()
      expect(response.stepId).toBe('step-1')
    })
  })
})
