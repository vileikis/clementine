/**
 * Unit tests for ProjectEventConfig schema
 *
 * Tests validation rules, Firestore-safe patterns, and schema evolution support.
 */
import { describe, expect, it } from 'vitest'
import {
  CURRENT_CONFIG_VERSION,
  overlaysConfigSchema,
  projectEventConfigSchema,
  sharingConfigSchema,
} from '../project-event-config.schema'

describe('projectEventConfigSchema', () => {
  describe('valid data', () => {
    it('should validate minimal valid config (all nulls)', () => {
      const validConfig = {
        schemaVersion: 1,
        theme: null,
        overlays: null,
        sharing: null,
      }

      const result = projectEventConfigSchema.parse(validConfig)

      expect(result).toEqual(validConfig)
    })

    it('should apply defaults for missing optional fields', () => {
      const minimalConfig = {
        schemaVersion: 1,
      }

      const result = projectEventConfigSchema.parse(minimalConfig)

      expect(result.theme).toBeNull()
      expect(result.overlays).toBeNull()
      expect(result.sharing).toBeNull()
    })

    it('should use CURRENT_CONFIG_VERSION as default for schemaVersion', () => {
      const configWithoutVersion = {}

      const result = projectEventConfigSchema.parse(configWithoutVersion)

      expect(result.schemaVersion).toBe(CURRENT_CONFIG_VERSION)
      expect(result.schemaVersion).toBe(1)
    })

    it('should validate config with complete theme', () => {
      const configWithTheme = {
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
            radius: 'md' as const,
          },
          background: {
            color: '#F5F5F5',
            image: 'https://example.com/bg.jpg',
            overlayOpacity: 0.5,
          },
        },
        overlays: null,
        sharing: null,
      }

      const result = projectEventConfigSchema.parse(configWithTheme)

      expect(result.theme).toEqual(configWithTheme.theme)
    })

    it('should validate config with overlays', () => {
      const configWithOverlays = {
        schemaVersion: 1,
        theme: null,
        overlays: {
          '1:1': 'https://storage.googleapis.com/square.png',
          '9:16': 'https://storage.googleapis.com/portrait.png',
        },
        sharing: null,
      }

      const result = projectEventConfigSchema.parse(configWithOverlays)

      expect(result.overlays).toEqual(configWithOverlays.overlays)
    })

    it('should validate config with sharing settings', () => {
      const configWithSharing = {
        schemaVersion: 1,
        theme: null,
        overlays: null,
        sharing: {
          download: true,
          copyLink: true,
          email: false,
          instagram: true,
          facebook: true,
          linkedin: false,
          twitter: false,
          tiktok: false,
          telegram: false,
        },
      }

      const result = projectEventConfigSchema.parse(configWithSharing)

      expect(result.sharing).toEqual(configWithSharing.sharing)
    })
  })

  describe('Firestore-safe patterns', () => {
    it('should use null defaults (not undefined) for optional fields', () => {
      const emptyConfig = {}

      const result = projectEventConfigSchema.parse(emptyConfig)

      // All optional fields should be null, not undefined (Firestore-safe)
      expect(result.theme).toBeNull()
      expect(result.overlays).toBeNull()
      expect(result.sharing).toBeNull()
    })

    it('should allow unknown fields (passthrough)', () => {
      const configWithUnknownFields = {
        schemaVersion: 1,
        theme: null,
        overlays: null,
        sharing: null,
        unknownField: 'future feature',
        anotherUnknown: 123,
      }

      const result = projectEventConfigSchema.parse(configWithUnknownFields)

      // Unknown fields should pass through
      expect(result).toHaveProperty('unknownField', 'future feature')
      expect(result).toHaveProperty('anotherUnknown', 123)
    })
  })

  describe('overlaysConfigSchema', () => {
    it('should validate null overlays', () => {
      const result = overlaysConfigSchema.parse(null)
      expect(result).toBeNull()
    })

    it('should validate overlays with valid URLs', () => {
      const validOverlays = {
        '1:1': 'https://example.com/square.png',
        '9:16': 'https://example.com/portrait.png',
      }

      const result = overlaysConfigSchema.parse(validOverlays)
      expect(result).toEqual(validOverlays)
    })

    it('should validate partial overlays (null for missing aspect ratios)', () => {
      const partialOverlays = {
        '1:1': 'https://example.com/square.png',
        '9:16': null,
      }

      const result = overlaysConfigSchema.parse(partialOverlays)
      expect(result).toEqual(partialOverlays)
    })

    it('should reject invalid URLs', () => {
      const invalidOverlays = {
        '1:1': 'not-a-url',
        '9:16': null,
      }

      expect(() => overlaysConfigSchema.parse(invalidOverlays)).toThrow()
    })
  })

  describe('sharingConfigSchema', () => {
    it('should apply defaults (download and copyLink enabled, socials disabled)', () => {
      const emptySharing = {}

      const result = sharingConfigSchema.parse(emptySharing)

      expect(result.download).toBe(true)
      expect(result.copyLink).toBe(true)
      expect(result.email).toBe(false)
      expect(result.instagram).toBe(false)
      expect(result.facebook).toBe(false)
      expect(result.linkedin).toBe(false)
      expect(result.twitter).toBe(false)
      expect(result.tiktok).toBe(false)
      expect(result.telegram).toBe(false)
    })

    it('should validate sharing with all options disabled', () => {
      const noSharing = {
        download: false,
        copyLink: false,
        email: false,
        instagram: false,
        facebook: false,
        linkedin: false,
        twitter: false,
        tiktok: false,
        telegram: false,
      }

      const result = sharingConfigSchema.parse(noSharing)

      expect(result.download).toBe(false)
      expect(result.copyLink).toBe(false)
      expect(result.email).toBe(false)
      expect(result.instagram).toBe(false)
    })

    it('should validate partial sharing config (some socials enabled)', () => {
      const partialSharing = {
        instagram: true,
        facebook: true,
      }

      const result = sharingConfigSchema.parse(partialSharing)

      // Explicitly provided values
      expect(result.instagram).toBe(true)
      expect(result.facebook).toBe(true)
      // Defaults applied
      expect(result.download).toBe(true)
      expect(result.copyLink).toBe(true)
      expect(result.email).toBe(false)
      expect(result.linkedin).toBe(false)
    })
  })
})
