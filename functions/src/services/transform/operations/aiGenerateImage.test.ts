/**
 * AI Image Generation Error Handling Tests
 *
 * Unit tests for the pure helper functions that extract image data
 * from Gemini API responses and handle safety filter errors.
 */
import { describe, it, expect } from 'vitest'
import { FinishReason, type GenerateContentResponse, type Candidate } from '@google/genai'
import { AiTransformError } from '../../ai/providers/types'
import {
  checkPromptBlocked,
  tryExtractImageBuffer,
  throwNoImageError,
  extractImageFromResponse,
} from './aiGenerateImage'

// =============================================================================
// checkPromptBlocked
// =============================================================================

describe('checkPromptBlocked', () => {
  it('no-ops when promptFeedback is absent', () => {
    const response = {} as GenerateContentResponse
    expect(() => checkPromptBlocked(response)).not.toThrow()
  })

  it('no-ops when blockReason is absent', () => {
    const response = {
      promptFeedback: {},
    } as GenerateContentResponse
    expect(() => checkPromptBlocked(response)).not.toThrow()
  })

  it('throws AiTransformError with SAFETY_FILTERED when blockReason is present', () => {
    const response = {
      promptFeedback: {
        blockReason: 'SAFETY',
        blockReasonMessage: 'Content blocked for safety',
      },
    } as GenerateContentResponse

    expect(() => checkPromptBlocked(response)).toThrow(AiTransformError)

    try {
      checkPromptBlocked(response)
    } catch (e) {
      const err = e as AiTransformError
      expect(err.code).toBe('SAFETY_FILTERED')
      expect(err.message).toContain('SAFETY')
      expect(err.metadata).toEqual({
        blockReason: 'SAFETY',
        blockReasonMessage: 'Content blocked for safety',
      })
    }
  })

  it('omits blockReasonMessage from metadata when not provided', () => {
    const response = {
      promptFeedback: {
        blockReason: 'OTHER',
      },
    } as GenerateContentResponse

    try {
      checkPromptBlocked(response)
    } catch (e) {
      const err = e as AiTransformError
      expect(err.metadata).toEqual({ blockReason: 'OTHER' })
      expect(err.metadata).not.toHaveProperty('blockReasonMessage')
    }
  })
})

// =============================================================================
// tryExtractImageBuffer
// =============================================================================

describe('tryExtractImageBuffer', () => {
  it('returns null when candidate has no content', () => {
    const candidate = {} as Candidate
    expect(tryExtractImageBuffer(candidate)).toBeNull()
  })

  it('returns null when candidate has no parts', () => {
    const candidate = { content: {} } as Candidate
    expect(tryExtractImageBuffer(candidate)).toBeNull()
  })

  it('returns null when parts have no inlineData', () => {
    const candidate = {
      content: { parts: [{ text: 'hello' }] },
    } as Candidate
    expect(tryExtractImageBuffer(candidate)).toBeNull()
  })

  it('returns Buffer when inlineData.data is present', () => {
    const base64Data = Buffer.from('test-image-data').toString('base64')
    const candidate = {
      content: {
        parts: [{ inlineData: { data: base64Data, mimeType: 'image/jpeg' } }],
      },
    } as Candidate

    const result = tryExtractImageBuffer(candidate)
    expect(result).toBeInstanceOf(Buffer)
    expect(result!.toString()).toBe('test-image-data')
  })
})

// =============================================================================
// throwNoImageError
// =============================================================================

