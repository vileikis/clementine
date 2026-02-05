/**
 * Hook tests for useShareActions
 * Tests download functionality with Web Share API and fallback behavior
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { toast } from 'sonner'
import * as Sentry from '@sentry/tanstackstart-react'
import { useShareActions } from './useShareActions'

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

describe('useShareActions', () => {
  const mockMediaUrl = 'https://example.com/image.jpg'
  const mockBlob = new Blob(['fake image data'], { type: 'image/jpeg' })
  let mockFetch: ReturnType<typeof vi.fn>
  let mockCreateObjectURL: ReturnType<typeof vi.fn>
  let mockRevokeObjectURL: ReturnType<typeof vi.fn>
  let mockCanShare: ReturnType<typeof vi.fn>
  let mockShare: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()

    // Mock fetch
    mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      blob: () => Promise.resolve(mockBlob),
    })
    global.fetch = mockFetch

    // Mock URL methods
    mockCreateObjectURL = vi.fn().mockReturnValue('blob:mock-url')
    mockRevokeObjectURL = vi.fn()
    global.URL.createObjectURL = mockCreateObjectURL
    global.URL.revokeObjectURL = mockRevokeObjectURL

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
  })

  describe('handleShare - download', () => {
    it('should show error toast when mediaUrl is null', async () => {
      const { result } = renderHook(() => useShareActions({ mediaUrl: null }))

      await act(async () => {
        await result.current.handleShare('download')
      })

      expect(toast.error).toHaveBeenCalledWith('No image available to download')
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('should use Web Share API when available (mobile)', async () => {
      mockCanShare.mockReturnValue(true)

      const { result } = renderHook(() =>
        useShareActions({ mediaUrl: mockMediaUrl }),
      )

      await act(async () => {
        await result.current.handleShare('download')
      })

      expect(mockFetch).toHaveBeenCalledWith(mockMediaUrl)
      expect(mockCanShare).toHaveBeenCalled()
      expect(mockShare).toHaveBeenCalledWith({
        files: expect.arrayContaining([expect.any(File)]),
      })
      expect(toast.success).toHaveBeenCalledWith('Shared successfully')
      // Should not create blob URL for download
      expect(mockCreateObjectURL).not.toHaveBeenCalled()
    })

    it('should fallback to download when Web Share API is not available (desktop)', async () => {
      mockCanShare.mockReturnValue(false)

      const { result } = renderHook(() =>
        useShareActions({ mediaUrl: mockMediaUrl }),
      )

      await act(async () => {
        await result.current.handleShare('download')
      })

      // Verify download fallback path was taken
      expect(mockFetch).toHaveBeenCalledWith(mockMediaUrl)
      expect(mockCanShare).toHaveBeenCalled()
      expect(mockShare).not.toHaveBeenCalled()
      expect(mockCreateObjectURL).toHaveBeenCalledWith(mockBlob)
      expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:mock-url')
      expect(toast.success).toHaveBeenCalledWith(
        'Image downloaded successfully',
      )
    })

    it('should handle user cancelling share sheet (AbortError)', async () => {
      mockCanShare.mockReturnValue(true)
      const abortError = new Error('User cancelled')
      abortError.name = 'AbortError'
      mockShare.mockRejectedValue(abortError)

      const { result } = renderHook(() =>
        useShareActions({ mediaUrl: mockMediaUrl }),
      )

      await act(async () => {
        await result.current.handleShare('download')
      })

      // Should not show error toast or report to Sentry
      expect(toast.error).not.toHaveBeenCalled()
      expect(toast.success).not.toHaveBeenCalled()
      expect(Sentry.captureException).not.toHaveBeenCalled()
    })

    it('should show error toast and report to Sentry on fetch failure', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      })

      const { result } = renderHook(() =>
        useShareActions({ mediaUrl: mockMediaUrl }),
      )

      await act(async () => {
        await result.current.handleShare('download')
      })

      expect(toast.error).toHaveBeenCalledWith('Failed to download image')
      expect(Sentry.captureException).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          tags: {
            domain: 'guest',
            action: 'download-media',
          },
          extra: {
            errorType: 'download-failure',
            mediaUrl: mockMediaUrl,
          },
        }),
      )
    })

    it('should show error toast and report to Sentry on network error', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'))

      const { result } = renderHook(() =>
        useShareActions({ mediaUrl: mockMediaUrl }),
      )

      await act(async () => {
        await result.current.handleShare('download')
      })

      expect(toast.error).toHaveBeenCalledWith('Failed to download image')
      expect(Sentry.captureException).toHaveBeenCalled()
    })

    it('should show error toast and report to Sentry on share failure', async () => {
      mockCanShare.mockReturnValue(true)
      mockShare.mockRejectedValue(new Error('Share failed'))

      const { result } = renderHook(() =>
        useShareActions({ mediaUrl: mockMediaUrl }),
      )

      await act(async () => {
        await result.current.handleShare('download')
      })

      expect(toast.error).toHaveBeenCalledWith('Failed to download image')
      expect(Sentry.captureException).toHaveBeenCalled()
    })

    it('should create File with correct type from blob', async () => {
      mockCanShare.mockReturnValue(true)

      const { result } = renderHook(() =>
        useShareActions({ mediaUrl: mockMediaUrl }),
      )

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
      const blobWithoutType = new Blob(['fake image data'], { type: '' })
      mockFetch.mockResolvedValue({
        ok: true,
        blob: () => Promise.resolve(blobWithoutType),
      })
      mockCanShare.mockReturnValue(true)

      const { result } = renderHook(() =>
        useShareActions({ mediaUrl: mockMediaUrl }),
      )

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
      const { result } = renderHook(() =>
        useShareActions({ mediaUrl: mockMediaUrl }),
      )

      await act(async () => {
        await result.current.handleShare('copyLink')
      })

      expect(toast.info).toHaveBeenCalledWith(
        'Copy Link sharing not supported yet',
      )
    })

    it('should show info toast for email', async () => {
      const { result } = renderHook(() =>
        useShareActions({ mediaUrl: mockMediaUrl }),
      )

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
      const { result } = renderHook(() =>
        useShareActions({ mediaUrl: mockMediaUrl }),
      )

      await act(async () => {
        await result.current.handleShare(platform)
      })

      expect(toast.info).toHaveBeenCalledWith(
        `${label} sharing not supported yet`,
      )
    })
  })
})
