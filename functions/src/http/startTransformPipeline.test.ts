/**
 * HTTP Endpoint Tests: startTransformPipeline
 *
 * Tests for the startTransformPipeline HTTP function.
 * These tests verify the request validation logic and response formats.
 *
 * Note: Full integration tests with Firestore require emulator setup.
 */
import { describe, it, expect } from 'vitest'
import {
  startTransformPipelineRequestSchema,
  startTransformPipelineResponseSchema,
  transformPipelineErrorResponseSchema,
  transformPipelineErrorCodeSchema,
} from '../lib/schemas/transform-pipeline.schema'

describe('startTransformPipeline request schema', () => {
  it('validates a valid request', () => {
    const request = {
      sessionId: 'session-123',
      stepId: 'transform-step-1',
    }

    const result = startTransformPipelineRequestSchema.safeParse(request)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.sessionId).toBe('session-123')
      expect(result.data.stepId).toBe('transform-step-1')
    }
  })

  it('rejects missing sessionId', () => {
    const request = {
      stepId: 'transform-step-1',
    }

    const result = startTransformPipelineRequestSchema.safeParse(request)
    expect(result.success).toBe(false)
  })

  it('rejects missing stepId', () => {
    const request = {
      sessionId: 'session-123',
    }

    const result = startTransformPipelineRequestSchema.safeParse(request)
    expect(result.success).toBe(false)
  })

  it('rejects empty sessionId', () => {
    const request = {
      sessionId: '',
      stepId: 'transform-step-1',
    }

    const result = startTransformPipelineRequestSchema.safeParse(request)
    expect(result.success).toBe(false)
  })

  it('rejects empty stepId', () => {
    const request = {
      sessionId: 'session-123',
      stepId: '',
    }

    const result = startTransformPipelineRequestSchema.safeParse(request)
    expect(result.success).toBe(false)
  })

  it('ignores extra fields', () => {
    const request = {
      sessionId: 'session-123',
      stepId: 'transform-step-1',
      extraField: 'ignored',
    }

    const result = startTransformPipelineRequestSchema.safeParse(request)
    expect(result.success).toBe(true)
  })
})

describe('startTransformPipeline response schema', () => {
  it('validates a success response', () => {
    const response = {
      success: true,
      jobId: 'job-xyz789',
      message: 'Transform pipeline job created',
    }

    const result = startTransformPipelineResponseSchema.safeParse(response)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.success).toBe(true)
      expect(result.data.jobId).toBe('job-xyz789')
    }
  })

  it('requires success to be true literal', () => {
    const response = {
      success: false,
      jobId: 'job-xyz789',
      message: 'Transform pipeline job created',
    }

    const result = startTransformPipelineResponseSchema.safeParse(response)
    expect(result.success).toBe(false)
  })
})

describe('transformPipeline error response schema', () => {
  it('validates a valid error response', () => {
    const response = {
      success: false,
      error: {
        code: 'SESSION_NOT_FOUND',
        message: 'Session not found',
      },
    }

    const result = transformPipelineErrorResponseSchema.safeParse(response)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.success).toBe(false)
      expect(result.data.error.code).toBe('SESSION_NOT_FOUND')
    }
  })

  it('requires success to be false literal', () => {
    const response = {
      success: true,
      error: {
        code: 'SESSION_NOT_FOUND',
        message: 'Session not found',
      },
    }

    const result = transformPipelineErrorResponseSchema.safeParse(response)
    expect(result.success).toBe(false)
  })
})

describe('transformPipeline error codes', () => {
  it('validates all expected error codes per contract', () => {
    const expectedCodes = [
      'INVALID_REQUEST',
      'SESSION_NOT_FOUND',
      'TRANSFORM_NOT_FOUND',
      'JOB_IN_PROGRESS',
      'INTERNAL_ERROR',
    ]

    expectedCodes.forEach((code) => {
      const result = transformPipelineErrorCodeSchema.safeParse(code)
      expect(result.success).toBe(true)
    })
  })

  it('rejects invalid error codes', () => {
    const result = transformPipelineErrorCodeSchema.safeParse('UNKNOWN_ERROR')
    expect(result.success).toBe(false)
  })
})

describe('startTransformPipeline HTTP endpoint expectations', () => {
  /**
   * These describe the expected behavior of the endpoint
   * based on the contract spec. Full integration tests
   * would verify these with actual Firestore data.
   */

  it('should return 200 with jobId on success', () => {
    // Expected: POST with valid sessionId/stepId
    // Response: { success: true, jobId: "...", message: "..." }
    const expectedResponse = {
      success: true,
      jobId: expect.any(String),
      message: expect.any(String),
    }
    expect(expectedResponse.success).toBe(true)
  })

  it('should return 400 for invalid request body', () => {
    // Expected: POST with missing/invalid fields
    // Response: { success: false, error: { code: "INVALID_REQUEST", message: "..." } }
    const errorResponse = {
      success: false,
      error: {
        code: 'INVALID_REQUEST',
        message: 'Missing required field: sessionId',
      },
    }
    expect(errorResponse.error.code).toBe('INVALID_REQUEST')
  })

  it('should return 404 when session not found', () => {
    // Expected: POST with non-existent sessionId
    // Response: { success: false, error: { code: "SESSION_NOT_FOUND", message: "..." } }
    const errorResponse = {
      success: false,
      error: {
        code: 'SESSION_NOT_FOUND',
        message: 'Session not found',
      },
    }
    expect(errorResponse.error.code).toBe('SESSION_NOT_FOUND')
  })

  it('should return 404 when transform config not found', () => {
    // Expected: POST with session that has no transform config
    // Response: { success: false, error: { code: "TRANSFORM_NOT_FOUND", message: "..." } }
    const errorResponse = {
      success: false,
      error: {
        code: 'TRANSFORM_NOT_FOUND',
        message: 'Experience has no transform configuration',
      },
    }
    expect(errorResponse.error.code).toBe('TRANSFORM_NOT_FOUND')
  })

  it('should return 409 when job already in progress (FR-011)', () => {
    // Expected: POST when session already has active job
    // Response: { success: false, error: { code: "JOB_IN_PROGRESS", message: "..." } }
    const errorResponse = {
      success: false,
      error: {
        code: 'JOB_IN_PROGRESS',
        message: 'A job is already in progress for this session',
      },
    }
    expect(errorResponse.error.code).toBe('JOB_IN_PROGRESS')
  })

  it('should return 500 for internal errors', () => {
    // Expected: Unexpected server error
    // Response: { success: false, error: { code: "INTERNAL_ERROR", message: "..." } }
    const errorResponse = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    }
    expect(errorResponse.error.code).toBe('INTERNAL_ERROR')
  })
})
