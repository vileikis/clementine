import { useState, useEffect, useRef } from "react"

interface UseCameraReturn {
  stream: MediaStream | null
  error: string | null
  videoRef: React.RefObject<HTMLVideoElement | null>
  isLoading: boolean
}

/**
 * React hook for accessing device camera via MediaDevices API
 * Automatically requests front-facing camera and handles cleanup
 */
export function useCamera(): UseCameraReturn {
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    let mounted = true

    async function requestCamera() {
      try {
        setIsLoading(true)
        setError(null)

        // Request front-facing camera (user mode)
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        })

        if (!mounted) {
          // Component unmounted during request, cleanup
          mediaStream.getTracks().forEach((track) => track.stop())
          return
        }

        setStream(mediaStream)

        // Attach stream to video element
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream
        }
      } catch (err) {
        if (!mounted) return

        // Handle different error types
        if (err instanceof Error) {
          if (err.name === "NotAllowedError") {
            setError("Camera permission denied. Please allow camera access to continue.")
          } else if (err.name === "NotFoundError") {
            setError("No camera found on this device.")
          } else if (err.name === "NotReadableError") {
            setError("Camera is already in use by another application.")
          } else {
            setError(err.message)
          }
        } else {
          setError("Failed to access camera. Please check your permissions.")
        }
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    requestCamera()

    // Cleanup: stop all tracks when component unmounts
    return () => {
      mounted = false
      stream?.getTracks().forEach((track) => track.stop())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Empty deps - only run once on mount

  return { stream, error, videoRef, isLoading }
}
