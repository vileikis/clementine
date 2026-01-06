import { useRef, useState } from 'react'
import { Upload, X } from 'lucide-react'
import type { OverlayReference } from '@/domains/event/shared/schemas/project-event-config.schema'
import { Button } from '@/ui-kit/components/button'
import { Card } from '@/ui-kit/components/card'
import { Progress } from '@/ui-kit/components/ui/progress'

interface OverlayFrameProps {
  /**
   * Aspect ratio label (e.g., "1:1 Square", "9:16 Portrait")
   */
  label: string

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
  overlayRef,
  onUpload,
  onRemove,
  isUploading = false,
  uploadProgress = 0,
  uploadingFileName,
}: OverlayFrameProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isHoveringRemove, setIsHoveringRemove] = useState(false)

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
      <Card
        className={`relative flex flex-col items-center justify-center gap-3 border-2 border-dashed p-6 transition-colors ${
          isDragging
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-primary/50 hover:bg-muted/50'
        } cursor-pointer`}
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
        <Upload className="h-8 w-8 text-muted-foreground" />
        <div className="text-center">
          <p className="text-sm font-medium">{label}</p>
          <p className="text-xs text-muted-foreground">
            Drop image or click to upload
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            PNG, JPG, WebP • Max 5MB
          </p>
        </div>
      </Card>
    )
  }

  // State: Uploading
  if (isUploading) {
    return (
      <Card className="relative flex flex-col gap-3 border-2 p-6">
        <div className="text-center">
          <p className="text-sm font-medium">{label}</p>
          <p className="text-xs text-muted-foreground">
            {uploadingFileName || 'Uploading...'}
          </p>
        </div>
        <Progress value={uploadProgress} className="h-2" />
        <p
          className="text-center text-xs text-muted-foreground"
          aria-live="polite"
        >
          Uploading {Math.round(uploadProgress)}%
        </p>
      </Card>
    )
  }

  // State: Uploaded
  if (overlayRef) {
    return (
      <Card
        className="group relative overflow-hidden border-2 p-0"
        onMouseEnter={() => setIsHoveringRemove(true)}
        onMouseLeave={() => setIsHoveringRemove(false)}
      >
        <div className="aspect-square w-full">
          <img
            src={overlayRef.url}
            alt={`${label} overlay`}
            className="h-full w-full object-cover"
          />
        </div>
        {isHoveringRemove && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 transition-opacity">
            <Button
              variant="destructive"
              size="icon"
              onClick={handleRemove}
              aria-label={`Remove ${label} overlay`}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        )}
        <div className="p-2 text-center">
          <p className="text-xs font-medium">{label}</p>
        </div>
      </Card>
    )
  }

  return null
}
