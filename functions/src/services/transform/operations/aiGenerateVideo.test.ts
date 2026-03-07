/**
 * AI Video Generation Error Handling Tests
 *
 * Unit tests for video operation error classification:
 * - handleVeoOperationError: classifies operation.error using support codes
 * - handleNoGeneratedVideos: classifies empty responses using RAI filter indicators
 * - extractVideoUri: orchestrator that delegates to the above
 * - parseVeoSupportCodes: extracts support codes from error messages
 */
import { describe, it, expect } from 'vitest'
import { AiTransformError } from '../../ai/providers/types'
import {
  extractVideoUri,
  handleVeoOperationError,
  handleNoGeneratedVideos,
  parseVeoSupportCodes,
} from './aiGenerateVideo'

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
// handleVeoOperationError
// =============================================================================

describe('handleVeoOperationError', () => {
  it('throws AiTransformError with SAFETY_FILTERED when support codes present', () => {
    const operationError = {
      code: 3,
      message:
        "Veo could not generate videos because the input image violates Google's Responsible AI practices. Support codes: 63429089",
    }

    expect(() => handleVeoOperationError(operationError)).toThrow(
      AiTransformError,
    )

    try {
      handleVeoOperationError(operationError)
    } catch (e) {
      const err = e as AiTransformError
      expect(err.code).toBe('SAFETY_FILTERED')
      expect(err.metadata).toEqual({
        supportCodes: ['63429089'],
        safetyCategories: ['prohibited_content'],
      })
    }
  })

  it('includes multiple support codes and categories in metadata', () => {
    const operationError = {
      code: 3,
      message: 'Blocked. Support codes: 90789179, 61493863',
    }

    expect(() => handleVeoOperationError(operationError)).toThrow(
      AiTransformError,
    )

    try {
      handleVeoOperationError(operationError)
    } catch (e) {
      const err = e as AiTransformError
      expect(err.code).toBe('SAFETY_FILTERED')
      expect(err.metadata!['supportCodes']).toEqual(['90789179', '61493863'])
      expect(err.metadata!['safetyCategories']).toEqual([
        'sexual_content',
        'violence',
      ])
    }
  })

  it('includes empty safetyCategories when support codes are unknown', () => {
    const operationError = {
      code: 3,
      message: 'Error. Support codes: 99999999',
    }

    expect(() => handleVeoOperationError(operationError)).toThrow(
      AiTransformError,
    )

    try {
      handleVeoOperationError(operationError)
    } catch (e) {
      const err = e as AiTransformError
      expect(err.code).toBe('SAFETY_FILTERED')
      expect(err.metadata).toEqual({
        supportCodes: ['99999999'],
        safetyCategories: [],
      })
    }
  })

  it('throws AiTransformError with API_ERROR on gRPC RESOURCE_EXHAUSTED (8)', () => {
    const operationError = {
      code: 8,
      message: 'Too many requests',
    }

    expect(() => handleVeoOperationError(operationError)).toThrow(
      AiTransformError,
    )

    try {
      handleVeoOperationError(operationError)
    } catch (e) {
      const err = e as AiTransformError
      expect(err.code).toBe('API_ERROR')
      expect(err.message).toContain('rate limited')
    }
  })

  it('throws AiTransformError with API_ERROR on gRPC PERMISSION_DENIED (7)', () => {
    const operationError = {
      code: 7,
      message: 'Caller does not have permission',
    }

    expect(() => handleVeoOperationError(operationError)).toThrow(
      AiTransformError,
    )

    try {
      handleVeoOperationError(operationError)
    } catch (e) {
      const err = e as AiTransformError
      expect(err.code).toBe('API_ERROR')
      expect(err.message).toContain('permission denied')
    }
  })

  it('throws AiTransformError with API_ERROR on PUBLIC_ERROR_MINOR', () => {
    const operationError = {
      code: 13,
      message: 'PUBLIC_ERROR_MINOR: Internal processing exception',
    }

    expect(() => handleVeoOperationError(operationError)).toThrow(
      AiTransformError,
    )

    try {
      handleVeoOperationError(operationError)
    } catch (e) {
      const err = e as AiTransformError
      expect(err.code).toBe('API_ERROR')
      expect(err.message).toContain('model error')
    }
  })

  it('throws generic Error when no recognized error pattern', () => {
    const operationError = {
      code: 13,
      message: 'Internal server error',
    }

    expect(() => handleVeoOperationError(operationError)).toThrow(
      'Video generation failed',
    )
    expect(() => handleVeoOperationError(operationError)).not.toThrow(
      AiTransformError,
    )
  })

  it('throws generic Error when message is missing', () => {
    const operationError = { code: 2 }

    expect(() => handleVeoOperationError(operationError)).toThrow(
      'Video generation failed: Unknown error',
    )
  })
})

// =============================================================================
// handleNoGeneratedVideos
// =============================================================================

