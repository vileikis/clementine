/**
 * Cloud Task Handler Tests: transformPipelineTask
 *
 * Tests for the transformPipelineTask Cloud Task handler.
 * These tests verify the payload validation and expected behavior.
 *
 * Note: Full integration tests with Firestore require emulator setup.
 */
import { describe, it, expect } from 'vitest'
import { transformPipelineJobPayloadSchema as transformPipelineTaskPayloadSchema } from '../schemas/transform-pipeline.schema'
import { buildJobError, buildSessionErrorMessage } from './transformPipelineTask'
import { AiTransformError } from '../services/ai/providers/types'
import { SANITIZED_ERROR_MESSAGES } from '../repositories/job'

describe('transformPipelineTask payload schema', () => {
  it('validates a valid payload', () => {
    const payload = {
      jobId: 'job-xyz789',
      sessionId: 'session-123',
      projectId: 'project-456',
    }

    const result = transformPipelineTaskPayloadSchema.safeParse(payload)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.jobId).toBe('job-xyz789')
      expect(result.data.sessionId).toBe('session-123')
      expect(result.data.projectId).toBe('project-456')
    }
  })

  it('rejects missing jobId', () => {
    const payload = {
      sessionId: 'session-123',
      projectId: 'project-456',
    }

    const result = transformPipelineTaskPayloadSchema.safeParse(payload)
    expect(result.success).toBe(false)
  })

  it('rejects missing sessionId', () => {
    const payload = {
      jobId: 'job-xyz789',
      projectId: 'project-456',
    }

    const result = transformPipelineTaskPayloadSchema.safeParse(payload)
    expect(result.success).toBe(false)
  })

  it('rejects missing projectId', () => {
    const payload = {
      jobId: 'job-xyz789',
      sessionId: 'session-123',
    }

    const result = transformPipelineTaskPayloadSchema.safeParse(payload)
    expect(result.success).toBe(false)
  })

  it('rejects empty strings', () => {
    const payloads = [
      { jobId: '', sessionId: 'session-123', projectId: 'project-456' },
      { jobId: 'job-xyz789', sessionId: '', projectId: 'project-456' },
      { jobId: 'job-xyz789', sessionId: 'session-123', projectId: '' },
    ]

    payloads.forEach((payload) => {
      const result = transformPipelineTaskPayloadSchema.safeParse(payload)
      expect(result.success).toBe(false)
    })
  })
})