describe('throwNoImageError', () => {
  it('throws AiTransformError with SAFETY_FILTERED when finishReason=SAFETY', () => {
    const candidate = {
      finishReason: FinishReason.SAFETY,
    } as Candidate

    expect(() => throwNoImageError(candidate)).toThrow(AiTransformError)

    try {
      throwNoImageError(candidate)
    } catch (e) {
      const err = e as AiTransformError
      expect(err.code).toBe('SAFETY_FILTERED')
      expect(err.message).toContain('finishReason=SAFETY')
    }
  })

  it('throws AiTransformError with SAFETY_FILTERED when finishReason=RECITATION', () => {
    const candidate = {
      finishReason: FinishReason.RECITATION,
    } as Candidate

    expect(() => throwNoImageError(candidate)).toThrow(AiTransformError)

    try {
      throwNoImageError(candidate)
    } catch (e) {
      const err = e as AiTransformError
      expect(err.code).toBe('SAFETY_FILTERED')
    }
  })

  it('includes blocked safetyRatings in metadata when present', () => {
    const candidate = {
      finishReason: FinishReason.SAFETY,
      safetyRatings: [
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', probability: 'HIGH', blocked: true },
        { category: 'HARM_CATEGORY_HATE_SPEECH', probability: 'LOW', blocked: false },
      ],
    } as unknown as Candidate

    try {
      throwNoImageError(candidate)
    } catch (e) {
      const err = e as AiTransformError
      expect(err.metadata).toBeDefined()
      expect(err.metadata!['finishReason']).toBe(FinishReason.SAFETY)
      // Only blocked ratings should be included
      const ratings = err.metadata!['safetyRatings'] as Array<{ blocked: boolean }>
      expect(ratings).toHaveLength(1)
      expect(ratings[0]!.blocked).toBe(true)
    }
  })

  it('throws generic Error when finishReason is non-safety (e.g. LANGUAGE)', () => {
    const candidate = {
      finishReason: FinishReason.LANGUAGE,
    } as Candidate

    expect(() => throwNoImageError(candidate)).toThrow(Error)
    expect(() => throwNoImageError(candidate)).not.toThrow(AiTransformError)
  })

  it('throws generic Error when finishReason=STOP', () => {
    const candidate = {
      finishReason: FinishReason.STOP,
    } as Candidate

    expect(() => throwNoImageError(candidate)).toThrow(Error)
    expect(() => throwNoImageError(candidate)).not.toThrow(AiTransformError)
  })

  it('throws generic Error when finishReason is absent', () => {
    const candidate = {} as Candidate

    expect(() => throwNoImageError(candidate)).toThrow(Error)
    expect(() => throwNoImageError(candidate)).not.toThrow(AiTransformError)
  })
})

// =============================================================================
// extractImageFromResponse (integration of helpers)
// =============================================================================

describe('extractImageFromResponse', () => {
  it('throws on prompt-blocked response', () => {
    const response = {
      promptFeedback: { blockReason: 'SAFETY' },
    } as GenerateContentResponse

    expect(() => extractImageFromResponse(response)).toThrow(AiTransformError)
  })

  it('throws on no candidates', () => {
    const response = { candidates: [] } as unknown as GenerateContentResponse

    expect(() => extractImageFromResponse(response)).toThrow('No candidates')
  })

  it('returns buffer on valid response', () => {
    const base64Data = Buffer.from('image-bytes').toString('base64')
    const response = {
      candidates: [
        {
          content: {
            parts: [{ inlineData: { data: base64Data, mimeType: 'image/jpeg' } }],
          },
        },
      ],
    } as unknown as GenerateContentResponse

    const result = extractImageFromResponse(response)
    expect(result).toBeInstanceOf(Buffer)
    expect(result.toString()).toBe('image-bytes')
  })

  it('throws safety error on finishReason=SAFETY with no image data', () => {
    const response = {
      candidates: [
        {
          finishReason: FinishReason.SAFETY,
          content: { parts: [{ text: 'blocked' }] },
        },
      ],
    } as unknown as GenerateContentResponse

    expect(() => extractImageFromResponse(response)).toThrow(AiTransformError)

    try {
      extractImageFromResponse(response)
    } catch (e) {
      expect((e as AiTransformError).code).toBe('SAFETY_FILTERED')
    }
  })
})
