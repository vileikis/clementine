"use client"

import { useCamera } from "@/hooks/useCamera"

interface CameraViewProps {
  onError?: (error: string) => void
}

/**
 * Live camera preview component
 * Shows camera feed with mirror effect for front camera
 */
export function CameraView({ onError }: CameraViewProps) {
  const { error, videoRef, isLoading } = useCamera()

  // Notify parent of errors
  if (error && onError) {
    onError(error)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center space-y-4">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-white border-r-transparent"></div>
          <p className="text-white text-lg">Requesting camera access...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black px-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="text-6xl">📷</div>
          <h2 className="text-2xl font-bold text-white">Camera Access Required</h2>
          <p className="text-gray-300">{error}</p>
          <div className="text-sm text-gray-400 space-y-2">
            <p>To use this photobooth, please:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Check your browser settings</li>
              <li>Allow camera permission for this site</li>
              <li>Reload the page</li>
            </ol>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="relative w-full h-screen">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover transform scale-x-[-1]"
          style={{
            // Mirror effect for front camera
            transform: "scaleX(-1)",
          }}
        />
      </div>
    </div>
  )
}
