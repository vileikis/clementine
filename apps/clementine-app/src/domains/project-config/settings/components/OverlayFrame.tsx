import { useMemo, useRef, useState } from 'react'
import { Upload, X } from 'lucide-react'
import type { OverlayReference } from '@/domains/project-config/shared'
import { Card } from '@/ui-kit/ui/card'
import { Progress } from '@/ui-kit/ui/progress'

interface OverlayFrameProps {
  /**
   * Aspect ratio label (e.g., "1:1 Square", "9:16 Portrait")
   */
  label: string

  /**
   * Aspect ratio value (e.g., "1:1", "9:16")
   */
  ratio: string

  /**
   * Current overlay reference (null if none)
   */
  overlayRef: OverlayReference | null

  /**
   * Upload handler
   */
  onUpload: (file: File) => void

  /**
   * Remove handler
   */
  onRemove: () => void

  /**
   * Upload state
   */
  isUploading?: boolean

  /**
   * Upload progress (0-100)
   */
  uploadProgress?: number

  /**
   * File name being uploaded
   */
  uploadingFileName?: string
}

export function OverlayFrame({
  label,
  ratio,
  overlayRef,
  onUpload,
  onRemove,
  isUploading = false,
  uploadProgress = 0,
  uploadingFileName,
}: OverlayFrameProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  // Convert ratio format (1:1 -> 1/1, 9:16 -> 9/16)
  const cssRatio = useMemo(() => ratio.replace(':', '/'), [ratio])

  // Drag and drop handlers
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) onUpload(file)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  // File input handlers
  const handleClick = () => {
    if (!isUploading && !overlayRef) {
      fileInputRef.current?.click()
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      onUpload(file)
      // Reset input
      e.target.value = ''
    }
  }

  // Remove handler
  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation()
    onRemove()
  }

  // State: Empty
  if (!overlayRef && !isUploading) {
    return (
      <div className="max-w-xs">
        <Card className="relative border-0 shadow-none p-0 ">
          <div
            className={`relative w-full h-80 flex items-center justify-center border-2 border-dashed transition-colors cursor-pointer ${
              isDragging
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50 hover:bg-muted/50'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={handleClick}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              onChange={handleFileInput}
              style={{ display: 'none' }}
              aria-label={`Upload ${label} overlay image`}
            />
            <div
              className="relative h-full max-w-full flex flex-col items-center justify-center gap-3 p-2"
              style={{ aspectRatio: cssRatio }}
            >
              <Upload className="h-8 w-8 text-muted-foreground" />
              <div className="text-center">
                <p className="text-sm font-medium">{label}</p>
                <p className="text-xs text-muted-foreground">
                  Drop image or click to upload
                </p>
              </div>
            </div>
          </div>
        </Card>
        <p className="text-sm text-center text-muted-foreground mt-2">
          {label}
        </p>
      </div>
    )
  }

  // State: Uploading
  if (isUploading) {
    return (
      <div className="max-w-xs">
        <Card className="relative border-0 shadow-none p-0">
          <div className="relative w-full h-80 flex items-center justify-center">
            <div
              className="relative h-full max-w-full flex flex-col items-center justify-center gap-3 px-6"
              style={{ aspectRatio: cssRatio }}
            >
              <div className="text-center">
                <p className="text-sm font-medium">{label}</p>
                <p className="text-xs text-muted-foreground">
                  {uploadingFileName || 'Uploading...'}
                </p>
              </div>
              <Progress value={uploadProgress} className="h-2 w-full" />
              <p
                className="text-center text-xs text-muted-foreground"
                aria-live="polite"
              >
                Uploading {Math.round(uploadProgress)}%
              </p>
            </div>
          </div>
        </Card>
        <p className="text-sm text-center text-muted-foreground mt-2">
          {label}
        </p>
      </div>
    )
  }

  // State: Uploaded
  if (overlayRef) {
    return (
      <div className="max-w-xs group">
        <Card className="relative border-0 shadow-none p-0 transition-all hover:shadow-md">
          <div className="relative w-full h-80 flex items-center justify-center">
            <div
              className="relative h-full max-w-full bg-muted"
              style={{ aspectRatio: cssRatio }}
            >
              <img
                src={overlayRef.url}
                alt={`${label} overlay`}
                className="w-full h-full object-contain"
              />
              {/* Remove button - always visible on mobile (< md), visible on hover for desktop */}
              <button
                onClick={handleRemove}
                className="absolute top-2 right-2 p-1.5 bg-background/80 hover:bg-background rounded-full shadow-md transition-all cursor-pointer md:opacity-0 md:group-hover:opacity-100"
                aria-label={`Remove ${label} overlay`}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </Card>
        <p className="text-sm text-center text-muted-foreground mt-2">
          {label}
        </p>
      </div>
    )
  }

  return null
}
