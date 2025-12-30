/**
 * useCameraPermission Hook
 *
 * Manages camera permission state following Expo pattern.
 * Only handles permission - CameraView handles actual streaming.
 */

import { useCallback, useEffect, useState } from 'react'
import { CAMERA_CONSTRAINTS } from '../constants'
import {
  createUnavailableError,
  isMediaDevicesAvailable,
  parseMediaError,
} from '../lib'
import type { CameraCaptureError, PermissionState } from '../types'

interface UseCameraPermissionReturn {
  /** Current permission state */
  status: PermissionState
  /** Request camera permission - triggers browser prompt */
  requestPermission: () => Promise<boolean>
  /** Last error if permission denied */
  error: CameraCaptureError | null
}

/**
 * Check current camera permission status via Permissions API
 */
async function checkPermissionStatus(): Promise<PermissionState> {
  if (!navigator.permissions?.query) {
    // Permissions API not available, need to request to find out
    return 'undetermined'
  }

  try {
    const result = await navigator.permissions.query({
      name: 'camera' as PermissionName,
    })

    switch (result.state) {
      case 'granted':
        return 'granted'
      case 'denied':
        return 'denied'
      case 'prompt':
      default:
        return 'undetermined'
    }
  } catch {
    // Query failed, need to request to find out
    return 'undetermined'
  }
}

/**
 * Hook for managing camera permission state
 *
 * Follows Expo useCameraPermissions pattern - only handles permission,
 * not the actual camera stream.
 *
 * @returns Permission state, request function, and error
 *
 * @example
 * ```tsx
 * const { status, requestPermission, error } = useCameraPermission();
 *
 * if (status === "unknown") {
 *   return <Loading />;
 * }
 *
 * if (status !== "granted") {
 *   return <PermissionPrompt onRequest={requestPermission} error={error} />;
 * }
 *
 * // Permission granted - CameraView will auto-start
 * return <CameraView />;
 * ```
 */
export function useCameraPermission(): UseCameraPermissionReturn {
  const [status, setStatus] = useState<PermissionState>('unknown')
  const [error, setError] = useState<CameraCaptureError | null>(null)

  // Check permission on mount
  useEffect(() => {
    let mounted = true

    async function check() {
      if (!isMediaDevicesAvailable()) {
        if (mounted) {
          setStatus('unavailable')
          setError(createUnavailableError())
        }
        return
      }

      const permissionStatus = await checkPermissionStatus()
      if (mounted) {
        setStatus(permissionStatus)
      }
    }

    check()

    return () => {
      mounted = false
    }
  }, [])

  // Request permission - triggers browser prompt
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isMediaDevicesAvailable()) {
      const err = createUnavailableError()
      setStatus('unavailable')
      setError(err)
      return false
    }

    setError(null)

    try {
      // Request stream to trigger permission prompt
      const stream = await navigator.mediaDevices.getUserMedia({
        video: CAMERA_CONSTRAINTS,
        audio: false,
      })

      // Permission granted - stop stream immediately (CameraView will start its own)
      stream.getTracks().forEach((track) => track.stop())

      setStatus('granted')
      return true
    } catch (err) {
      const parsedError = parseMediaError(err)
      setError(parsedError)

      if (parsedError.code === 'CAMERA_UNAVAILABLE') {
        setStatus('unavailable')
      } else {
        setStatus('denied')
      }

      return false
    }
  }, [])

  return {
    status,
    requestPermission,
    error,
  }
}
