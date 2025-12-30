/**
 * CameraView Component
 *
 * Self-contained camera component following Expo CameraView pattern.
 * Auto-starts camera on mount, stops on unmount.
 *
 * Exposes imperative methods via ref:
 * - takePhoto(): Captures a photo from the current video frame
 * - switchCamera(): Switch to opposite camera
 *
 * Future extensions:
 * - startRecording(): Begin video recording
 * - stopRecording(): End video recording and return result
 */

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'
import { CAMERA_CONSTRAINTS } from '../constants'
import {
  captureFromVideo,
  createCaptureFile,
  createUnavailableError,
  isMediaDevicesAvailable,
  parseMediaError,
} from '../lib'
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
  '3:4': '3 / 4',
  '1:1': '1 / 1',
  '9:16': '9 / 16',
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
    // State
    const [facing, setFacing] = useState<CameraFacing>(initialFacing)
    const [hasMultipleCameras, setHasMultipleCameras] = useState(false)

    // Refs
    const videoRef = useRef<HTMLVideoElement | null>(null)
    const streamRef = useRef<MediaStream | null>(null)

    // Check for multiple cameras on mount
    useEffect(() => {
      async function checkCameras() {
        try {
          const devices = await navigator.mediaDevices.enumerateDevices()
          const videoInputs = devices.filter(
            (device) => device.kind === 'videoinput',
          )
          setHasMultipleCameras(videoInputs.length > 1)
        } catch {
          setHasMultipleCameras(false)
        }
      }
      checkCameras()
    }, [])

    // Start camera with specified facing
    const startCamera = useCallback(
      async (targetFacing: CameraFacing): Promise<MediaStream | null> => {
        if (!isMediaDevicesAvailable()) {
          onError?.(createUnavailableError())
          return null
        }

        try {
          const mediaStream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: targetFacing,
              ...CAMERA_CONSTRAINTS,
            },
            audio: false,
          })

          streamRef.current = mediaStream
          setFacing(targetFacing)

          // Attach to video element
          if (videoRef.current) {
            videoRef.current.srcObject = mediaStream

            // Play when ready
            if (videoRef.current.readyState >= 1) {
              await videoRef.current.play()
            } else {
              videoRef.current.addEventListener(
                'loadedmetadata',
                () => {
                  videoRef.current?.play().catch((err) => {
                    console.error('Error playing video:', err)
                  })
                },
                { once: true },
              )
            }
          }

          onReady?.()
          return mediaStream
        } catch (err) {
          onError?.(parseMediaError(err))
          return null
        }
      },
      [onError, onReady],
    )

    // Stop camera and release resources
    const stopCamera = useCallback(() => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
        streamRef.current = null
      }
    }, [])

    // Switch to opposite camera
    const switchCamera = useCallback(async (): Promise<void> => {
      const newFacing = facing === 'user' ? 'environment' : 'user'

      // Stop current stream
      stopCamera()

      // Start with new facing
      await startCamera(newFacing)
    }, [facing, startCamera, stopCamera])

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
        facing,
        hasMultipleCameras,
      }),
      [takePhoto, switchCamera, facing, hasMultipleCameras],
    )

    // Auto-start camera on mount, stop on unmount
    useEffect(() => {
      startCamera(facing)

      return () => {
        stopCamera()
      }
      // Only run on mount/unmount - facing changes handled by switchCamera
    }, [facing, startCamera, stopCamera])

    // Handle tab visibility change - pause/resume when tab loses/gains focus
    useEffect(() => {
      const handleVisibilityChange = () => {
        // Guard: only act if stream and video are available
        if (!streamRef.current || !videoRef.current) return

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
    }, [])

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
