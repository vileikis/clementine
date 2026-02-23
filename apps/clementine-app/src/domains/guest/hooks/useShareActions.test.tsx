/**
 * Hook tests for useShareActions
 * Tests download functionality with Web Share API and fallback behavior
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { toast } from 'sonner'
import * as Sentry from '@sentry/tanstackstart-react'
import { useShareActions } from './useShareActions'
import type { MediaReference } from '@clementine/shared'

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}))

// Mock Sentry
vi.mock('@sentry/tanstackstart-react', () => ({
  captureException: vi.fn(),
}))

// Mock Firebase Storage
const mockGetBlob = vi.fn()
vi.mock('firebase/storage', () => ({
  ref: vi.fn((_, path) => ({ path })),
  getBlob: (...args: unknown[]) => mockGetBlob(...args),
}))

vi.mock('@/integrations/firebase/client', () => ({
  storage: {},
}))

describe('useShareActions', () => {
  const mockMedia: MediaReference = {
    mediaAssetId: 'asset-123',
    url: 'https://storage.googleapis.com/bucket/image.jpg',
    filePath: 'sessions/abc123/result.jpg',
    displayName: 'Result Image',
  }
  const mockBlob = new Blob(['fake image data'], { type: 'image/jpeg' })
  let mockCreateObjectURL: ReturnType<typeof vi.fn>
  let mockRevokeObjectURL: ReturnType<typeof vi.fn>
  let mockCanShare: ReturnType<typeof vi.fn>
  let mockShare: ReturnType<typeof vi.fn>
  const originalUserAgent = navigator.userAgent

  const setMobileUserAgent = () => {
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)',
      writable: true,
      configurable: true,
    })
  }

  const setDesktopUserAgent = () => {
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      writable: true,
      configurable: true,
    })
    Object.defineProperty(navigator, 'maxTouchPoints', {
      value: 0,
      writable: true,
      configurable: true,
    })
  }

  const setIPadOSUserAgent = () => {
    // iPadOS 13+ reports as Macintosh but has touch support
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      writable: true,
      configurable: true,
    })
    Object.defineProperty(navigator, 'maxTouchPoints', {
      value: 5,
      writable: true,
      configurable: true,
    })
  }

  beforeEach(() => {
    vi.clearAllMocks()

    // Mock getBlob to return a blob
    mockGetBlob.mockResolvedValue(mockBlob)

    // Mock URL methods
    mockCreateObjectURL = vi.fn().mockReturnValue('blob:mock-url')
    mockRevokeObjectURL = vi.fn()
    global.URL.createObjectURL = mockCreateObjectURL
    global.URL.revokeObjectURL = mockRevokeObjectURL

    // Default to desktop user agent
    setDesktopUserAgent()

    // Mock Web Share API - default to not available
    mockCanShare = vi.fn().mockReturnValue(false)
    mockShare = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'canShare', {
      value: mockCanShare,
      writable: true,
      configurable: true,
    })
    Object.defineProperty(navigator, 'share', {
      value: mockShare,
      writable: true,
      configurable: true,
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    // Restore original userAgent
    Object.defineProperty(navigator, 'userAgent', {
      value: originalUserAgent,
      writable: true,
      configurable: true,
    })
  })

  describe('handleShare - download', () => {
    it('should show error toast when media is null', async () => {
      const { result } = renderHook(() => useShareActions({ media: null }))

      await act(async () => {
        await result.current.handleShare('download')
      })

      expect(toast.error).toHaveBeenCalledWith('No media available to download')
      expect(mockGetBlob).not.toHaveBeenCalled()
    })

    it('should show error toast when media.filePath is null', async () => {
      const mediaWithoutPath = { ...mockMedia, filePath: null }
      const { result } = renderHook(() =>
        useShareActions({ media: mediaWithoutPath }),
      )

      await act(async () => {
        await result.current.handleShare('download')
      })

      expect(toast.error).toHaveBeenCalledWith('No media available to download')
      expect(mockGetBlob).not.toHaveBeenCalled()
    })

    it('should use Web Share API when available (mobile)', async () => {
      setMobileUserAgent()
      mockCanShare.mockReturnValue(true)

      const { result } = renderHook(() => useShareActions({ media: mockMedia }))

      await act(async () => {
        await result.current.handleShare('download')
      })

      expect(mockGetBlob).toHaveBeenCalled()
      expect(mockCanShare).toHaveBeenCalled()
      expect(mockShare).toHaveBeenCalledWith({
        files: expect.arrayContaining([expect.any(File)]),
      })
      expect(toast.success).toHaveBeenCalledWith('Shared successfully')
      // Should not create blob URL for download
      expect(mockCreateObjectURL).not.toHaveBeenCalled()
    })

    it('should use Web Share API on iPadOS 13+ (Macintosh UA with touch)', async () => {
      setIPadOSUserAgent()
      mockCanShare.mockReturnValue(true)

      const { result } = renderHook(() => useShareActions({ media: mockMedia }))

      await act(async () => {
        await result.current.handleShare('download')
      })

      // iPadOS should be detected as mobile and use Web Share API
      expect(mockGetBlob).toHaveBeenCalled()
      expect(mockCanShare).toHaveBeenCalled()
      expect(mockShare).toHaveBeenCalledWith({
        files: expect.arrayContaining([expect.any(File)]),
      })
      expect(toast.success).toHaveBeenCalledWith('Shared successfully')
      expect(mockCreateObjectURL).not.toHaveBeenCalled()
    })

    it('should download directly on desktop (skip Web Share API)', async () => {
      // Desktop user agent is set by default in beforeEach
      const { result } = renderHook(() => useShareActions({ media: mockMedia }))

      await act(async () => {
        await result.current.handleShare('download')
      })

      // Verify download path was taken without checking Web Share API
      expect(mockGetBlob).toHaveBeenCalled()
      expect(mockCanShare).not.toHaveBeenCalled()
      expect(mockShare).not.toHaveBeenCalled()
      expect(mockCreateObjectURL).toHaveBeenCalledWith(mockBlob)
      expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:mock-url')
      expect(toast.success).toHaveBeenCalledWith('Downloaded successfully')
    })

    it('should fallback to download on mobile when Web Share API is not available', async () => {
      setMobileUserAgent()
      mockCanShare.mockReturnValue(false)

      const { result } = renderHook(() => useShareActions({ media: mockMedia }))

      await act(async () => {
        await result.current.handleShare('download')
      })

      // Verify download fallback path was taken
      expect(mockGetBlob).toHaveBeenCalled()
      expect(mockCanShare).toHaveBeenCalled()
      expect(mockShare).not.toHaveBeenCalled()
      expect(mockCreateObjectURL).toHaveBeenCalledWith(mockBlob)
      expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:mock-url')
      expect(toast.success).toHaveBeenCalledWith('Downloaded successfully')
    })

    it('should handle user cancelling share sheet (AbortError)', async () => {
      setMobileUserAgent()
      mockCanShare.mockReturnValue(true)
      const abortError = new Error('User cancelled')
      abortError.name = 'AbortError'
      mockShare.mockRejectedValue(abortError)

      const { result } = renderHook(() => useShareActions({ media: mockMedia }))

      await act(async () => {
        await result.current.handleShare('download')
      })

      // Should not show any toast, report to Sentry, or fallback to download
      expect(toast.error).not.toHaveBeenCalled()
      expect(toast.success).not.toHaveBeenCalled()
      expect(Sentry.captureException).not.toHaveBeenCalled()
      expect(mockCreateObjectURL).not.toHaveBeenCalled()
    })

    it('should show error toast and report to Sentry on getBlob failure', async () => {
      mockGetBlob.mockRejectedValue(new Error('Storage error'))

      const { result } = renderHook(() => useShareActions({ media: mockMedia }))

      await act(async () => {
        await result.current.handleShare('download')
      })

      expect(toast.error).toHaveBeenCalledWith('Failed to download')
      expect(Sentry.captureException).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          tags: {
            domain: 'guest',
            action: 'download-media',
          },
          extra: {
            errorType: 'download-failure',
            mediaAssetId: mockMedia.mediaAssetId,
            filePath: mockMedia.filePath,
          },
        }),
      )
    })

    it('should show error toast and report to Sentry on share failure', async () => {
      setMobileUserAgent()
      mockCanShare.mockReturnValue(true)
      mockShare.mockRejectedValue(new Error('Share failed'))

      const { result } = renderHook(() => useShareActions({ media: mockMedia }))

      await act(async () => {
        await result.current.handleShare('download')
      })

      expect(toast.error).toHaveBeenCalledWith('Failed to download')
      expect(Sentry.captureException).toHaveBeenCalled()
    })

    it('should create File with correct type from blob', async () => {
      setMobileUserAgent()
      mockCanShare.mockReturnValue(true)

      const { result } = renderHook(() => useShareActions({ media: mockMedia }))

      await act(async () => {
        await result.current.handleShare('download')
      })

      expect(mockShare).toHaveBeenCalledWith({
        files: [
          expect.objectContaining({
            type: 'image/jpeg',
            name: expect.stringMatching(/^clementine-result-\d+\.jpg$/),
          }),
        ],
      })
    })

    it('should default to image/jpeg when blob type is empty', async () => {
      setMobileUserAgent()
      const blobWithoutType = new Blob(['fake image data'], { type: '' })
      mockGetBlob.mockResolvedValue(blobWithoutType)
      mockCanShare.mockReturnValue(true)

      const { result } = renderHook(() => useShareActions({ media: mockMedia }))

      await act(async () => {
        await result.current.handleShare('download')
      })

      expect(mockShare).toHaveBeenCalledWith({
        files: [
          expect.objectContaining({
            type: 'image/jpeg',
          }),
        ],
      })
    })
  })

  describe('handleShare - other platforms', () => {
    it('should show info toast for copyLink', async () => {
      const { result } = renderHook(() => useShareActions({ media: mockMedia }))

      await act(async () => {
        await result.current.handleShare('copyLink')
      })

      expect(toast.info).toHaveBeenCalledWith(
        'Copy Link sharing not supported yet',
      )
    })

    it('should show info toast for email', async () => {
      const { result } = renderHook(() => useShareActions({ media: mockMedia }))

      await act(async () => {
        await result.current.handleShare('email')
      })

      expect(toast.info).toHaveBeenCalledWith('Email sharing not supported yet')
    })

    it.each([
      ['instagram', 'Instagram'],
      ['facebook', 'Facebook'],
      ['linkedin', 'LinkedIn'],
      ['twitter', 'Twitter'],
      ['tiktok', 'TikTok'],
      ['telegram', 'Telegram'],
    ] as const)('should show info toast for %s', async (platform, label) => {
      const { result } = renderHook(() => useShareActions({ media: mockMedia }))

      await act(async () => {
        await result.current.handleShare(platform)
      })

      expect(toast.info).toHaveBeenCalledWith(
        `${label} sharing not supported yet`,
      )
    })
  })
})
