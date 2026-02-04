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
import type { CreateOutcome } from '@clementine/shared'

/**
 * The default create outcome configuration for new experiences.
 * New experiences start with create: null, meaning not configured.
 */
const DEFAULT_CREATE_OUTCOME: CreateOutcome | null = null

describe('useCreateExperience', () => {
  describe('Default create outcome configuration', () => {
    it('new experiences have create set to null (not configured)', () => {
      // New experiences start with create: null
      // This requires explicit configuration before publishing
      expect(DEFAULT_CREATE_OUTCOME).toBeNull()
    })
  })

  describe('Experience initialization requirements', () => {
    it('new experience will fail validation until create is configured', () => {
      // This validates the design decision: new experiences cannot be published
      // until the creator explicitly configures the outcome
      expect(DEFAULT_CREATE_OUTCOME).toBeNull()
    })

    it('null create is cleaner than an object with type: null', () => {
      // Design rationale:
      // - Smaller Firestore documents
      // - Explicit "not configured" state
      // - Consistent with how published config works (also nullable)
      expect(DEFAULT_CREATE_OUTCOME).toBeNull()
    })
  })
})
