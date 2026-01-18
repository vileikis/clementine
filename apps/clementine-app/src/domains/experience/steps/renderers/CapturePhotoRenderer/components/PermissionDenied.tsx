/**
 * Permission Denied State
 *
 * Shown when camera access is blocked. Provides fallback to file upload.
 */

import type { RefObject } from 'react'
import { CameraOff } from 'lucide-react'
import { getDeniedInstructions } from '@/shared/camera'
import { ThemedButton, ThemedText, useEventTheme } from '@/shared/theming'

interface PermissionDeniedProps {
  fileInputRef: RefObject<HTMLInputElement | null>
  onOpenPicker: () => void
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export function PermissionDenied({
  fileInputRef,
  onOpenPicker,
  onFileChange,
}: PermissionDeniedProps) {
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
        Camera Blocked
      </ThemedText>

      {/* Instructions */}
      <ThemedText variant="body" className="text-center opacity-80">
        {getDeniedInstructions()}
      </ThemedText>

      {/* Fallback button */}
      <ThemedButton onClick={onOpenPicker} size="lg" className="w-full">
        Upload a Photo Instead
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
