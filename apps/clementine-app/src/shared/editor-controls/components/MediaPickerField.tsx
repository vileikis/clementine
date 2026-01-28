/**
 * MediaPickerField Component
 *
 * A media upload field with preview and remove functionality.
 * Used for background images and other media uploads.
 */

import { useId, useRef, useState } from 'react'
import { ImagePlus, Loader2, Trash2 } from 'lucide-react'
import type { MediaPickerFieldProps } from '../types'
import { Button } from '@/ui-kit/ui/button'
import { cn } from '@/shared/utils'

export function MediaPickerField({
  label,
  value,
  onChange,
  onUpload,
  accept,
  removable = true,
  uploading = false,
  uploadProgress,
  disabled = false,
  className,
  objectFit = 'cover',
}: MediaPickerFieldProps) {
  const id = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  // Convert accept prop to comma-separated string for HTML input
  const acceptString = accept
    ? Array.isArray(accept)
      ? accept.join(',')
      : accept
    : 'image/*'

  const handleClick = () => {
    if (!disabled && !uploading) {
      inputRef.current?.click()
    }
  }

  const handleReplace = (e: React.MouseEvent) => {
    e.stopPropagation()
    handleClick()
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

  // Drag and drop handlers
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (disabled || uploading) return
    const file = e.dataTransfer.files[0]
    if (file) onUpload(file)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    if (!disabled && !uploading) {
      setIsDragging(true)
    }
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const hasImage = value !== null

  return (
    <div className="space-y-2">
      {label && (
        <label className="text-sm font-normal text-muted-foreground">
          {label}
        </label>
      )}

      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={acceptString}
        onChange={handleFileChange}
        disabled={disabled || uploading}
        className="sr-only"
      />

      <div
        onClick={hasImage ? undefined : handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        role="button"
        tabIndex={disabled || hasImage ? -1 : 0}
        onKeyDown={(e) => e.key === 'Enter' && !hasImage && handleClick()}
        className={cn(
          'relative aspect-video w-full rounded-lg border-2 border-dashed transition-colors',
          'flex items-center justify-center overflow-hidden',
          disabled
            ? 'cursor-not-allowed opacity-50'
            : hasImage
              ? 'cursor-default'
              : 'cursor-pointer hover:border-ring hover:bg-muted/50',
          hasImage ? 'border-transparent' : 'border-border',
          isDragging && !hasImage && 'border-primary bg-primary/5',
          className,
        )}
      >
        {hasImage ? (
          <>
            <img
              src={value}
              alt="Background preview"
              className={cn(
                'h-full w-full',
                objectFit === 'cover' ? 'object-cover' : 'object-contain',
              )}
            />

            {/* Overlay with actions */}
            <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition-opacity hover:opacity-100">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleReplace}
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
                <span className="text-sm">
                  {isDragging ? 'Drop image here' : 'Click or drag to upload'}
                </span>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