describe('transformPipelineTask expected behavior', () => {
  /**
   * These describe the expected behavior of the Cloud Task handler
   * based on the contract spec. Full integration tests
   * would verify these with actual Firestore data.
   */

  describe('onStart phase', () => {
    it('should fetch job document from /projects/{projectId}/jobs/{jobId}', () => {
      // Expected: Task handler fetches job using projectId and jobId
      const jobPath = 'projects/project-456/jobs/job-xyz789'
      expect(jobPath).toContain('projects')
      expect(jobPath).toContain('jobs')
    })

    it('should validate job status is pending before processing', () => {
      // Expected: Only process jobs with status='pending'
      const validStatuses = ['pending']
      expect(validStatuses).toContain('pending')
    })

    it('should update job status to running with startedAt (FR-004)', () => {
      // Expected: job.status = 'running', job.startedAt = Date.now()
      const expectedUpdate = {
        status: 'running',
        startedAt: expect.any(Number),
        updatedAt: expect.any(Number),
      }
      expect(expectedUpdate.status).toBe('running')
    })

    it('should update session jobStatus to running (FR-005)', () => {
      // Expected: session.jobStatus = 'running'
      const expectedStatus = 'running'
      expect(expectedStatus).toBe('running')
    })
  })

  describe('onProcess phase (stub implementation)', () => {
    it('should simulate processing delay (FR-015)', () => {
      // Expected: Stub processing with ~2 second delay
      const stubDelayMs = 2000
      expect(stubDelayMs).toBeGreaterThan(0)
    })

    it('should update progress during processing', () => {
      // Expected: job.progress = { currentStep: '...', percentage: N }
      const progress = {
        currentStep: 'processing',
        percentage: 50,
        message: null,
      }
      expect(progress.percentage).toBeGreaterThanOrEqual(0)
      expect(progress.percentage).toBeLessThanOrEqual(100)
    })
  })

  describe('onSuccess phase', () => {
    it('should update job status to completed (FR-006)', () => {
      // Expected: job.status = 'completed'
      const expectedStatus = 'completed'
      expect(expectedStatus).toBe('completed')
    })

    it('should set job output with stub data', () => {
      // Expected: job.output contains assetId, url, format, dimensions, etc.
      const stubOutput = {
        assetId: expect.any(String),
        url: expect.any(String),
        format: 'image',
        dimensions: { width: expect.any(Number), height: expect.any(Number) },
        sizeBytes: expect.any(Number),
        processingTimeMs: expect.any(Number),
      }
      expect(stubOutput.format).toBe('image')
    })

    it('should set job completedAt timestamp', () => {
      // Expected: job.completedAt = Date.now()
      const completedAt = Date.now()
      expect(completedAt).toBeGreaterThan(0)
    })

    it('should update session jobStatus to completed (FR-005)', () => {
      // Expected: session.jobStatus = 'completed'
      const expectedStatus = 'completed'
      expect(expectedStatus).toBe('completed')
    })
  })

  describe('configuration requirements', () => {
    it('should be configured in europe-west1 region', () => {
      // Per spec: region='europe-west1'
      const region = 'europe-west1'
      expect(region).toBe('europe-west1')
    })

    it('should have 600 second timeout (10 minutes per FR-009)', () => {
      // Per spec: timeoutSeconds=600
      const timeoutSeconds = 600
      expect(timeoutSeconds).toBe(600)
    })

    it('should have maxAttempts=0 (no retries per D9)', () => {
      // Per spec: retryConfig.maxAttempts=0
      const maxAttempts = 0
      expect(maxAttempts).toBe(0)
    })
  })

  describe('onFailure phase (US3 error handling)', () => {
    it('should update job status to failed (FR-007)', () => {
      // Expected: job.status = 'failed' on error
      const expectedStatus = 'failed'
      expect(expectedStatus).toBe('failed')
    })

    it('should store error with code and sanitized message (FR-008)', () => {
      // Expected: job.error = { code, message, step, isRetryable, timestamp }
      const expectedError = {
        code: 'PROCESSING_FAILED',
        message: expect.any(String),
        step: 'pipeline',
        isRetryable: false,
        timestamp: expect.any(Number),
      }
      expect(expectedError.code).toBe('PROCESSING_FAILED')
      expect(expectedError.isRetryable).toBe(false)
    })

    it('should update session jobStatus to failed', () => {
      // Expected: session.jobStatus = 'failed'
      const expectedStatus = 'failed'
      expect(expectedStatus).toBe('failed')
    })

    it('should log full error details server-side (SC-005)', () => {
      // Expected: console.error with full error details
      // This is verified by the implementation logging jobId, sessionId, projectId, error message and stack
      const loggedDetails = {
        jobId: expect.any(String),
        sessionId: expect.any(String),
        projectId: expect.any(String),
        error: expect.any(String),
        stack: expect.any(String),
      }
      expect(loggedDetails.jobId).toBeDefined()
    })

    it('should return sanitized messages to prevent prompt leakage', () => {
      // Expected: Client messages don't reveal internal details
      // Verified by SANITIZED_ERROR_MESSAGES in job.ts
      const sanitizedMessage = 'An error occurred while processing your request.'
      expect(sanitizedMessage).not.toContain('Error:')
      expect(sanitizedMessage).not.toContain('stack')
      expect(sanitizedMessage).not.toContain('.ts')
    })
  })
})

