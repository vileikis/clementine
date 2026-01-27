/**
 * Job Helper Tests
 *
 * Unit tests for job helpers.
 * Tests focus on pure business logic (buildJobData, createSanitizedError) and verify function signatures.
 * Integration tests with Firestore would require emulator setup.
 */
import { describe, it, expect } from 'vitest'
import {
  buildJobData,
  createSanitizedError,
  SANITIZED_ERROR_MESSAGES,
} from './job'
import type { JobSnapshot } from '@clementine/shared'

/**
 * Helper to create a minimal valid job snapshot for testing
 */
function createMockSnapshot(overrides: Partial<JobSnapshot> = {}): JobSnapshot {
  return {
    sessionInputs: {
      answers: [],
      capturedMedia: [],
    },
    transformConfig: {
      nodes: [],
      variableMappings: [],
      outputFormat: null,
    },
    projectContext: {
      overlay: null,
      applyOverlay: false,
      experienceRef: null,
    },
    versions: {
      experienceVersion: 1,
      eventVersion: null,
    },
    ...overrides,
  }
}

describe('buildJobData', () => {
  it('creates job data with correct structure', () => {
    const snapshot = createMockSnapshot()
    const result = buildJobData({
      projectId: 'project-123',
      sessionId: 'session-456',
      experienceId: 'exp-789',
      stepId: 'transform-step',
      snapshot,
    })

    expect(result['projectId']).toBe('project-123')
    expect(result['sessionId']).toBe('session-456')
    expect(result['experienceId']).toBe('exp-789')
    expect(result['stepId']).toBe('transform-step')
    expect(result['snapshot']).toEqual(snapshot)
  })

  it('sets initial status to pending', () => {
    const result = buildJobData({
      projectId: 'p',
      sessionId: 's',
      experienceId: 'e',
      stepId: null,
      snapshot: createMockSnapshot(),
    })

    expect(result['status']).toBe('pending')
  })

  it('sets null values for optional fields', () => {
    const result = buildJobData({
      projectId: 'p',
      sessionId: 's',
      experienceId: 'e',
      stepId: null,
      snapshot: createMockSnapshot(),
    })

    expect(result['progress']).toBeNull()
    expect(result['output']).toBeNull()
    expect(result['error']).toBeNull()
    expect(result['startedAt']).toBeNull()
    expect(result['completedAt']).toBeNull()
  })

  it('sets timestamps to current time', () => {
    const before = Date.now()
    const result = buildJobData({
      projectId: 'p',
      sessionId: 's',
      experienceId: 'e',
      stepId: null,
      snapshot: createMockSnapshot(),
    })
    const after = Date.now()

    expect(result['createdAt']).toBeGreaterThanOrEqual(before)
    expect(result['createdAt']).toBeLessThanOrEqual(after)
    expect(result['updatedAt']).toBeGreaterThanOrEqual(before)
    expect(result['updatedAt']).toBeLessThanOrEqual(after)
    expect(result['createdAt']).toBe(result['updatedAt'])
  })

  it('accepts null stepId', () => {
    const result = buildJobData({
      projectId: 'p',
      sessionId: 's',
      experienceId: 'e',
      stepId: null,
      snapshot: createMockSnapshot(),
    })

    expect(result['stepId']).toBeNull()
  })
})

describe('createSanitizedError', () => {
  it('creates error with known code', () => {
    const error = createSanitizedError('TIMEOUT')

    expect(error.code).toBe('TIMEOUT')
    expect(error.message).toBe(SANITIZED_ERROR_MESSAGES['TIMEOUT'])
    expect(error.isRetryable).toBe(false)
    expect(error.step).toBeNull()
  })

  it('creates error with step information', () => {
    const error = createSanitizedError('PROCESSING_FAILED', 'ai.imageGeneration')

    expect(error.code).toBe('PROCESSING_FAILED')
    expect(error.step).toBe('ai.imageGeneration')
  })

  it('uses UNKNOWN message for unrecognized code', () => {
    const error = createSanitizedError('SOME_NEW_ERROR_CODE')

    expect(error.code).toBe('SOME_NEW_ERROR_CODE')
    expect(error.message).toBe(SANITIZED_ERROR_MESSAGES['UNKNOWN'])
  })

  it('sets timestamp to current time', () => {
    const before = Date.now()
    const error = createSanitizedError('INVALID_INPUT')
    const after = Date.now()

    expect(error.timestamp).toBeGreaterThanOrEqual(before)
    expect(error.timestamp).toBeLessThanOrEqual(after)
  })

  it('all errors are non-retryable per spec D9', () => {
    const errorCodes = [
      'INVALID_INPUT',
      'PROCESSING_FAILED',
      'AI_MODEL_ERROR',
      'STORAGE_ERROR',
      'TIMEOUT',
      'CANCELLED',
      'UNKNOWN',
    ]

    errorCodes.forEach((code) => {
      const error = createSanitizedError(code)
      expect(error.isRetryable).toBe(false)
    })
  })
})

