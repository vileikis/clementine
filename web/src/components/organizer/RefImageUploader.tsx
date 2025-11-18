"use client"

import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import { Upload, X, Image as ImageIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  uploadReferenceImageAction,
  getImageUrlAction,
  removeReferenceImageAction,
} from "@/lib/actions/scenes"

interface RefImageUploaderProps {
  eventId: string
  sceneId: string
  currentImagePath?: string
}

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = ["image/jpeg", "image/png"]

export function RefImageUploader({
  eventId,
  sceneId,
  currentImagePath,
}: RefImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [uploadedPath, setUploadedPath] = useState<string | undefined>(
    currentImagePath
  )
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load current image URL when component mounts
  useEffect(() => {
    if (currentImagePath) {
      getImageUrlAction(currentImagePath)
        .then((result) => {
          if (result.success && result.url) {
            setPreviewUrl(result.url)
          }
        })
        .catch((err) => console.error("Failed to load image:", err))
    }
  }, [currentImagePath])

  const validateFile = (file: File): string | null => {
    if (file.size > MAX_FILE_SIZE) {
      return "File size must be less than 10MB"
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return "Only JPEG and PNG images are allowed"
    }

    return null
  }

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Reset error state
    setError(null)

    // Validate file
    const validationError = validateFile(file)
    if (validationError) {
      setError(validationError)
      return
    }

    // Show preview
    const objectUrl = URL.createObjectURL(file)
    setPreviewUrl(objectUrl)

    // Upload file
    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const result = await uploadReferenceImageAction(eventId, sceneId, formData)

      if (result.success && result.path) {
        setUploadedPath(result.path)
        // Get public URL for the uploaded image
        const urlResult = await getImageUrlAction(result.path)
        if (urlResult.success && urlResult.url) {
          setPreviewUrl(urlResult.url)
        }
      } else {
        setError(result.error || "Failed to upload image")
        // Revert preview on error
        URL.revokeObjectURL(objectUrl)
        if (uploadedPath) {
          const urlResult = await getImageUrlAction(uploadedPath)
          setPreviewUrl(urlResult.success && urlResult.url ? urlResult.url : null)
        } else {
          setPreviewUrl(null)
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload image")
      // Revert preview on error
      URL.revokeObjectURL(objectUrl)
      if (uploadedPath) {
        const urlResult = await getImageUrlAction(uploadedPath)
        setPreviewUrl(urlResult.success && urlResult.url ? urlResult.url : null)
      } else {
        setPreviewUrl(null)
      }
    } finally {
      setIsUploading(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleRemove = async () => {
    setIsUploading(true)
    setError(null)

    try {
      const result = await removeReferenceImageAction(eventId, sceneId)

      if (result.success) {
        setPreviewUrl(null)
        setUploadedPath(undefined)
        if (fileInputRef.current) {
          fileInputRef.current.value = ""
        }
      } else {
        setError(result.error || "Failed to remove image")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove image")
    } finally {
      setIsUploading(false)
    }
  }

  const handleButtonClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">
          Reference Image (Optional)
        </label>
        <p className="text-sm text-muted-foreground mb-3">
          Upload a reference image for deep fake effects. Only JPEG and PNG files
          up to 10MB are supported.
        </p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png"
        onChange={handleFileSelect}
        disabled={isUploading}
        className="hidden"
      />

      {previewUrl ? (
        <div className="relative rounded-lg border-2 border-border overflow-hidden h-64">
          <Image
            src={previewUrl}
            alt="Reference image preview"
            fill
            className="object-cover"
          />
          <div className="absolute top-2 right-2 flex gap-2">
            <button
              onClick={handleButtonClick}
              disabled={isUploading}
              className={cn(
                "px-3 py-2 bg-background/90 backdrop-blur-sm rounded-md border shadow-sm",
                "hover:bg-background transition-colors text-sm font-medium",
                isUploading && "opacity-50 cursor-not-allowed"
              )}
              title="Replace image"
            >
              Replace
            </button>
            <button
              onClick={handleRemove}
              disabled={isUploading}
              className={cn(
                "p-2 bg-background/90 backdrop-blur-sm rounded-md border shadow-sm",
                "hover:bg-background transition-colors",
                isUploading && "opacity-50 cursor-not-allowed"
              )}
              title="Remove image"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          {isUploading && (
            <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center">
              <div className="text-sm font-medium">Uploading...</div>
            </div>
          )}
        </div>
      ) : (
        <button
          onClick={handleButtonClick}
          disabled={isUploading}
          className={cn(
            "w-full h-64 rounded-lg border-2 border-dashed border-border",
            "hover:border-foreground hover:bg-accent transition-colors",
            "flex flex-col items-center justify-center gap-3",
            isUploading && "opacity-50 cursor-not-allowed"
          )}
        >
          {isUploading ? (
            <>
              <Upload className="w-8 h-8 text-muted-foreground animate-pulse" />
              <span className="text-sm text-muted-foreground">Uploading...</span>
            </>
          ) : (
            <>
              <ImageIcon className="w-8 h-8 text-muted-foreground" />
              <div className="text-sm">
                <span className="font-medium text-foreground">
                  Click to upload
                </span>{" "}
                <span className="text-muted-foreground">
                  or drag and drop
                </span>
              </div>
              <span className="text-xs text-muted-foreground">
                JPEG or PNG (max 10MB)
              </span>
            </>
          )}
        </button>
      )}

      {error && (
        <p className="text-sm text-red-500">
          {error}
        </p>
      )}

      {uploadedPath && !isUploading && !error && (
        <p className="text-sm text-green-600">
          ✓ Image uploaded successfully
        </p>
      )}
    </div>
  )
}
