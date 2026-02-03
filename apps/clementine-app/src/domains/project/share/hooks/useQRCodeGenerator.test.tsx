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
    'https://app.clementine.com/join/test-project-123' as GuestUrl
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
      value: `${mockGuestUrl}?_qr=1234567890`,
      size: 512,
      level: 'M',
      fgColor: '#000000',
      bgColor: '#FFFFFF',
      seed: 1234567890,
    })
    expect(result.current.isDownloading).toBe(false)
  })

  it('should generate QR options with query param for visual variation', () => {
    const { result } = renderHook(() => useQRCodeGenerator(mockGuestUrl))

    // Value should include the guest URL and a query param for visual variation
    expect(result.current.qrOptions.value).toContain(mockGuestUrl)
    expect(result.current.qrOptions.value).toContain('?_qr=')
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

  it('should preserve base guest URL when regenerating', () => {
    const { result } = renderHook(() => useQRCodeGenerator(mockGuestUrl))

    act(() => {
      result.current.regenerateQRCode()
    })

    // Should still contain the base guest URL (with different query param)
    expect(result.current.qrOptions.value).toContain(mockGuestUrl)
    expect(result.current.qrOptions.value).toContain('?_qr=')
  })

  it('should update QR options when guest URL changes', () => {
    const { result, rerender } = renderHook(
      ({ url }) => useQRCodeGenerator(url),
      {
        initialProps: { url: mockGuestUrl },
      },
    )

    expect(result.current.qrOptions.value).toContain(mockGuestUrl)

    const newUrl = 'https://app.clementine.com/join/new-project' as GuestUrl
    rerender({ url: newUrl })

    expect(result.current.qrOptions.value).toContain(newUrl)
    expect(result.current.qrOptions.value).toContain('?_qr=')
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
