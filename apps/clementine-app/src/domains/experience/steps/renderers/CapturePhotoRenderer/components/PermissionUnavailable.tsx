/**
 * Permission Unavailable State
 *
 * Shown when device has no camera hardware. Provides fallback to file upload.
 */

import { CameraOff } from 'lucide-react'
import type { RefObject } from 'react'
import { ThemedButton, ThemedText, useEventTheme } from '@/shared/theming'

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
  const { theme } = useEventTheme()

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-md px-4 py-8">
      {/* Camera off icon */}
      <div
        className="p-6 rounded-full"
        style={{
          backgroundColor: `color-mix(in srgb, ${theme.text.color} 10%, transparent)`,
        }}
      >
        <CameraOff className="h-12 w-12" style={{ color: theme.text.color }} />
      </div>

      {/* Header */}
      <ThemedText variant="heading" className="text-center">
        No Camera Detected
      </ThemedText>

      {/* Description */}
      <ThemedText variant="body" className="text-center opacity-80">
        Your device doesn't have a camera, but you can upload a photo instead.
      </ThemedText>

      {/* Fallback button */}
      <ThemedButton onClick={onOpenPicker} size="lg" className="w-full">
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
