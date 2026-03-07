/**
 * AI Video Generation Error Handling Tests
 *
 * Unit tests for the extractVideoUri helper that processes
 * completed Veo API operations and handles safety filter errors.
 */
import { describe, it, expect } from 'vitest'
import { AiTransformError } from '../../ai/providers/types'
import { extractVideoUri } from './aiGenerateVideo'

/**
 * Helper to create a mock completed operation
 */
function createMockOperation(overrides: Record<string, unknown> = {}) {
  return {
    done: true,
    ...overrides,
  } as Parameters<typeof extractVideoUri>[0]
}

// =============================================================================
// extractVideoUri
// =============================================================================

describe('extractVideoUri', () => {
  it('throws generic Error when operation.error is set', () => {
    const operation = createMockOperation({
      error: { message: 'Internal server error' },
    })

    expect(() => extractVideoUri(operation)).toThrow('Video generation failed')
    expect(() => extractVideoUri(operation)).not.toThrow(AiTransformError)
  })

  it('throws AiTransformError with SAFETY_FILTERED when no generated videos + RAI filter reasons', () => {
    const operation = createMockOperation({
      response: {
        generatedVideos: [],
        raiMediaFilteredCount: 1,
        raiMediaFilteredReasons: ['VIOLENCE', 'SEXUALLY_EXPLICIT'],
      },
    })

    expect(() => extractVideoUri(operation)).toThrow(AiTransformError)

    try {
      extractVideoUri(operation)
    } catch (e) {
      const err = e as AiTransformError
      expect(err.code).toBe('SAFETY_FILTERED')
      expect(err.message).toContain('safety policy')
      expect(err.metadata).toEqual({
        raiMediaFilteredCount: 1,
        raiMediaFilteredReasons: ['VIOLENCE', 'SEXUALLY_EXPLICIT'],
      })
    }
  })

  it('includes raiMediaFilteredCount and raiMediaFilteredReasons in metadata', () => {
    const operation = createMockOperation({
      response: {
        generatedVideos: [],
        raiMediaFilteredCount: 3,
        raiMediaFilteredReasons: ['NSFW'],
      },
    })

    expect(() => extractVideoUri(operation)).toThrow(AiTransformError)

    try {
      extractVideoUri(operation)
    } catch (e) {
      const err = e as AiTransformError
      expect(err.metadata!['raiMediaFilteredCount']).toBe(3)
      expect(err.metadata!['raiMediaFilteredReasons']).toEqual(['NSFW'])
    }
  })

  it('throws generic Error when no generated videos and no RAI indicators', () => {
    const operation = createMockOperation({
      response: {
        generatedVideos: [],
        raiMediaFilteredCount: 0,
        raiMediaFilteredReasons: [],
      },
    })

    expect(() => extractVideoUri(operation)).toThrow('No generated videos')
    expect(() => extractVideoUri(operation)).not.toThrow(AiTransformError)
  })

  it('returns URI string on valid operation response', () => {
    const operation = createMockOperation({
      response: {
        generatedVideos: [
          { video: { uri: 'gs://bucket/path/to/video.mp4' } },
        ],
      },
    })

    const uri = extractVideoUri(operation)
    expect(uri).toBe('gs://bucket/path/to/video.mp4')
  })

  it('throws generic Error when video has no URI', () => {
    const operation = createMockOperation({
      response: {
        generatedVideos: [{ video: {} }],
      },
    })

    expect(() => extractVideoUri(operation)).toThrow('No video URI')
    expect(() => extractVideoUri(operation)).not.toThrow(AiTransformError)
  })
})
