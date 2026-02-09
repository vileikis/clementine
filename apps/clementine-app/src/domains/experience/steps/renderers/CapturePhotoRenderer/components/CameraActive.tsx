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
import { CameraView } from '@/shared/camera'
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
}: CameraActiveProps) {
  return (
    <div className="flex flex-col w-full h-full items-center">
      {/* Camera - fills remaining space, CameraView handles aspect ratio internally */}
      <div className="flex-1 min-h-0 w-full max-w-2xl">
        <CameraView
          ref={cameraRef}
          aspectRatio={aspectRatio}
          className="w-full h-full rounded-2xl"
          onReady={onCameraReady}
          onError={onCameraError}
        />
      </div>

      {/* Controls Zone - fixed height with safe-area padding */}
      <div className="flex items-center justify-center gap-6 py-6 pb-[env(safe-area-inset-bottom,1.5rem)]">
        {/* Library button (left) */}
        <ThemedIconButton
          onClick={onOpenPicker}
          variant="outline"
          aria-label="Choose from library"
        >
          <ImageIcon className="size-5" />
        </ThemedIconButton>

        {/* Capture button (center) - larger */}
        <ThemedIconButton
          onClick={onCapture}
          variant="primary"
          size="lg"
          aria-label="Take photo"
        >
          <Camera className="size-7" />
        </ThemedIconButton>

        {/* Switch camera button (right) */}
        <ThemedIconButton
          onClick={onSwitchCamera}
          variant="outline"
          disabled={!hasMultipleCameras}
          aria-label="Switch camera"
        >
          <SwitchCamera className="size-5" />
        </ThemedIconButton>
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