describe('SANITIZED_ERROR_MESSAGES', () => {
  it('has message for all expected error codes', () => {
    const expectedCodes = [
      'INVALID_INPUT',
      'PROCESSING_FAILED',
      'AI_MODEL_ERROR',
      'STORAGE_ERROR',
      'TIMEOUT',
      'CANCELLED',
      'UNKNOWN',
    ]

    expectedCodes.forEach((code) => {
      const message = SANITIZED_ERROR_MESSAGES[code]
      expect(message).toBeDefined()
      expect(typeof message).toBe('string')
      expect(message!.length).toBeGreaterThan(0)
    })
  })

  it('messages do not contain technical details', () => {
    // Verify messages are client-friendly and don't leak implementation details
    Object.values(SANITIZED_ERROR_MESSAGES).forEach((message) => {
      // Should not contain stack traces, file paths, or internal errors
      expect(message).not.toMatch(/Error:|Exception:|at\s+\w+/)
      expect(message).not.toMatch(/\.ts|\.js|node_modules/)
    })
  })
})

describe('job module exports', () => {
  it('exports createJob function', async () => {
    const { createJob } = await import('./job')
    expect(typeof createJob).toBe('function')
  })

  it('exports fetchJob function', async () => {
    const { fetchJob } = await import('./job')
    expect(typeof fetchJob).toBe('function')
  })

  it('exports updateJobStatus function', async () => {
    const { updateJobStatus } = await import('./job')
    expect(typeof updateJobStatus).toBe('function')
  })

  it('exports updateJobProgress function', async () => {
    const { updateJobProgress } = await import('./job')
    expect(typeof updateJobProgress).toBe('function')
  })

  it('exports updateJobOutput function', async () => {
    const { updateJobOutput } = await import('./job')
    expect(typeof updateJobOutput).toBe('function')
  })

  it('exports updateJobComplete function', async () => {
    const { updateJobComplete } = await import('./job')
    expect(typeof updateJobComplete).toBe('function')
  })

  it('exports updateJobError function', async () => {
    const { updateJobError } = await import('./job')
    expect(typeof updateJobError).toBe('function')
  })

  it('exports updateJobStarted function', async () => {
    const { updateJobStarted } = await import('./job')
    expect(typeof updateJobStarted).toBe('function')
  })

  it('exports buildJobData function', async () => {
    const { buildJobData } = await import('./job')
    expect(typeof buildJobData).toBe('function')
  })

  it('exports createSanitizedError function', async () => {
    const { createSanitizedError } = await import('./job')
    expect(typeof createSanitizedError).toBe('function')
  })
})

describe('TIMEOUT error code (US4)', () => {
  it('has TIMEOUT error code for 10-minute timeout per FR-009', () => {
    expect(SANITIZED_ERROR_MESSAGES['TIMEOUT']).toBeDefined()
    expect(SANITIZED_ERROR_MESSAGES['TIMEOUT']).toContain('too long')
  })

  it('TIMEOUT error is non-retryable', () => {
    const error = createSanitizedError('TIMEOUT')
    expect(error.isRetryable).toBe(false)
  })

  it('TIMEOUT error has sanitized message', () => {
    const error = createSanitizedError('TIMEOUT')
    expect(error.message).toBe('Processing took too long and was cancelled.')
    // Should not reveal actual timeout duration or technical details
    expect(error.message).not.toContain('600')
    expect(error.message).not.toContain('10 minute')
  })
})
