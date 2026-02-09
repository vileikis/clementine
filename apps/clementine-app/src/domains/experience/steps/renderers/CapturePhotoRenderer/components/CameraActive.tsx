/**
 * Camera Active State
 *
 * Shows live camera feed with icon-based controls.
 * Layout: camera container (black bg, rounded) + control row (library, capture, switch)
 *
 * Responsive behavior:
 * - Mobile: camera fills available vertical space
 * - Desktop: camera container has max dimensions, centered vertically
 */

import { Camera, ImageIcon, SwitchCamera } from 'lucide-react'
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
    <div className="flex flex-col w-full h-full items-center">
      {/* Camera - fills all available space, handles aspect ratio internally */}
      <div className="flex-1 min-h-0 w-full">
        <CameraView
          ref={cameraRef}
          aspectRatio={aspectRatio}
          className="w-full h-full "
          onReady={onCameraReady}
          onError={onCameraError}
        />
      </div>
      {/* Controls - fixed to bottom, floating above camera */}
      <div className="absolute bottom-0 inset-x-0 flex flex-col items-center gap-4 py-6 pb-8">
        {/* Aspect ratio switcher */}
        {showAspectRatioSwitcher && onAspectRatioChange && (
          <AspectRatioControl value={aspectRatio} onChange={onAspectRatioChange} />
        )}

        {/* Capture controls row */}
        <div className="flex items-center justify-center gap-8">
        {/* Library button (left) */}
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

        {/* Capture button (center) - largest, custom size via className */}
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
          {/* Invisible label to match side button height */}
          <span className="text-xs invisible">Take</span>
        </div>

        {/* Switch camera button (right) */}
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
      </div>

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
