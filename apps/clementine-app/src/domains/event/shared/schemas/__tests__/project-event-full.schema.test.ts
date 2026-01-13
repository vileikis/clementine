/**
 * Unit tests for ProjectEventFull schema
 *
 * Tests validation for complete event document including admin metadata and config.
 */
import { describe, expect, it } from 'vitest'
import { projectEventFullSchema } from '../project-event-full.schema'

describe('projectEventFullSchema', () => {
  describe('valid data', () => {
    it('should validate complete event document', () => {
      const validEvent = {
        // Admin metadata
        id: 'evt_abc123',
        name: 'Summer Festival 2026',
        status: 'active' as const,
        createdAt: 1735980000000,
        updatedAt: 1735990000000,
        deletedAt: null,

        // Guest-facing configuration
        draftConfig: {
          schemaVersion: 1,
          theme: null,
          overlays: null,
          sharing: null,
          welcome: null,
          share: null,
          shareOptions: null,
        },
        publishedConfig: null,

        // Publish tracking
        draftVersion: 1,
        publishedVersion: null,
        publishedAt: null,
      }

      const result = projectEventFullSchema.parse(validEvent)

      expect(result).toEqual(validEvent)
    })

    it('should validate event with minimal data (no config)', () => {
      const minimalEvent = {
        id: 'evt_123',
        name: 'Test Event',
        status: 'active' as const,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        deletedAt: null,
        draftConfig: null,
        publishedConfig: null,
        draftVersion: 1,
        publishedVersion: null,
        publishedAt: null,
      }

      const result = projectEventFullSchema.parse(minimalEvent)

      expect(result).toEqual(minimalEvent)
    })

    it('should apply defaults for optional fields', () => {
      const eventWithoutOptionals = {
        id: 'evt_123',
        name: 'Test Event',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }

      const result = projectEventFullSchema.parse(eventWithoutOptionals)

      expect(result.status).toBe('active')
      expect(result.deletedAt).toBeNull()
      expect(result.draftConfig).toBeNull()
      expect(result.publishedConfig).toBeNull()
      expect(result.draftVersion).toBe(1)
      expect(result.publishedVersion).toBeNull()
      expect(result.publishedAt).toBeNull()
    })

    it('should validate event with both draft and published config', () => {
      const eventWithPublished = {
        id: 'evt_123',
        name: 'Published Event',
        status: 'active' as const,
        createdAt: 1735980000000,
        updatedAt: 1735990000000,
        deletedAt: null,
        draftConfig: {
          schemaVersion: 1,
          theme: {
            fontFamily: 'Poppins',
            primaryColor: '#FF6B6B',
            text: {
              color: '#1A1A1A',
              alignment: 'center' as const,
            },
            button: {
              backgroundColor: '#FF6B6B',
              textColor: '#FFFFFF',
              radius: 'rounded' as const,
            },
            background: {
              color: '#F5F5F5',
              image: null,
              overlayOpacity: 0.5,
            },
          },
          overlays: null,
          sharing: {
            downloadEnabled: true,
            copyLinkEnabled: true,
            socials: null,
          },
        },
        publishedConfig: {
          schemaVersion: 1,
          theme: null,
          overlays: null,
          sharing: null,
        },
        draftVersion: 2,
        publishedVersion: 1,
        publishedAt: 1735985000000,
      }

      const result = projectEventFullSchema.parse(eventWithPublished)

      expect(result.draftVersion).toBe(2)
      expect(result.publishedVersion).toBe(1)
      expect(result.publishedAt).toBe(1735985000000)
    })

    it('should validate deleted event', () => {
      const deletedEvent = {
        id: 'evt_123',
        name: 'Deleted Event',
        status: 'deleted' as const,
        createdAt: 1735980000000,
        updatedAt: 1735990000000,
        deletedAt: 1735995000000,
        draftConfig: null,
        publishedConfig: null,
        draftVersion: 1,
        publishedVersion: null,
        publishedAt: null,
      }

      const result = projectEventFullSchema.parse(deletedEvent)

      expect(result.status).toBe('deleted')
      expect(result.deletedAt).toBe(1735995000000)
    })
  })

  describe('Firestore-safe patterns', () => {
    it('should use null defaults (not undefined) for optional fields', () => {
      const minimalEvent = {
        id: 'evt_123',
        name: 'Test Event',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }

      const result = projectEventFullSchema.parse(minimalEvent)

      // All optional fields should be null, not undefined (Firestore-safe)
      expect(result.deletedAt).toBeNull()
      expect(result.draftConfig).toBeNull()
      expect(result.publishedConfig).toBeNull()
      expect(result.publishedVersion).toBeNull()
      expect(result.publishedAt).toBeNull()
    })

    it('should allow unknown fields (passthrough)', () => {
      const eventWithUnknownFields = {
        id: 'evt_123',
        name: 'Test Event',
        status: 'active' as const,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        deletedAt: null,
        draftConfig: null,
        publishedConfig: null,
        draftVersion: 1,
        publishedVersion: null,
        publishedAt: null,
        futureField: 'some value',
        anotherUnknown: 42,
      }

      const result = projectEventFullSchema.parse(eventWithUnknownFields)

      // Unknown fields should pass through
      expect(result).toHaveProperty('futureField', 'some value')
      expect(result).toHaveProperty('anotherUnknown', 42)
    })
  })

  describe('validation rules', () => {
    it('should reject invalid status values', () => {
      const invalidEvent = {
        id: 'evt_123',
        name: 'Test Event',
        status: 'invalid_status',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }

      expect(() => projectEventFullSchema.parse(invalidEvent)).toThrow()
    })

    it('should reject missing required fields', () => {
      const missingIdEvent = {
        name: 'Test Event',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }

      expect(() => projectEventFullSchema.parse(missingIdEvent)).toThrow()

      const missingNameEvent = {
        id: 'evt_123',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }

      expect(() => projectEventFullSchema.parse(missingNameEvent)).toThrow()
    })
  })

  describe('version number defaults', () => {
    it('should default draftVersion to 1 (not 0)', () => {
      const eventWithoutVersion = {
        id: 'evt_123',
        name: 'Test Event',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }

      const result = projectEventFullSchema.parse(eventWithoutVersion)

      expect(result.draftVersion).toBe(1) // Starts at 1, not 0
    })

    it('should allow explicit version numbers', () => {
      const eventWithVersions = {
        id: 'evt_123',
        name: 'Test Event',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        draftVersion: 5,
        publishedVersion: 3,
        publishedAt: Date.now(),
      }

      const result = projectEventFullSchema.parse(eventWithVersions)

      expect(result.draftVersion).toBe(5)
      expect(result.publishedVersion).toBe(3)
    })
  })
})