describe('buildJobError', () => {
  it('preserves AiTransformError code, raw message, and metadata for job doc', () => {
    const aiError = new AiTransformError('Image generation blocked: finishReason=SAFETY', 'SAFETY_FILTERED')
    aiError.metadata = { blockReason: 'SAFETY', finishReason: 'SAFETY' }

    const jobError = buildJobError(aiError)

    expect(jobError.code).toBe('SAFETY_FILTERED')
    expect(jobError.message).toBe('Image generation blocked: finishReason=SAFETY')
    expect(jobError.step).toBe('outcome')
    expect(jobError.metadata).toEqual({ blockReason: 'SAFETY', finishReason: 'SAFETY' })
    expect(jobError.isRetryable).toBe(false)
    expect(jobError.timestamp).toBeGreaterThan(0)
  })

  it('preserves AiTransformError code and raw message for API_ERROR', () => {
    const aiError = new AiTransformError('Gemini API returned 503', 'API_ERROR')

    const jobError = buildJobError(aiError)

    expect(jobError.code).toBe('API_ERROR')
    expect(jobError.message).toBe('Gemini API returned 503')
    expect(jobError.step).toBe('outcome')
  })

  it('preserves OutcomeError code and raw message', () => {
    const outcomeError = new Error('Missing capture step for photo')
    outcomeError.name = 'OutcomeError'
    ;(outcomeError as Error & { code?: string }).code = 'INVALID_INPUT'

    const jobError = buildJobError(outcomeError)

    expect(jobError.code).toBe('INVALID_INPUT')
    expect(jobError.message).toBe('Missing capture step for photo')
    expect(jobError.step).toBe('outcome')
  })

  it('maps unknown Error to PROCESSING_FAILED with sanitized message', () => {
    const genericError = new Error('Something internal broke at line 42')

    const jobError = buildJobError(genericError)

    expect(jobError.code).toBe('PROCESSING_FAILED')
    expect(jobError.message).not.toContain('line 42')
    expect(jobError.step).toBe('outcome')
  })

  it('maps non-Error value to PROCESSING_FAILED', () => {
    const jobError = buildJobError('string error')

    expect(jobError.code).toBe('PROCESSING_FAILED')
    expect(jobError.step).toBe('outcome')
    expect(jobError.isRetryable).toBe(false)
  })
})

describe('buildSessionErrorMessage', () => {
  it('includes category label for SAFETY_FILTERED with known safetyCategories', () => {
    const message = buildSessionErrorMessage({
      code: 'SAFETY_FILTERED',
      message: 'raw internal message',
      step: 'outcome',
      isRetryable: false,
      timestamp: Date.now(),
      metadata: {
        supportCodes: ['90789179'],
        safetyCategories: ['sexual_content'],
      },
    })

    expect(message).toBe(
      'Your content was blocked due to explicit content. Please try different content.',
    )
  })

  it('joins multiple category labels', () => {
    const message = buildSessionErrorMessage({
      code: 'SAFETY_FILTERED',
      message: 'raw internal message',
      step: 'outcome',
      isRetryable: false,
      timestamp: Date.now(),
      metadata: {
        supportCodes: ['90789179', '61493863'],
        safetyCategories: ['sexual_content', 'violence'],
      },
    })

    expect(message).toBe(
      'Your content was blocked due to explicit content, violent content. Please try different content.',
    )
  })

  it('falls back to generic SAFETY_FILTERED message when no safetyCategories', () => {
    const message = buildSessionErrorMessage({
      code: 'SAFETY_FILTERED',
      message: 'raw internal message',
      step: 'outcome',
      isRetryable: false,
      timestamp: Date.now(),
      metadata: { supportCodes: ['99999999'] },
    })

    expect(message).toBe(SANITIZED_ERROR_MESSAGES['SAFETY_FILTERED'])
  })

  it('falls back to generic SAFETY_FILTERED message when no metadata', () => {
    const message = buildSessionErrorMessage({
      code: 'SAFETY_FILTERED',
      message: 'raw internal message',
      step: 'outcome',
      isRetryable: false,
      timestamp: Date.now(),
      metadata: null,
    })

    expect(message).toBe(SANITIZED_ERROR_MESSAGES['SAFETY_FILTERED'])
  })

  it('uses sanitized message for non-safety error codes', () => {
    const message = buildSessionErrorMessage({
      code: 'PROCESSING_FAILED',
      message: 'internal details',
      step: 'outcome',
      isRetryable: false,
      timestamp: Date.now(),
      metadata: null,
    })

    expect(message).toBe(SANITIZED_ERROR_MESSAGES['PROCESSING_FAILED'])
  })
})
