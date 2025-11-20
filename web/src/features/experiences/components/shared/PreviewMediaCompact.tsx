"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ImagePlus, X } from "lucide-react";
import { uploadPreviewMedia, deletePreviewMedia } from "../../actions/photo-media";
import type { PreviewType } from "../../lib/schemas";
import { cn } from "@/lib/utils";

interface PreviewMediaCompactProps {
  eventId: string;
  experienceId: string;
  previewPath?: string;
  previewType?: PreviewType;
  onUpload: (publicUrl: string, fileType: PreviewType) => void;
  onRemove: () => void;
  disabled?: boolean;
  className?: string;
}

/**
 * Compact Preview Media component for ExperienceEditorHeader
 * - Square-sized image preview (no help text or labels)
 * - Minimal UI with hover interactions
 * - Reuses business logic from PreviewMediaUpload
 * Created for unified experience editor header
 */
export function PreviewMediaCompact({
  eventId,
  experienceId,
  previewPath,
  previewType,
  onUpload,
  onRemove,
  disabled = false,
  className,
}: PreviewMediaCompactProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      const result = await uploadPreviewMedia(eventId, experienceId, file);

      if (result.success) {
        onUpload(result.data.publicUrl, result.data.fileType);
      } else {
        setUploadError(result.error.message);
        setTimeout(() => setUploadError(null), 5000);
      }
    } catch {
      setUploadError("Upload failed");
      setTimeout(() => setUploadError(null), 5000);
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const handleRemoveMedia = async () => {
    if (!previewPath) return;

    setIsDeleting(true);
    setUploadError(null);

    try {
      const result = await deletePreviewMedia(eventId, experienceId, previewPath);

      if (result.success) {
        onRemove();
      } else {
        setUploadError(result.error.message);
        setTimeout(() => setUploadError(null), 5000);
      }
    } catch {
      setUploadError("Failed to delete preview");
      setTimeout(() => setUploadError(null), 5000);
    } finally {
      setIsDeleting(false);
    }
  };

  // Always show square container
  return (
    <div className={cn("space-y-2", className)}>
      <div
        className="relative w-[120px] h-[120px] sm:w-[120px] sm:h-[120px] overflow-hidden rounded-lg border border-border bg-muted cursor-pointer"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => {
          if (!previewPath && !isUploading && !disabled) {
            document.getElementById(`preview-media-${experienceId}`)?.click();
          }
        }}
      >
        {/* Hidden file input */}
        <input
          id={`preview-media-${experienceId}`}
          type="file"
          accept="image/png,image/jpeg,image/gif,video/mp4,video/webm"
          onChange={handleMediaUpload}
          disabled={isUploading || disabled}
          className="hidden"
        />

        {previewPath ? (
          <>
            {/* Media exists - show preview */}
            {previewType === "video" ? (
              <video
                src={previewPath}
                autoPlay
                muted
                loop
                playsInline
                className="h-full w-full object-cover"
              />
            ) : (
              <img
                src={previewPath}
                alt="Experience preview"
                className="h-full w-full object-cover"
              />
            )}

            {/* Hover overlay with trash icon */}
            {isHovered && !isDeleting && !disabled && (
              <div className="absolute inset-0 bg-black/50 flex items-start justify-end p-2">
                <Button
                  variant="destructive"
                  size="icon"
                  className="h-8 w-8 min-h-[44px] min-w-[44px] sm:h-9 sm:w-9"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveMedia();
                  }}
                  type="button"
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Remove preview</span>
                </Button>
              </div>
            )}

            {/* Deleting state */}
            {isDeleting && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <span className="text-white text-sm">Removing...</span>
              </div>
            )}
          </>
        ) : (
          <>
            {/* No media - show empty state with icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              {isUploading ? (
                <span className="text-sm text-muted-foreground">Uploading...</span>
              ) : (
                <ImagePlus className="h-8 w-8 text-muted-foreground" />
              )}
            </div>
          </>
        )}
      </div>

      {uploadError && (
        <p className="text-xs text-destructive">{uploadError}</p>
      )}
    </div>
  );
}