describe('handleNoGeneratedVideos', () => {
  it('extracts support codes and categories from reason strings', () => {
    const reason =
      "1 videos were filtered out because they violated Vertex AI's usage guidelines. Support codes: 17301594"

    expect(() =>
      handleNoGeneratedVideos({
        raiMediaFilteredCount: 1,
        raiMediaFilteredReasons: [reason],
      }),
    ).toThrow(AiTransformError)

    try {
      handleNoGeneratedVideos({
        raiMediaFilteredCount: 1,
        raiMediaFilteredReasons: [reason],
      })
    } catch (e) {
      const err = e as AiTransformError
      expect(err.code).toBe('SAFETY_FILTERED')
      expect(err.metadata!['supportCodes']).toEqual(['17301594'])
      expect(err.metadata!['safetyCategories']).toEqual(['child_safety'])
      expect(err.metadata!['raiMediaFilteredCount']).toBe(1)
      expect(err.metadata!['raiMediaFilteredReasons']).toEqual([reason])
    }
  })

  it('throws AiTransformError with SAFETY_FILTERED when RAI filter reasons have no support codes', () => {
    expect(() =>
      handleNoGeneratedVideos({
        raiMediaFilteredCount: 1,
        raiMediaFilteredReasons: ['VIOLENCE', 'SEXUALLY_EXPLICIT'],
      }),
    ).toThrow(AiTransformError)

    try {
      handleNoGeneratedVideos({
        raiMediaFilteredCount: 1,
        raiMediaFilteredReasons: ['VIOLENCE', 'SEXUALLY_EXPLICIT'],
      })
    } catch (e) {
      const err = e as AiTransformError
      expect(err.code).toBe('SAFETY_FILTERED')
      expect(err.message).toContain('safety policy')
      expect(err.metadata).toEqual({
        raiMediaFilteredCount: 1,
        raiMediaFilteredReasons: ['VIOLENCE', 'SEXUALLY_EXPLICIT'],
        supportCodes: [],
        safetyCategories: [],
      })
    }
  })

  it('throws AiTransformError when raiMediaFilteredCount > 0 but no reasons', () => {
    expect(() =>
      handleNoGeneratedVideos({
        raiMediaFilteredCount: 3,
        raiMediaFilteredReasons: [],
      }),
    ).toThrow(AiTransformError)

    try {
      handleNoGeneratedVideos({
        raiMediaFilteredCount: 3,
        raiMediaFilteredReasons: [],
      })
    } catch (e) {
      const err = e as AiTransformError
      expect(err.code).toBe('SAFETY_FILTERED')
      expect(err.metadata!['raiMediaFilteredCount']).toBe(3)
    }
  })

  it('throws generic Error when no RAI indicators', () => {
    expect(() =>
      handleNoGeneratedVideos({
        raiMediaFilteredCount: 0,
        raiMediaFilteredReasons: [],
      }),
    ).toThrow('No generated videos')
    expect(() =>
      handleNoGeneratedVideos({
        raiMediaFilteredCount: 0,
        raiMediaFilteredReasons: [],
      }),
    ).not.toThrow(AiTransformError)
  })

  it('throws generic Error when response has no RAI fields', () => {
    expect(() => handleNoGeneratedVideos({})).toThrow('No generated videos')
  })
})

// =============================================================================
// extractVideoUri (orchestrator)
// =============================================================================

describe('extractVideoUri', () => {
  it('delegates to handleVeoOperationError when operation.error is set', () => {
    const operation = createMockOperation({
      error: {
        code: 3,
        message: 'Blocked. Support codes: 63429089',
      },
    })

    expect(() => extractVideoUri(operation)).toThrow(AiTransformError)
  })

  it('throws generic Error for non-safety operation errors', () => {
    const operation = createMockOperation({
      error: { message: 'Internal server error' },
    })

    expect(() => extractVideoUri(operation)).toThrow('Video generation failed')
    expect(() => extractVideoUri(operation)).not.toThrow(AiTransformError)
  })

  it('delegates to handleNoGeneratedVideos when no videos in response', () => {
    const operation = createMockOperation({
      response: {
        generatedVideos: [],
        raiMediaFilteredCount: 1,
        raiMediaFilteredReasons: ['VIOLENCE'],
      },
    })

    expect(() => extractVideoUri(operation)).toThrow(AiTransformError)
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

// =============================================================================
// parseVeoSupportCodes
// =============================================================================

describe('parseVeoSupportCodes', () => {
  it('extracts a single known support code', () => {
    const result = parseVeoSupportCodes(
      'Veo could not generate videos. Support codes: 63429089',
    )
    expect(result.supportCodes).toEqual(['63429089'])
    expect(result.safetyCategories).toEqual(['prohibited_content'])
  })

  it('extracts multiple support codes with different categories', () => {
    const result = parseVeoSupportCodes(
      'Error. Support codes: 90789179, 61493863',
    )
    expect(result.supportCodes).toEqual(['90789179', '61493863'])
    expect(result.safetyCategories).toEqual(['sexual_content', 'violence'])
  })

  it('deduplicates categories when multiple codes map to the same one', () => {
    const result = parseVeoSupportCodes(
      'Error. Support codes: 89371032, 63429089',
    )
    expect(result.supportCodes).toEqual(['89371032', '63429089'])
    expect(result.safetyCategories).toEqual(['prohibited_content'])
  })

  it('returns empty arrays for unknown support codes', () => {
    const result = parseVeoSupportCodes('Error. Support codes: 99999999')
    expect(result.supportCodes).toEqual(['99999999'])
    expect(result.safetyCategories).toEqual([])
  })

  it('returns empty arrays when no support code in message', () => {
    const result = parseVeoSupportCodes('Generic error with no code')
    expect(result.supportCodes).toEqual([])
    expect(result.safetyCategories).toEqual([])
  })
})
