/**
 * MediaPickerField Component
 *
 * A media upload field with preview and remove functionality.
 * Used for background images and other media uploads.
 */

import { useId, useRef } from 'react'
import { ImagePlus, Loader2, Trash2 } from 'lucide-react'
import type { MediaPickerFieldProps } from '../types'
import { Button } from '@/ui-kit/components/button'
import { cn } from '@/shared/utils'

export function MediaPickerField({
  label,
  value,
  onChange,
  onUpload,
  accept = 'image/*',
  removable = true,
  uploading = false,
  uploadProgress,
  disabled = false,
}: MediaPickerFieldProps) {
  const id = useId()
  const inputRef = useRef<HTMLInputElement>(null)

  const handleClick = () => {
    if (!disabled && !uploading) {
      inputRef.current?.click()
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      onUpload(file)
      // Reset input so the same file can be selected again
      e.target.value = ''
    }
  }

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange(null)
  }

  const hasImage = value !== null

  return (
    <div className="space-y-2">
      <label className="text-sm font-normal text-muted-foreground">
        {label}
      </label>

      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        disabled={disabled || uploading}
        className="sr-only"
      />

      <div
        onClick={handleClick}
        role="button"
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => e.key === 'Enter' && handleClick()}
        className={cn(
          'relative aspect-video w-full rounded-lg border-2 border-dashed transition-colors',
          'flex items-center justify-center overflow-hidden',
          disabled
            ? 'cursor-not-allowed opacity-50'
            : 'cursor-pointer hover:border-ring hover:bg-muted/50',
          hasImage ? 'border-transparent' : 'border-border',
        )}
      >
        {hasImage ? (
          <>
            <img
              src={value}
              alt="Background preview"
              className="h-full w-full object-cover"
            />

            {/* Overlay with actions */}
            <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition-opacity hover:opacity-100">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleClick}
                disabled={uploading}
              >
                <ImagePlus className="mr-2 size-4" />
                Replace
              </Button>
              {removable && (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={handleRemove}
                  disabled={uploading}
                >
                  <Trash2 className="size-4" />
                </Button>
              )}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            {uploading ? (
              <>
                <Loader2 className="size-8 animate-spin" />
                {uploadProgress !== undefined && (
                  <span className="text-sm">{Math.round(uploadProgress)}%</span>
                )}
              </>
            ) : (
              <>
                <ImagePlus className="size-8" />
                <span className="text-sm">Click to upload</span>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
