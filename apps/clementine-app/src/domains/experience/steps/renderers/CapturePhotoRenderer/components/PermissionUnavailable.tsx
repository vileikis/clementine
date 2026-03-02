/**
 * Permission Unavailable State
 *
 * Shown when device has no camera hardware. Provides fallback to file upload.
 */

import { CameraOff } from 'lucide-react'
import type { RefObject } from 'react'
import { ThemedButton, ThemedText } from '@/shared/theming'

interface PermissionUnavailableProps {
  fileInputRef: RefObject<HTMLInputElement | null>
  onOpenPicker: () => void
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export function PermissionUnavailable({
  fileInputRef,
  onOpenPicker,
  onFileChange,
}: PermissionUnavailableProps) {
  return (
    <div className="flex flex-col items-center gap-6 w-full px-4 py-8">
      {/* Camera off icon */}
      <div className="p-6 rounded-full bg-white/10">
        <CameraOff className="h-12 w-12 text-white" />
      </div>

      {/* Header */}
      <ThemedText variant="heading" surface="dark" className="text-center">
        No Camera Detected
      </ThemedText>

      {/* Description */}
      <ThemedText
        variant="body"
        surface="dark"
        className="text-center opacity-80"
      >
        Your device doesn't have a camera, but you can upload a photo instead.
      </ThemedText>

      {/* Fallback button */}
      <ThemedButton onClick={onOpenPicker} size="md" surface="dark">
        Upload a Photo
      </ThemedButton>

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
