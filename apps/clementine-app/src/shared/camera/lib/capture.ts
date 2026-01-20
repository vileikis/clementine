/**
 * Camera Capture Utility
 *
 * Canvas-based photo capture from video element with aspect ratio cropping.
 * Extracted and enhanced from web/src/features/guest/lib/capture.ts
 */

import { CAPTURE_QUALITY } from '../constants'
import type { AspectRatio } from '../types'

/**
 * Numeric aspect ratio values (width / height)
 */
const ASPECT_RATIO_VALUES: Record<AspectRatio, number> = {
  '3:4': 3 / 4, // 0.75 - portrait
  '1:1': 1, // 1.0  - square
  '9:16': 9 / 16, // 0.5625 - tall portrait (stories/reels)
  '3:2': 3 / 2, // 1.5 - landscape
  '2:3': 2 / 3, // 0.667 - tall portrait
}

/**
 * Crop region for extracting a portion of the video frame
 */
interface CropRegion {
  sx: number // source x
  sy: number // source y
  sw: number // source width
  sh: number // source height
}

/**
 * Options for capturing a photo from video
 */
export interface CaptureOptions {
  /** Aspect ratio to crop to */
  aspectRatio?: AspectRatio
  /** Mirror horizontally (for front camera selfies) */
  mirror?: boolean
}

/**
 * Calculates the largest centered crop region that matches the target aspect ratio
 *
 * @param videoWidth - Width of the video frame
 * @param videoHeight - Height of the video frame
 * @param aspectRatio - Target aspect ratio
 * @returns Crop region centered on the video frame
 */
export function calculateCropRegion(
  videoWidth: number,
  videoHeight: number,
  aspectRatio: AspectRatio,
): CropRegion {
  const targetRatio = ASPECT_RATIO_VALUES[aspectRatio]
  const videoRatio = videoWidth / videoHeight

  let sw: number
  let sh: number

  if (videoRatio > targetRatio) {
    // Video is wider than target - crop sides
    sh = videoHeight
    sw = videoHeight * targetRatio
  } else {
    // Video is taller than target - crop top/bottom
    sw = videoWidth
    sh = videoWidth / targetRatio
  }

  // Center the crop region
  const sx = (videoWidth - sw) / 2
  const sy = (videoHeight - sh) / 2

  return { sx, sy, sw, sh }
}

/**
 * Captures a photo from a video element using canvas
 *
 * @param video - The HTMLVideoElement with active stream
 * @param options - Capture options (aspectRatio, mirror)
 * @returns Promise resolving to a Blob containing the captured image
 * @throws Error if canvas context unavailable or blob creation fails
 */
export async function captureFromVideo(
  video: HTMLVideoElement,
  options: CaptureOptions = {},
): Promise<Blob> {
  const { aspectRatio, mirror = false } = options
  const videoWidth = video.videoWidth
  const videoHeight = video.videoHeight

  // Calculate crop region if aspect ratio specified
  const crop = aspectRatio
    ? calculateCropRegion(videoWidth, videoHeight, aspectRatio)
    : { sx: 0, sy: 0, sw: videoWidth, sh: videoHeight }

  const canvas = document.createElement('canvas')
  canvas.width = crop.sw
  canvas.height = crop.sh

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Could not get canvas context')
  }

  // Mirror horizontally if requested (for front camera selfies)
  if (mirror) {
    ctx.translate(canvas.width, 0)
    ctx.scale(-1, 1)
  }

  // Draw cropped region to canvas
  ctx.drawImage(
    video,
    crop.sx,
    crop.sy,
    crop.sw,
    crop.sh, // source rect
    0,
    0,
    crop.sw,
    crop.sh, // dest rect
  )

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Capture failed: blob creation failed'))
          return
        }
        resolve(blob)
      },
      'image/jpeg',
      CAPTURE_QUALITY,
    )
  })
}

/**
 * Creates a File object from a Blob with a timestamped filename
 *
 * @param blob - The blob to convert to File
 * @param prefix - Optional filename prefix (default: "capture")
 * @returns File object suitable for upload
 */
export function createCaptureFile(blob: Blob, prefix = 'capture'): File {
  const timestamp = Date.now()
  const filename = `${prefix}-${timestamp}.jpg`
  return new File([blob], filename, { type: 'image/jpeg' })
}
