/**
 * Tests for capture utility (Canvas-based photo capture)
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  calculateCropRegion,
  captureFromVideo,
  createCaptureFile,
} from './capture'

describe('calculateCropRegion', () => {
  it('should calculate crop for video wider than target aspect ratio (2:3)', () => {
    // Video is 1920x1080 (16:9), target is 2:3
    // Should crop width
    const result = calculateCropRegion(1920, 1080, '2:3')

    const expectedWidth = 1080 * (2 / 3) // 720
    expect(result.sw).toBe(expectedWidth)
    expect(result.sh).toBe(1080)
    expect(result.sx).toBe((1920 - expectedWidth) / 2) // Centered horizontally
    expect(result.sy).toBe(0)
  })

  it('should calculate crop for video taller than target aspect ratio (2:3)', () => {
    // Video is 1080x1920 (9:16), target is 2:3
    // Should crop height
    const result = calculateCropRegion(1080, 1920, '2:3')

    const expectedHeight = 1080 / (2 / 3) // 1620
    expect(result.sw).toBe(1080)
    expect(result.sh).toBe(expectedHeight)
    expect(result.sx).toBe(0)
    expect(result.sy).toBe((1920 - expectedHeight) / 2) // Centered vertically
  })

  it('should calculate square crop (1:1) from landscape video', () => {
    const result = calculateCropRegion(1920, 1080, '1:1')

    expect(result.sw).toBe(1080) // Square of shorter dimension
    expect(result.sh).toBe(1080)
    expect(result.sx).toBe((1920 - 1080) / 2) // Centered
    expect(result.sy).toBe(0)
  })

  it('should calculate tall crop (9:16) from landscape video', () => {
    const result = calculateCropRegion(1920, 1080, '9:16')

    const expectedWidth = 1080 * (9 / 16) // 607.5
    expect(result.sw).toBe(expectedWidth)
    expect(result.sh).toBe(1080)
    expect(result.sx).toBeCloseTo((1920 - expectedWidth) / 2)
    expect(result.sy).toBe(0)
  })

  it('should center crop region correctly', () => {
    const result = calculateCropRegion(2000, 1000, '1:1')

    // Square crop should be centered on wider dimension
    expect(result.sw).toBe(1000)
    expect(result.sh).toBe(1000)
    expect(result.sx).toBe(500) // (2000 - 1000) / 2
    expect(result.sy).toBe(0)
  })
})

describe('captureFromVideo', () => {
  let mockVideo: HTMLVideoElement
  let mockCanvas: HTMLCanvasElement
  let mockContext: CanvasRenderingContext2D

  beforeEach(() => {
    // Create mock video element
    mockVideo = {
      videoWidth: 1920,
      videoHeight: 1080,
    } as HTMLVideoElement

    // Create mock canvas context
    mockContext = {
      drawImage: vi.fn(),
      translate: vi.fn(),
      scale: vi.fn(),
    } as unknown as CanvasRenderingContext2D

    // Create mock canvas
    mockCanvas = {
      width: 0,
      height: 0,
      getContext: vi.fn(() => mockContext),
      toBlob: vi.fn((callback) => {
        // Simulate successful blob creation
        const mockBlob = new Blob(['mock image data'], { type: 'image/jpeg' })
        callback(mockBlob)
      }),
    } as unknown as HTMLCanvasElement

    // Mock document.createElement to return our mock canvas
    vi.spyOn(document, 'createElement').mockReturnValue(mockCanvas)
  })

  it('should capture photo from video element with no aspect ratio', async () => {
    const blob = await captureFromVideo(mockVideo, {})

    expect(blob).toBeInstanceOf(Blob)
    expect(blob.type).toBe('image/jpeg')
    expect(mockCanvas.width).toBe(1920)
    expect(mockCanvas.height).toBe(1080)
    expect(mockContext.drawImage).toHaveBeenCalledWith(
      mockVideo,
      0,
      0,
      1920,
      1080,
      0,
      0,
      1920,
      1080,
    )
  })

  it('should apply aspect ratio cropping correctly', async () => {
    await captureFromVideo(mockVideo, { aspectRatio: '2:3' })

    const expectedWidth = 1080 * (2 / 3) // 720
    expect(mockCanvas.width).toBe(expectedWidth)
    expect(mockCanvas.height).toBe(1080)

    // Should draw with calculated crop region
    expect(mockContext.drawImage).toHaveBeenCalledWith(
      mockVideo,
      (1920 - expectedWidth) / 2, // sx - centered
      0, // sy
      expectedWidth, // sw
      1080, // sh
      0,
      0,
      expectedWidth,
      1080,
    )
  })

  it('should apply mirroring when mirror option is true', async () => {
    await captureFromVideo(mockVideo, { mirror: true })

    expect(mockContext.translate).toHaveBeenCalledWith(1920, 0)
    expect(mockContext.scale).toHaveBeenCalledWith(-1, 1)
  })

  it('should not apply mirroring when mirror option is false', async () => {
    await captureFromVideo(mockVideo, { mirror: false })

    expect(mockContext.translate).not.toHaveBeenCalled()
    expect(mockContext.scale).not.toHaveBeenCalled()
  })

  it('should throw error when canvas context is unavailable', async () => {
    mockCanvas.getContext = vi.fn(() => null)

    await expect(captureFromVideo(mockVideo, {})).rejects.toThrow(
      'Could not get canvas context',
    )
  })

  it('should throw error when blob creation fails', async () => {
    mockCanvas.toBlob = vi.fn((callback) => {
      callback(null)
    })

    await expect(captureFromVideo(mockVideo, {})).rejects.toThrow(
      'Capture failed: blob creation failed',
    )
  })
})

describe('createCaptureFile', () => {
  it('should create File from Blob with timestamped filename', () => {
    const mockBlob = new Blob(['test'], { type: 'image/jpeg' })
    const beforeTimestamp = Date.now()

    const file = createCaptureFile(mockBlob)

    const afterTimestamp = Date.now()

    expect(file).toBeInstanceOf(File)
    expect(file.type).toBe('image/jpeg')
    expect(file.name).toMatch(/^capture-\d+\.jpg$/)

    // Extract timestamp from filename
    const timestamp = parseInt(
      file.name.replace('capture-', '').replace('.jpg', ''),
    )
    expect(timestamp).toBeGreaterThanOrEqual(beforeTimestamp)
    expect(timestamp).toBeLessThanOrEqual(afterTimestamp)
  })

  it('should use custom prefix when provided', () => {
    const mockBlob = new Blob(['test'], { type: 'image/jpeg' })

    const file = createCaptureFile(mockBlob, 'photo')

    expect(file.name).toMatch(/^photo-\d+\.jpg$/)
  })

  it('should create unique filenames for consecutive calls', async () => {
    const mockBlob = new Blob(['test'], { type: 'image/jpeg' })

    const file1 = createCaptureFile(mockBlob)
    // Wait a tick to ensure different timestamps
    await new Promise((resolve) => setTimeout(resolve, 2))
    const file2 = createCaptureFile(mockBlob)

    expect(file1.name).not.toBe(file2.name)
  })
})
