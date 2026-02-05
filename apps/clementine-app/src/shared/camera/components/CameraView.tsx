/**
 * CameraView Component
 *
 * Self-contained camera component following Expo CameraView pattern.
 * Auto-starts camera on mount, stops on unmount.
 *
 * Exposes imperative methods via ref:
 * - takePhoto(): Captures a photo from the current video frame
 * - switchCamera(): Switch to opposite camera
 * - stop(): Stop camera stream
 *
 * Stream lifecycle is managed by useCameraStream hook.
 */

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
} from 'react'
import { captureFromVideo, createCaptureFile } from '../lib'
import { useCameraStream } from '../hooks/useCameraStream'
import type {
  AspectRatio,
  CameraCaptureError,
  CameraFacing,
  CapturedPhoto,
} from '../types'
import { cn } from '@/shared/utils'

/**
 * Imperative methods exposed by CameraView via ref
 */
export interface CameraViewRef {
  /** Capture photo from current video frame */
  takePhoto: () => Promise<CapturedPhoto | null>
  /** Switch to opposite camera */
  switchCamera: () => Promise<void>
  /** Stop the camera stream and release resources */
  stop: () => void
  /** Current camera facing direction */
  facing: CameraFacing
  /** Whether device has multiple cameras */
  hasMultipleCameras: boolean
}

interface CameraViewProps {
  /** Camera facing direction */
  facing?: CameraFacing
  /** Aspect ratio guide overlay */
  aspectRatio?: AspectRatio
  /** Additional CSS classes */
  className?: string
  /** Called when camera is ready and streaming */
  onReady?: () => void
  /** Called when an error occurs */
  onError?: (error: CameraCaptureError) => void
}

/**
 * Aspect ratio to CSS aspect-ratio value mapping
 */
const ASPECT_RATIO_CSS: Record<AspectRatio, string> = {
  '1:1': '1 / 1',
  '9:16': '9 / 16',
  '3:2': '3 / 2',
  '2:3': '2 / 3',
}

/**
 * Self-contained camera view component
 *
 * Auto-starts camera on mount, stops on unmount.
 * Follows the Expo CameraView pattern.
 *
 * @example
 * ```tsx
 * const cameraRef = useRef<CameraViewRef>(null);
 *
 * // Take photo
 * const photo = await cameraRef.current?.takePhoto();
 *
 * // Switch camera
 * await cameraRef.current?.switchCamera();
 *
 * // Camera stops automatically when unmounted
 * ```
 */
export const CameraView = forwardRef<CameraViewRef, CameraViewProps>(
  function CameraView(
    {
      facing: initialFacing = 'user',
      aspectRatio,
      className,
      onReady,
      onError,
    },
    ref,
  ) {
    // Video element ref
    const videoRef = useRef<HTMLVideoElement | null>(null)

    // Camera stream management
    const { stream, facing, hasMultipleCameras, stop, switchCamera } =
      useCameraStream({
        initialFacing,
        onReady,
        onError,
      })

    // Attach stream to video element when it changes
    useEffect(() => {
      const video = videoRef.current
      if (!video) return

      video.srcObject = stream

      // Clear video when stream is null
      if (!stream) {
        video.pause()
        return
      }

      // Play video when stream is attached
      if (video.readyState >= 1) {
        video.play().catch((err) => {
          console.error('Error playing video:', err)
        })
        return
      }

      // Wait for metadata before playing
      video.addEventListener(
        'loadedmetadata',
        () => {
          video.play().catch((err) => {
            console.error('Error playing video:', err)
          })
        },
        { once: true },
      )
    }, [stream])

    // Handle tab visibility change - pause/resume when tab loses/gains focus
    useEffect(() => {
      const handleVisibilityChange = () => {
        if (!stream || !videoRef.current) return

        if (document.hidden) {
          videoRef.current.pause()
        } else {
          videoRef.current.play().catch((err) => {
            console.error('Error resuming video:', err)
          })
        }
      }

      document.addEventListener('visibilitychange', handleVisibilityChange)
      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange)
      }
    }, [stream])

    // Take photo from current video frame
    const takePhoto = useCallback(async (): Promise<CapturedPhoto | null> => {
      const video = videoRef.current
      if (!video) return null

      try {
        // Capture with options: mirror for front camera, crop to aspect ratio
        const blob = await captureFromVideo(video, {
          aspectRatio,
          mirror: facing === 'user',
        })

        const file = createCaptureFile(blob)
        const previewUrl = URL.createObjectURL(file)

        // Get dimensions from the captured blob (reflects cropping)
        const img = new Image()
        const imgUrl = URL.createObjectURL(file)
        const dimensions = await new Promise<{ width: number; height: number }>(
          (resolve, reject) => {
            const cleanup = () => {
              URL.revokeObjectURL(imgUrl)
              img.onload = null
              img.onerror = null
            }

            img.onload = () => {
              const dims = {
                width: img.naturalWidth,
                height: img.naturalHeight,
              }
              cleanup()
              resolve(dims)
            }

            img.onerror = () => {
              cleanup()
              reject(
                new Error(
                  'Failed to load captured image for dimension extraction',
                ),
              )
            }

            img.src = imgUrl
          },
        )

        return {
          previewUrl,
          file,
          method: 'camera',
          width: dimensions.width,
          height: dimensions.height,
        }
      } catch (err) {
        console.error('Failed to capture photo:', err)
        return null
      }
    }, [facing, aspectRatio])

    // Expose imperative methods via ref
    useImperativeHandle(
      ref,
      () => ({
        takePhoto,
        switchCamera,
        stop,
        facing,
        hasMultipleCameras,
      }),
      [takePhoto, switchCamera, stop, facing, hasMultipleCameras],
    )

    // Mirror front camera for natural selfie appearance
    const shouldMirror = facing === 'user'

    return (
      <div
        className={cn(
          'relative bg-black overflow-hidden',
          aspectRatio ? 'w-full' : 'w-full h-full',
          className,
        )}
        style={
          aspectRatio
            ? { aspectRatio: ASPECT_RATIO_CSS[aspectRatio], maxHeight: '100%' }
            : undefined
        }
      >
        {/* Video element - fills the constrained container */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          webkit-playsinline="true"
          className={cn(
            'absolute inset-0 w-full h-full object-cover',
            shouldMirror && 'scale-x-[-1]',
          )}
        />
      </div>
    )
  },
)
