/**
 * Unit tests for Experience schema
 *
 * Tests validation for complete experience document including version fields.
 */
import { describe, expect, it } from 'vitest'
import { experienceSchema } from '../experience.schema'

describe('experienceSchema', () => {
  describe('version fields', () => {
    it('should default draftVersion to 1', () => {
      const minimalExperience = {
        id: 'exp_123',
        name: 'Test Experience',
        profile: 'freeform' as const,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        draft: { steps: [] },
      }

      const result = experienceSchema.parse(minimalExperience)

      expect(result.draftVersion).toBe(1)
    })

    it('should default publishedVersion to null', () => {
      const minimalExperience = {
        id: 'exp_123',
        name: 'Test Experience',
        profile: 'freeform' as const,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        draft: { steps: [] },
      }

      const result = experienceSchema.parse(minimalExperience)

      expect(result.publishedVersion).toBeNull()
    })

    it('should allow explicit version numbers', () => {
      const experienceWithVersions = {
        id: 'exp_123',
        name: 'Test Experience',
        profile: 'freeform' as const,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        draft: { steps: [] },
        draftVersion: 5,
        publishedVersion: 3,
      }

      const result = experienceSchema.parse(experienceWithVersions)

      expect(result.draftVersion).toBe(5)
      expect(result.publishedVersion).toBe(3)
    })

    it('should handle backward compatibility - experience without version fields', () => {
      // Simulates loading an existing experience that was created before versioning
      const legacyExperience = {
        id: 'exp_legacy',
        name: 'Legacy Experience',
        profile: 'survey' as const,
        createdAt: 1735980000000,
        updatedAt: 1735990000000,
        draft: {
          steps: [{ id: 'step_1', type: 'info', config: {} }],
        },
        published: {
          steps: [{ id: 'step_1', type: 'info', config: {} }],
        },
        publishedAt: 1735985000000,
        publishedBy: 'user_123',
        // No draftVersion or publishedVersion fields
      }

      const result = experienceSchema.parse(legacyExperience)

      // Should get default values
      expect(result.draftVersion).toBe(1)
      expect(result.publishedVersion).toBeNull()
    })
  })

  describe('version state scenarios', () => {
    it('should support "never published" state (publishedVersion: null)', () => {
      const neverPublished = {
        id: 'exp_new',
        name: 'New Experience',
        profile: 'freeform' as const,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        draft: { steps: [] },
        draftVersion: 3,
        publishedVersion: null,
        published: null,
      }

      const result = experienceSchema.parse(neverPublished)

      expect(result.draftVersion).toBe(3)
      expect(result.publishedVersion).toBeNull()
      expect(result.published).toBeNull()
    })

    it('should support "synced" state (draftVersion === publishedVersion)', () => {
      const synced = {
        id: 'exp_synced',
        name: 'Synced Experience',
        profile: 'freeform' as const,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        draft: { steps: [{ id: 'step_1', type: 'info', config: {} }] },
        published: { steps: [{ id: 'step_1', type: 'info', config: {} }] },
        draftVersion: 5,
        publishedVersion: 5,
        publishedAt: Date.now(),
      }

      const result = experienceSchema.parse(synced)

      expect(result.draftVersion).toBe(5)
      expect(result.publishedVersion).toBe(5)
    })

    it('should support "has changes" state (draftVersion > publishedVersion)', () => {
      const hasChanges = {
        id: 'exp_changed',
        name: 'Changed Experience',
        profile: 'freeform' as const,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        draft: {
          steps: [{ id: 'step_1', type: 'info', config: { updated: true } }],
        },
        published: { steps: [{ id: 'step_1', type: 'info', config: {} }] },
        draftVersion: 8,
        publishedVersion: 5,
        publishedAt: Date.now() - 10000,
      }

      const result = experienceSchema.parse(hasChanges)

      expect(result.draftVersion).toBe(8)
      expect(result.publishedVersion).toBe(5)
      expect(result.draftVersion).toBeGreaterThan(result.publishedVersion!)
    })
  })

  describe('Firestore-safe patterns', () => {
    it('should use null defaults (not undefined) for optional fields', () => {
      const minimalExperience = {
        id: 'exp_123',
        name: 'Test Experience',
        profile: 'freeform' as const,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        draft: { steps: [] },
      }

      const result = experienceSchema.parse(minimalExperience)

      // All optional fields should be null, not undefined (Firestore-safe)
      expect(result.media).toBeNull()
      expect(result.deletedAt).toBeNull()
      expect(result.published).toBeNull()
      expect(result.publishedVersion).toBeNull()
      expect(result.publishedAt).toBeNull()
      expect(result.publishedBy).toBeNull()
    })
  })
})
