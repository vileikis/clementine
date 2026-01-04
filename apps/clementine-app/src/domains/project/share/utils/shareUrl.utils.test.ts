/**
 * Unit tests for URL generation utilities
 * Feature: 011-project-share-dialog
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  extractProjectIdFromGuestUrl,
  generateGuestUrl,
} from './shareUrl.utils'
import type { GuestUrl } from '../types'

describe('generateGuestUrl', () => {
  const originalLocation = window.location

  beforeEach(() => {
    // Mock window.location.origin
    delete (window as { location?: unknown }).location
    window.location = { origin: 'https://app.clementine.com' } as Location
  })

  afterEach(() => {
    window.location = originalLocation
  })

  it('should generate valid HTTPS guest URL', () => {
    const url = generateGuestUrl('test-project-123')
    expect(url).toBe('https://app.clementine.com/guest/test-project-123')
  })

  it('should work with localhost in development', () => {
    window.location = { origin: 'http://localhost:3000' } as Location

    // This should throw because localhost uses HTTP, not HTTPS
    // Guest URLs must be HTTPS for security
    expect(() => generateGuestUrl('test-project-123')).toThrow(
      'URL must use HTTPS',
    )
  })

  it('should validate project ID before generating URL', () => {
    expect(() => generateGuestUrl('')).toThrow('Project ID cannot be empty')
    expect(() => generateGuestUrl('test@project')).toThrow(
      'Project ID can only contain',
    )
  })

  it('should validate generated URL', () => {
    const url = generateGuestUrl('valid-project')
    expect(url).toContain('https://')
    expect(url).toContain('/guest/')
    expect(url).toContain('valid-project')
  })

  it('should handle different project IDs correctly', () => {
    const testCases = [
      { id: 'abc123', expected: 'https://app.clementine.com/guest/abc123' },
      {
        id: 'test-project',
        expected: 'https://app.clementine.com/guest/test-project',
      },
      {
        id: 'project_123',
        expected: 'https://app.clementine.com/guest/project_123',
      },
    ]

    testCases.forEach(({ id, expected }) => {
      expect(generateGuestUrl(id)).toBe(expected)
    })
  })
})

describe('extractProjectIdFromGuestUrl', () => {
  it('should extract project ID from valid guest URL', () => {
    const url = 'https://app.clementine.com/guest/test-project-123' as GuestUrl
    const projectId = extractProjectIdFromGuestUrl(url)
    expect(projectId).toBe('test-project-123')
  })

  it('should handle URLs with query parameters', () => {
    const url =
      'https://app.clementine.com/guest/test-project-123?param=value' as GuestUrl
    const projectId = extractProjectIdFromGuestUrl(url)
    expect(projectId).toBe('test-project-123')
  })

  it('should return null for URLs without /guest/ path', () => {
    const url = 'https://app.clementine.com/test-project-123' as GuestUrl
    const projectId = extractProjectIdFromGuestUrl(url)
    expect(projectId).toBeNull()
  })

  it('should return null for invalid project IDs in URL', () => {
    const url = 'https://app.clementine.com/guest/test@project' as GuestUrl
    const projectId = extractProjectIdFromGuestUrl(url)
    expect(projectId).toBeNull()
  })

  it('should handle different valid project IDs', () => {
    const testCases = [
      { url: 'https://app.clementine.com/guest/abc123', expected: 'abc123' },
      {
        url: 'https://app.clementine.com/guest/test-project',
        expected: 'test-project',
      },
      {
        url: 'https://app.clementine.com/guest/project_123',
        expected: 'project_123',
      },
    ]

    testCases.forEach(({ url, expected }) => {
      const projectId = extractProjectIdFromGuestUrl(url as GuestUrl)
      expect(projectId).toBe(expected)
    })
  })
})
