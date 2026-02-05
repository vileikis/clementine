/**
 * useCameraStream Hook
 *
 * Manages camera stream lifecycle with proper cleanup for race conditions.
 * Handles the async nature of getUserMedia and React's mount/unmount cycles.
 *
 * Key features:
 * - Prevents orphaned streams when component unmounts during getUserMedia
 * - Supports camera switching (front/back)
 * - Detects multiple cameras
 * - Cleans up resources on unmount
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { CAMERA_CONSTRAINTS } from '../constants'
import {
  createUnavailableError,
  isMediaDevicesAvailable,
  parseMediaError,
} from '../lib'
import type { CameraCaptureError, CameraFacing } from '../types'

interface UseCameraStreamOptions {
  /** Initial camera facing direction */
  initialFacing?: CameraFacing
  /** Called when camera stream is ready */
  onReady?: () => void
  /** Called when an error occurs */
  onError?: (error: CameraCaptureError) => void
}

interface UseCameraStreamReturn {
  /** Current media stream (null if not active) */
  stream: MediaStream | null
  /** Current camera facing direction */
  facing: CameraFacing
  /** Whether device has multiple cameras */
  hasMultipleCameras: boolean
  /** Whether stream is currently active */
  isActive: boolean
  /** Stop camera and release resources */
  stop: () => void
  /** Switch to opposite camera */
  switchCamera: () => Promise<void>
}

/**
 * Hook for managing camera stream lifecycle
 *
 * Automatically starts camera on mount and stops on unmount.
 * Handles race conditions when component unmounts during async getUserMedia.
 *
 * @example
 * ```tsx
 * const { stream, facing, stop, switchCamera } = useCameraStream({
 *   initialFacing: 'user',
 *   onReady: () => console.log('Camera ready'),
 *   onError: (err) => console.error(err),
 * })
 *
 * // Attach stream to video element
 * useEffect(() => {
 *   if (videoRef.current) {
 *     videoRef.current.srcObject = stream
 *   }
 * }, [stream])
 *
 * // Stop camera when done
 * stop()
 *
 * // Switch between front/back camera
 * await switchCamera()
 * ```
 */
export function useCameraStream(
  options: UseCameraStreamOptions = {},
): UseCameraStreamReturn {
  const { initialFacing = 'user', onReady, onError } = options

  // State
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [facing, setFacing] = useState<CameraFacing>(initialFacing)
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false)
  const [isActive, setIsActive] = useState(false)

  // Ref for tracking current stream (for stop/switchCamera)
  const streamRef = useRef<MediaStream | null>(null)

  /**
   * Stop camera and release all resources
   */
  const stop = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    setStream(null)
    setIsActive(false)
  }, [])

  /**
   * Switch to opposite camera (front <-> back)
   * Note: Uses streamRef directly to avoid stale closure issues
   */
  const switchCamera = useCallback(async (): Promise<void> => {
    const newFacing = facing === 'user' ? 'environment' : 'user'

    // Stop current stream first
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    setStream(null)
    setIsActive(false)

    // Start with new facing
    if (!isMediaDevicesAvailable()) {
      onError?.(createUnavailableError())
      return
    }

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: newFacing,
          ...CAMERA_CONSTRAINTS,
        },
        audio: false,
      })

      streamRef.current = mediaStream
      setStream(mediaStream)
      setFacing(newFacing)
      setIsActive(true)
      onReady?.()
    } catch (err) {
      onError?.(parseMediaError(err))
    }
  }, [facing, onReady, onError])

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

  // Auto-start camera on mount, cleanup on unmount
  // Uses local mounted flag to handle race condition with async getUserMedia
  useEffect(() => {
    let mounted = true
    let localStream: MediaStream | null = null

    async function initCamera() {
      if (!isMediaDevicesAvailable()) {
        if (mounted) {
          onError?.(createUnavailableError())
        }
        return
      }

      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: initialFacing,
            ...CAMERA_CONSTRAINTS,
          },
          audio: false,
        })

        // Check if still mounted after async operation
        if (!mounted) {
          // Component unmounted during getUserMedia - stop orphaned stream
          mediaStream.getTracks().forEach((track) => track.stop())
          return
        }

        localStream = mediaStream
        streamRef.current = mediaStream
        setStream(mediaStream)
        setFacing(initialFacing)
        setIsActive(true)
        onReady?.()
      } catch (err) {
        if (mounted) {
          onError?.(parseMediaError(err))
        }
      }
    }

    initCamera()

    return () => {
      mounted = false
      // Stop any stream created by this effect
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop())
      }
      // Also stop streamRef in case switchCamera was used
      if (streamRef.current && streamRef.current !== localStream) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }
      streamRef.current = null
    }
  }, [initialFacing, onReady, onError])

  return {
    stream,
    facing,
    hasMultipleCameras,
    isActive,
    stop,
    switchCamera,
  }
}
