/**
 * Tests for image utility functions
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getImageDimensions, getVideoDimensions } from './image-utils'

describe('getImageDimensions', () => {
  let mockImage: Partial<HTMLImageElement>
  let createObjectURLSpy: ReturnType<typeof vi.fn>
  let revokeObjectURLSpy: ReturnType<typeof vi.fn>

  beforeEach(() => {
    // Mock URL.createObjectURL and URL.revokeObjectURL
    createObjectURLSpy = vi.fn(() => 'blob:mock-url')
    revokeObjectURLSpy = vi.fn()
    vi.stubGlobal('URL', {
      createObjectURL: createObjectURLSpy,
      revokeObjectURL: revokeObjectURLSpy,
    })

    // Mock Image constructor
    mockImage = {
      naturalWidth: 0,
      naturalHeight: 0,
      onload: null,
      onerror: null,
    }

    vi.stubGlobal(
      'Image',
      vi.fn(() => mockImage),
    )
  })

  it('should extract dimensions from an image file', async () => {
    const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
    const dimensionsPromise = getImageDimensions(mockFile)

    // Simulate image load
    Object.defineProperty(mockImage, 'naturalWidth', {
      value: 1920,
      writable: true,
    })
    Object.defineProperty(mockImage, 'naturalHeight', {
      value: 1080,
      writable: true,
    })

    mockImage.onload?.call(mockImage as any, {} as Event)

    const result = await dimensionsPromise

    expect(result).toEqual({
      width: 1920,
      height: 1080,
    })
    expect(createObjectURLSpy).toHaveBeenCalledWith(mockFile)
    expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:mock-url')
  })

  it('should handle image load failure', async () => {
    const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
    const dimensionsPromise = getImageDimensions(mockFile)

    // Simulate image error
    mockImage.onerror?.({} as Event)

    await expect(dimensionsPromise).rejects.toThrow('Failed to load image')
    expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:mock-url')
  })

  it('should clean up object URL on success', async () => {
    const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
    const dimensionsPromise = getImageDimensions(mockFile)

    Object.defineProperty(mockImage, 'naturalWidth', {
      value: 800,
      writable: true,
    })
    Object.defineProperty(mockImage, 'naturalHeight', {
      value: 600,
      writable: true,
    })

    mockImage.onload?.call(mockImage as any, {} as Event)

    await dimensionsPromise

    // Should revoke the URL after loading
    expect(revokeObjectURLSpy).toHaveBeenCalledTimes(1)
  })

  it('should clean up object URL on failure', async () => {
    const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
    const dimensionsPromise = getImageDimensions(mockFile)

    mockImage.onerror?.({} as Event)

    try {
      await dimensionsPromise
    } catch {
      // Expected to throw
    }

    // Should revoke the URL even on error
    expect(revokeObjectURLSpy).toHaveBeenCalledTimes(1)
  })

  it('should set image src to object URL', async () => {
    const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
    getImageDimensions(mockFile)

    // Wait a tick for the promise setup to complete
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(mockImage.src).toBe('blob:mock-url')
  })
})

describe('getVideoDimensions', () => {
  it('should extract dimensions from video element', () => {
    const mockVideo = {
      videoWidth: 1920,
      videoHeight: 1080,
    } as HTMLVideoElement

    const result = getVideoDimensions(mockVideo)

    expect(result).toEqual({
      width: 1920,
      height: 1080,
    })
  })

  it('should work with different video dimensions', () => {
    const mockVideo = {
      videoWidth: 640,
      videoHeight: 480,
    } as HTMLVideoElement

    const result = getVideoDimensions(mockVideo)

    expect(result).toEqual({
      width: 640,
      height: 480,
    })
  })

  it('should return zero dimensions for uninitialized video', () => {
    const mockVideo = {
      videoWidth: 0,
      videoHeight: 0,
    } as HTMLVideoElement

    const result = getVideoDimensions(mockVideo)

    expect(result).toEqual({
      width: 0,
      height: 0,
    })
  })
})
