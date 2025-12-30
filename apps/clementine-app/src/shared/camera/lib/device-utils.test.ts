/**
 * Tests for device utility functions
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { checkCameraPermission, isMediaDevicesAvailable } from './utils'

describe('isMediaDevicesAvailable', () => {
  beforeEach(() => {
    // Reset navigator mock before each test
    vi.restoreAllMocks()
  })

  it('should return true when MediaDevices API is available', () => {
    // Set up proper mediaDevices mock
    vi.stubGlobal('navigator', {
      ...navigator,
      mediaDevices: {
        getUserMedia: vi.fn(),
      },
    })

    const result = isMediaDevicesAvailable()
    expect(result).toBe(true)
  })

  it('should return false when navigator.mediaDevices is undefined', () => {
    vi.stubGlobal('navigator', {
      ...navigator,
      mediaDevices: undefined,
    })

    const result = isMediaDevicesAvailable()
    expect(result).toBe(false)
  })

  it('should return false when navigator.mediaDevices.getUserMedia is undefined', () => {
    vi.stubGlobal('navigator', {
      ...navigator,
      mediaDevices: {},
    })

    const result = isMediaDevicesAvailable()
    expect(result).toBe(false)
  })

  it('should handle SSR environment (no navigator)', () => {
    const originalNavigator = global.navigator
    // @ts-expect-error - Testing SSR environment
    delete global.navigator

    // Wrap in try-catch to handle the case where navigator is accessed
    let result = false
    try {
      result = isMediaDevicesAvailable()
    } catch {
      // Expected - navigator is undefined
      result = false
    }

    expect(result).toBe(false)

    // Restore navigator
    global.navigator = originalNavigator
  })
})

describe('checkCameraPermission', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('should return null when Permissions API is not available', async () => {
    vi.stubGlobal('navigator', {
      ...navigator,
      permissions: undefined,
    })

    const result = await checkCameraPermission()
    expect(result).toBeNull()
  })

  it('should return null when permissions.query is not available', async () => {
    vi.stubGlobal('navigator', {
      ...navigator,
      permissions: {},
    })

    const result = await checkCameraPermission()
    expect(result).toBeNull()
  })

  it('should return "granted" when camera permission is granted', async () => {
    const mockQuery = vi.fn().mockResolvedValue({ state: 'granted' })
    vi.stubGlobal('navigator', {
      ...navigator,
      permissions: { query: mockQuery },
    })

    const result = await checkCameraPermission()

    expect(result).toBe('granted')
    expect(mockQuery).toHaveBeenCalledWith({ name: 'camera' })
  })

  it('should return "prompt" when camera permission is prompt', async () => {
    const mockQuery = vi.fn().mockResolvedValue({ state: 'prompt' })
    vi.stubGlobal('navigator', {
      ...navigator,
      permissions: { query: mockQuery },
    })

    const result = await checkCameraPermission()

    expect(result).toBe('prompt')
  })

  it('should return "denied" when camera permission is denied', async () => {
    const mockQuery = vi.fn().mockResolvedValue({ state: 'denied' })
    vi.stubGlobal('navigator', {
      ...navigator,
      permissions: { query: mockQuery },
    })

    const result = await checkCameraPermission()

    expect(result).toBe('denied')
  })

  it('should return null when query fails', async () => {
    const mockQuery = vi.fn().mockRejectedValue(new Error('Query failed'))
    vi.stubGlobal('navigator', {
      ...navigator,
      permissions: { query: mockQuery },
    })

    const result = await checkCameraPermission()

    expect(result).toBeNull()
  })
})
