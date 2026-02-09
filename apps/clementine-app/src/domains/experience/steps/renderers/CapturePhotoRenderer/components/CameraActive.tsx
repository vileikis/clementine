/**
 * Camera Active State
 *
 * Shows live camera feed with icon-based controls.
 * Uses CaptureLayout for consistent positioning across capture states.
 */

import { Camera, ImageIcon, SwitchCamera } from 'lucide-react'
import { CaptureLayout } from './CaptureLayout'
import type { RefObject } from 'react'
import type { AspectRatio, CameraCaptureError } from '@/shared/camera/types'
import type { CameraViewRef } from '@/shared/camera'
import { AspectRatioControl, CameraView } from '@/shared/camera'
import { ThemedIconButton } from '@/shared/theming'

interface CameraActiveProps {
  cameraRef: RefObject<CameraViewRef | null>
  aspectRatio: AspectRatio
  fileInputRef: RefObject<HTMLInputElement | null>
  hasMultipleCameras: boolean
  onCameraReady: () => void
  onCameraError: (error: CameraCaptureError) => void
  onCapture: () => void
  onSwitchCamera: () => void
  onOpenPicker: () => void
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  showAspectRatioSwitcher?: boolean
  onAspectRatioChange?: (ratio: AspectRatio) => void
}

export function CameraActive({
  cameraRef,
  aspectRatio,
  fileInputRef,
  hasMultipleCameras,
  onCameraReady,
  onCameraError,
  onCapture,
  onSwitchCamera,
  onOpenPicker,
  onFileChange,
  showAspectRatioSwitcher = false,
  onAspectRatioChange,
}: CameraActiveProps) {
  return (
    <CaptureLayout
      controls={
        <>
          {showAspectRatioSwitcher && onAspectRatioChange && (
            <AspectRatioControl
              value={aspectRatio}
              onChange={onAspectRatioChange}
            />
          )}
          <div className="flex items-center justify-center gap-8">
            <div className="flex flex-col items-center gap-1.5">
              <ThemedIconButton
                onClick={onOpenPicker}
                variant="outline"
                size="lg"
                aria-label="Choose from library"
              >
                <ImageIcon className="size-6" />
              </ThemedIconButton>
              <span className="text-xs text-white/70">Library</span>
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <ThemedIconButton
                onClick={onCapture}
                variant="primary"
                size="lg"
                className="h-20! w-20!"
                aria-label="Take photo"
              >
                <Camera className="size-8" />
              </ThemedIconButton>
              <span className="text-xs invisible">Take</span>
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <ThemedIconButton
                onClick={onSwitchCamera}
                variant="outline"
                size="lg"
                disabled={!hasMultipleCameras}
                aria-label="Switch camera"
              >
                <SwitchCamera className="size-6" />
              </ThemedIconButton>
              <span className="text-xs text-white/70">Flip</span>
            </div>
          </div>
        </>
      }
    >
      <CameraView
        ref={cameraRef}
        aspectRatio={aspectRatio}
        className="w-full h-full"
        onReady={onCameraReady}
        onError={onCameraError}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp"
        onChange={onFileChange}
        className="hidden"
      />
    </CaptureLayout>
  )
}
