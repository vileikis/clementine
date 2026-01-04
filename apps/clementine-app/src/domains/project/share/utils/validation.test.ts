/**
 * Unit tests for validation utilities
 * Feature: 011-project-share-dialog
 */

import { describe, expect, it } from 'vitest'
import {
  guestUrlSchema,
  projectIdSchema,
  qrCodeErrorLevelSchema,
  qrCodeSizeSchema,
  safeValidateProjectId,
  validateGuestUrl,
  validateProjectId,
} from './validation'

describe('projectIdSchema', () => {
  it('should validate valid project IDs', () => {
    expect(projectIdSchema.parse('test-project-123')).toBe('test-project-123')
    expect(projectIdSchema.parse('project_abc')).toBe('project_abc')
    expect(projectIdSchema.parse('123')).toBe('123')
    expect(projectIdSchema.parse('a-b_c-d_e')).toBe('a-b_c-d_e')
  })

  it('should reject empty project IDs', () => {
    expect(() => projectIdSchema.parse('')).toThrow(
      'Project ID cannot be empty',
    )
  })

  it('should reject project IDs that are too long', () => {
    const longId = 'a'.repeat(1501)
    expect(() => projectIdSchema.parse(longId)).toThrow(
      'Project ID exceeds maximum length',
    )
  })

  it('should reject project IDs with invalid characters', () => {
    expect(() => projectIdSchema.parse('test@project')).toThrow(
      'Project ID can only contain letters, numbers, hyphens, and underscores',
    )
    expect(() => projectIdSchema.parse('test project')).toThrow()
    expect(() => projectIdSchema.parse('test#project')).toThrow()
  })
})

describe('guestUrlSchema', () => {
  it('should validate valid guest URLs', () => {
    const url = 'https://app.clementine.com/guest/test-project-123'
    expect(guestUrlSchema.parse(url)).toBe(url)
  })

  it('should reject non-HTTPS URLs', () => {
    const url = 'http://app.clementine.com/guest/test-project-123'
    expect(() => guestUrlSchema.parse(url)).toThrow(
      'URL must use HTTPS for security',
    )
  })

  it('should reject URLs without /guest/ path', () => {
    const url = 'https://app.clementine.com/test-project-123'
    expect(() => guestUrlSchema.parse(url)).toThrow(
      'URL must include /guest/ path segment',
    )
  })

  it('should reject invalid URL formats', () => {
    expect(() => guestUrlSchema.parse('not-a-url')).toThrow(
      'Invalid URL format',
    )
  })
})

describe('qrCodeSizeSchema', () => {
  it('should validate valid QR code sizes', () => {
    expect(qrCodeSizeSchema.parse(256)).toBe(256)
    expect(qrCodeSizeSchema.parse(512)).toBe(512)
    expect(qrCodeSizeSchema.parse(1024)).toBe(1024)
  })

  it('should reject invalid sizes', () => {
    expect(() => qrCodeSizeSchema.parse(128)).toThrow()
    expect(() => qrCodeSizeSchema.parse(1000)).toThrow()
  })
})

describe('qrCodeErrorLevelSchema', () => {
  it('should validate valid error levels', () => {
    expect(qrCodeErrorLevelSchema.parse('L')).toBe('L')
    expect(qrCodeErrorLevelSchema.parse('M')).toBe('M')
    expect(qrCodeErrorLevelSchema.parse('Q')).toBe('Q')
    expect(qrCodeErrorLevelSchema.parse('H')).toBe('H')
  })

  it('should reject invalid error levels', () => {
    expect(() => qrCodeErrorLevelSchema.parse('X')).toThrow()
    expect(() => qrCodeErrorLevelSchema.parse('low')).toThrow()
  })
})

describe('validateProjectId', () => {
  it('should return branded ProjectId for valid input', () => {
    const result = validateProjectId('test-project-123')
    expect(result).toBe('test-project-123')
  })

  it('should throw for invalid input', () => {
    expect(() => validateProjectId('')).toThrow()
    expect(() => validateProjectId('test@project')).toThrow()
  })
})

describe('validateGuestUrl', () => {
  it('should return branded GuestUrl for valid input', () => {
    const url = 'https://app.clementine.com/guest/test-project-123'
    const result = validateGuestUrl(url)
    expect(result).toBe(url)
  })

  it('should throw for invalid input', () => {
    expect(() =>
      validateGuestUrl('http://app.clementine.com/guest/test'),
    ).toThrow()
    expect(() => validateGuestUrl('https://app.clementine.com/test')).toThrow()
  })
})

describe('safeValidateProjectId', () => {
  it('should return [ProjectId, null] for valid input', () => {
    const [id, error] = safeValidateProjectId('test-project-123')
    expect(id).toBe('test-project-123')
    expect(error).toBeNull()
  })

  it('should return [null, error message] for invalid input', () => {
    const [id, error] = safeValidateProjectId('')
    expect(id).toBeNull()
    expect(error).toContain('Project ID cannot be empty')
  })

  it('should return descriptive error messages', () => {
    const [, error] = safeValidateProjectId('test@project')
    expect(error).toContain('Project ID can only contain')
  })
})
