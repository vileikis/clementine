/**
 * Hook tests for useQRCodeGenerator
 * Feature: 011-project-share-dialog
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useQRCodeGenerator } from './useQRCodeGenerator'
import type { GuestUrl } from '../types'

describe('useQRCodeGenerator', () => {
  const mockGuestUrl =
    'https://app.clementine.com/guest/test-project-123' as GuestUrl
  let originalDateNow: () => number

  beforeEach(() => {
    originalDateNow = Date.now
    // Mock Date.now to return consistent timestamp
    Date.now = () => 1234567890
  })

  afterEach(() => {
    Date.now = originalDateNow
  })

  it('should initialize with correct default options', () => {
    const { result } = renderHook(() => useQRCodeGenerator(mockGuestUrl))

    expect(result.current.qrOptions).toMatchObject({
      value: mockGuestUrl,
      size: 512,
      level: 'M',
      fgColor: '#000000',
      bgColor: '#FFFFFF',
      seed: 1234567890,
    })
    expect(result.current.isDownloading).toBe(false)
  })

  it('should generate QR options for given guest URL', () => {
    const { result } = renderHook(() => useQRCodeGenerator(mockGuestUrl))

    expect(result.current.qrOptions.value).toBe(mockGuestUrl)
  })

  it('should use medium error correction level by default', () => {
    const { result } = renderHook(() => useQRCodeGenerator(mockGuestUrl))

    expect(result.current.qrOptions.level).toBe('M')
  })

  it('should regenerate QR code with new seed', () => {
    const { result } = renderHook(() => useQRCodeGenerator(mockGuestUrl))

    const initialSeed = result.current.qrOptions.seed

    // Change Date.now return value
    Date.now = () => 9876543210

    act(() => {
      result.current.regenerateQRCode()
    })

    expect(result.current.qrOptions.seed).toBe(9876543210)
    expect(result.current.qrOptions.seed).not.toBe(initialSeed)
  })

  it('should preserve guest URL when regenerating', () => {
    const { result } = renderHook(() => useQRCodeGenerator(mockGuestUrl))

    act(() => {
      result.current.regenerateQRCode()
    })

    expect(result.current.qrOptions.value).toBe(mockGuestUrl)
  })

  it('should update QR options when guest URL changes', () => {
    const { result, rerender } = renderHook(
      ({ url }) => useQRCodeGenerator(url),
      {
        initialProps: { url: mockGuestUrl },
      },
    )

    expect(result.current.qrOptions.value).toBe(mockGuestUrl)

    const newUrl = 'https://app.clementine.com/guest/new-project' as GuestUrl
    rerender({ url: newUrl })

    expect(result.current.qrOptions.value).toBe(newUrl)
  })

  it('should provide downloadQRCode function', () => {
    const { result } = renderHook(() => useQRCodeGenerator(mockGuestUrl))

    expect(typeof result.current.downloadQRCode).toBe('function')
  })

  it('should set isDownloading state during download', async () => {
    const { result } = renderHook(() => useQRCodeGenerator(mockGuestUrl))

    expect(result.current.isDownloading).toBe(false)

    await act(async () => {
      await result.current.downloadQRCode()
    })

    // After completion, should be false
    expect(result.current.isDownloading).toBe(false)
  })
})
