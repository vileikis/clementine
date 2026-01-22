/**
 * Session-v2 Helper Tests
 *
 * Unit tests for session-v2 helpers.
 * Tests focus on business logic (hasActiveJob) and verify function signatures.
 * Integration tests with Firestore would require emulator setup.
 */
import { describe, it, expect } from 'vitest'
import { hasActiveJob } from './session-v2'
import type { Session } from '@clementine/shared'

/**
 * Helper to create a minimal valid session for testing
 */
function createMockSession(overrides: Partial<Session> = {}): Session {
  const now = Date.now()
  return {
    id: 'test-session-id',
    projectId: 'test-project-id',
    workspaceId: 'test-workspace-id',
    eventId: null,
    experienceId: 'test-experience-id',
    mode: 'guest',
    configSource: 'published',
    status: 'active',
    answers: [],
    capturedMedia: [],
    resultMedia: null,
    jobId: null,
    jobStatus: null,
    createdBy: null,
    createdAt: now,
    updatedAt: now,
    completedAt: null,
    ...overrides,
  }
}

describe('hasActiveJob', () => {
  it('returns false when jobStatus is null', () => {
    const session = createMockSession({ jobStatus: null })
    expect(hasActiveJob(session)).toBe(false)
  })

  it('returns false when jobStatus is completed', () => {
    const session = createMockSession({ jobStatus: 'completed' })
    expect(hasActiveJob(session)).toBe(false)
  })

  it('returns false when jobStatus is failed', () => {
    const session = createMockSession({ jobStatus: 'failed' })
    expect(hasActiveJob(session)).toBe(false)
  })

  it('returns false when jobStatus is cancelled', () => {
    const session = createMockSession({ jobStatus: 'cancelled' })
    expect(hasActiveJob(session)).toBe(false)
  })

  it('returns true when jobStatus is pending', () => {
    const session = createMockSession({ jobStatus: 'pending' })
    expect(hasActiveJob(session)).toBe(true)
  })

  it('returns true when jobStatus is running', () => {
    const session = createMockSession({ jobStatus: 'running' })
    expect(hasActiveJob(session)).toBe(true)
  })
})

describe('session-v2 module exports', () => {
  it('exports fetchSession function', async () => {
    const { fetchSession } = await import('./session-v2')
    expect(typeof fetchSession).toBe('function')
  })

  it('exports updateSessionJobStatus function', async () => {
    const { updateSessionJobStatus } = await import('./session-v2')
    expect(typeof updateSessionJobStatus).toBe('function')
  })

  it('exports hasActiveJob function', async () => {
    const { hasActiveJob } = await import('./session-v2')
    expect(typeof hasActiveJob).toBe('function')
  })
})
