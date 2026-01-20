/**
 * Camera Active State
 *
 * Shows live camera feed with capture button and upload fallback.
 */

import type { RefObject } from 'react'
import type { AspectRatio, CameraCaptureError } from '@/shared/camera/types'
import type {CameraViewRef} from '@/shared/camera';
import { CameraView  } from '@/shared/camera'
import { ThemedButton, useEventTheme } from '@/shared/theming'

interface CameraActiveProps {
  cameraRef: RefObject<CameraViewRef | null>
  aspectRatio: AspectRatio
  fileInputRef: RefObject<HTMLInputElement | null>
  onCameraReady: () => void
  onCameraError: (error: CameraCaptureError) => void
  onCapture: () => void
  onOpenPicker: () => void
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export function CameraActive({
  cameraRef,
  aspectRatio,
  fileInputRef,
  onCameraReady,
  onCameraError,
  onCapture,
  onOpenPicker,
  onFileChange,
}: CameraActiveProps) {
  const { theme } = useEventTheme()

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-md">
      {/* Camera view */}
      <div className="flex-1 w-full rounded-lg overflow-hidden flex items-center justify-center">
        <CameraView
          ref={cameraRef}
          aspectRatio={aspectRatio}
          className="w-full h-full"
          onReady={onCameraReady}
          onError={onCameraError}
        />
      </div>

      {/* Capture button */}
      <ThemedButton onClick={onCapture} size="lg" className="w-full max-w-xs">
        Take Photo
      </ThemedButton>

      {/* Upload fallback option */}
      <button
        type="button"
        onClick={onOpenPicker}
        className="text-sm opacity-60 underline"
        style={{ color: theme.text.color }}
      >
        Or upload a photo instead
      </button>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp"
        onChange={onFileChange}
        className="hidden"
      />
    </div>
  )
}
