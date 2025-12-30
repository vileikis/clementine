/**
 * Tests for useCameraPermission hook
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import { useCameraPermission } from './useCameraPermission'

describe('useCameraPermission', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  describe('initial permission check', () => {
    it('should return "unknown" status initially', () => {
      // Set up proper mediaDevices mock to prevent immediate "unavailable" status
      vi.stubGlobal('navigator', {
        ...navigator,
        mediaDevices: {
          getUserMedia: vi.fn(),
        },
        permissions: {
          query: vi.fn().mockImplementation(() => new Promise(() => {})), // Never resolves
        },
      })

      const { result } = renderHook(() => useCameraPermission())
      expect(result.current.status).toBe('unknown')
    })

    it('should set status to "unavailable" when MediaDevices API is not available', async () => {
      vi.stubGlobal('navigator', {
        ...navigator,
        mediaDevices: undefined,
      })

      const { result } = renderHook(() => useCameraPermission())

      await waitFor(() => {
        expect(result.current.status).toBe('unavailable')
      })

      expect(result.current.error).toEqual({
        code: 'CAMERA_UNAVAILABLE',
        message:
          'Camera access not supported. Please use HTTPS or a supported browser.',
      })
    })

    it('should check permission status on mount when API is available', async () => {
      const mockQuery = vi.fn().mockResolvedValue({ state: 'granted' })
      vi.stubGlobal('navigator', {
        ...navigator,
        mediaDevices: { getUserMedia: vi.fn() },
        permissions: { query: mockQuery },
      })

      const { result } = renderHook(() => useCameraPermission())

      await waitFor(() => {
        expect(result.current.status).toBe('granted')
      })

      expect(mockQuery).toHaveBeenCalledWith({ name: 'camera' })
    })

    it('should set status to "undetermined" when permission is prompt', async () => {
      const mockQuery = vi.fn().mockResolvedValue({ state: 'prompt' })
      vi.stubGlobal('navigator', {
        ...navigator,
        mediaDevices: { getUserMedia: vi.fn() },
        permissions: { query: mockQuery },
      })

      const { result } = renderHook(() => useCameraPermission())

      await waitFor(() => {
        expect(result.current.status).toBe('undetermined')
      })
    })

    it('should set status to "denied" when permission is denied', async () => {
      const mockQuery = vi.fn().mockResolvedValue({ state: 'denied' })
      vi.stubGlobal('navigator', {
        ...navigator,
        mediaDevices: { getUserMedia: vi.fn() },
        permissions: { query: mockQuery },
      })

      const { result } = renderHook(() => useCameraPermission())

      await waitFor(() => {
        expect(result.current.status).toBe('denied')
      })
    })
  })

  describe('requestPermission', () => {
    it('should request permission and update status to "granted" on success', async () => {
      const mockGetUserMedia = vi.fn().mockResolvedValue({
        getTracks: () => [{ stop: vi.fn() }],
      })

      vi.stubGlobal('navigator', {
        ...navigator,
        mediaDevices: {
          getUserMedia: mockGetUserMedia,
        },
        permissions: {
          query: vi.fn().mockResolvedValue({ state: 'prompt' }),
        },
      })

      const { result } = renderHook(() => useCameraPermission())

      await waitFor(() => {
        expect(result.current.status).toBe('undetermined')
      })

      let success: boolean
      await act(async () => {
        success = await result.current.requestPermission()
      })

      expect(success!).toBe(true)
      expect(result.current.status).toBe('granted')
      expect(result.current.error).toBeNull()
      expect(mockGetUserMedia).toHaveBeenCalledWith({
        video: expect.any(Object),
        audio: false,
      })
    })

    it('should stop media stream immediately after permission granted', async () => {
      const mockStop = vi.fn()
      const mockGetUserMedia = vi.fn().mockResolvedValue({
        getTracks: () => [{ stop: mockStop }, { stop: mockStop }],
      })

      vi.stubGlobal('navigator', {
        ...navigator,
        mediaDevices: {
          getUserMedia: mockGetUserMedia,
        },
        permissions: {
          query: vi.fn().mockResolvedValue({ state: 'prompt' }),
        },
      })

      const { result } = renderHook(() => useCameraPermission())

      await waitFor(() => {
        expect(result.current.status).toBe('undetermined')
      })

      await act(async () => {
        await result.current.requestPermission()
      })

      expect(mockStop).toHaveBeenCalledTimes(2)
    })

    it('should set status to "denied" when permission denied', async () => {
      const mockError = new Error('Permission denied')
      mockError.name = 'NotAllowedError'
      const mockGetUserMedia = vi.fn().mockRejectedValue(mockError)

      vi.stubGlobal('navigator', {
        ...navigator,
        mediaDevices: {
          getUserMedia: mockGetUserMedia,
        },
        permissions: {
          query: vi.fn().mockResolvedValue({ state: 'prompt' }),
        },
      })

      const { result } = renderHook(() => useCameraPermission())

      await waitFor(() => {
        expect(result.current.status).toBe('undetermined')
      })

      let success: boolean
      await act(async () => {
        success = await result.current.requestPermission()
      })

      expect(success!).toBe(false)
      expect(result.current.status).toBe('denied')
      expect(result.current.error).toEqual({
        code: 'PERMISSION_DENIED',
        message:
          'Camera permission denied. Please allow camera access to continue.',
      })
    })

    it('should set status to "unavailable" when camera not found', async () => {
      const mockError = new Error('Camera not found')
      mockError.name = 'NotFoundError'
      const mockGetUserMedia = vi.fn().mockRejectedValue(mockError)

      vi.stubGlobal('navigator', {
        ...navigator,
        mediaDevices: {
          getUserMedia: mockGetUserMedia,
        },
        permissions: {
          query: vi.fn().mockResolvedValue({ state: 'prompt' }),
        },
      })

      const { result } = renderHook(() => useCameraPermission())

      await waitFor(() => {
        expect(result.current.status).toBe('undetermined')
      })

      let success: boolean
      await act(async () => {
        success = await result.current.requestPermission()
      })

      expect(success!).toBe(false)
      expect(result.current.status).toBe('unavailable')
      expect(result.current.error?.code).toBe('CAMERA_UNAVAILABLE')
    })

    it('should return false when MediaDevices API not available', async () => {
      vi.stubGlobal('navigator', {
        ...navigator,
        mediaDevices: undefined,
      })

      const { result } = renderHook(() => useCameraPermission())

      await waitFor(() => {
        expect(result.current.status).toBe('unavailable')
      })

      let success: boolean
      await act(async () => {
        success = await result.current.requestPermission()
      })

      expect(success!).toBe(false)
      expect(result.current.status).toBe('unavailable')
    })

    it('should clear previous error on new request', async () => {
      const mockGetUserMedia = vi
        .fn()
        .mockRejectedValueOnce(
          Object.assign(new Error('Denied'), { name: 'NotAllowedError' }),
        )
        .mockResolvedValueOnce({
          getTracks: () => [{ stop: vi.fn() }],
        })

      vi.stubGlobal('navigator', {
        ...navigator,
        mediaDevices: {
          getUserMedia: mockGetUserMedia,
        },
        permissions: {
          query: vi.fn().mockResolvedValue({ state: 'prompt' }),
        },
      })

      const { result } = renderHook(() => useCameraPermission())

      await waitFor(() => {
        expect(result.current.status).toBe('undetermined')
      })

      // First request - denied
      await act(async () => {
        await result.current.requestPermission()
      })
      expect(result.current.error).not.toBeNull()

      // Second request - granted
      await act(async () => {
        await result.current.requestPermission()
      })
      expect(result.current.error).toBeNull()
    })
  })

  describe('cleanup', () => {
    it('should not update state after unmount', async () => {
      const mockQuery = vi
        .fn()
        .mockImplementation(
          () =>
            new Promise((resolve) =>
              setTimeout(() => resolve({ state: 'granted' }), 100),
            ),
        )

      vi.stubGlobal('navigator', {
        ...navigator,
        mediaDevices: { getUserMedia: vi.fn() },
        permissions: { query: mockQuery },
      })

      const { result, unmount } = renderHook(() => useCameraPermission())

      expect(result.current.status).toBe('unknown')

      // Unmount before permission check completes
      unmount()

      // Wait for the async operation to complete
      await new Promise((resolve) => setTimeout(resolve, 150))

      // Status should still be 'unknown' because component was unmounted
      expect(result.current.status).toBe('unknown')
    })
  })
})
