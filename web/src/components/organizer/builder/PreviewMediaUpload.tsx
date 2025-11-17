"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Upload } from "lucide-react";
import { uploadPreviewMedia, deletePreviewMedia } from "@/lib/actions/experiences";
import type { PreviewType } from "@/lib/types/firestore";

interface PreviewMediaUploadProps {
  eventId: string;
  experienceId: string;
  previewPath?: string;
  previewType?: PreviewType;
  onUpload: (publicUrl: string, fileType: PreviewType) => void;
  onRemove: () => void;
  disabled?: boolean;
}

/**
 * Preview Media Upload component for photo experiences
 * Supports image, GIF, and video uploads
 * Created in 001-photo-experience-tweaks (User Story 2)
 */
export function PreviewMediaUpload({
  eventId,
  experienceId,
  previewPath,
  previewType,
  onUpload,
  onRemove,
  disabled = false,
}: PreviewMediaUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

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
      setUploadError("An unexpected error occurred during upload");
      setTimeout(() => setUploadError(null), 5000);
    } finally {
      setIsUploading(false);
      // Reset file input
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
      setUploadError("Failed to delete preview media");
      setTimeout(() => setUploadError(null), 5000);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="preview-media">Preview Media</Label>
      <div className="space-y-2">
        {previewPath && (
          <div className="relative w-full h-48 overflow-hidden rounded-lg border bg-muted">
            {previewType === "video" ? (
              <video
                src={previewPath}
                autoPlay
                muted
                loop
                playsInline
                className="h-full w-full object-contain"
              />
            ) : (
              <img
                src={previewPath}
                alt="Preview media"
                className="h-full w-full object-contain"
              />
            )}
            <Button
              variant="destructive"
              size="sm"
              className="absolute top-2 right-2 min-h-[44px] min-w-[44px]"
              onClick={handleRemoveMedia}
              disabled={isUploading || isDeleting || disabled}
              type="button"
            >
              {isDeleting ? "Removing..." : "Remove"}
            </Button>
          </div>
        )}
        <div className="relative">
          <input
            id="preview-media"
            type="file"
            accept="image/png,image/jpeg,image/gif,video/mp4,video/webm"
            onChange={handleMediaUpload}
            disabled={isUploading || isDeleting || disabled}
            className="hidden"
          />
          <Button
            variant="outline"
            className="w-full min-h-[44px]"
            disabled={isUploading || isDeleting || disabled}
            onClick={() => document.getElementById("preview-media")?.click()}
            type="button"
          >
            <Upload className="mr-2 h-4 w-4" />
            {isUploading ? "Uploading..." : previewPath ? "Replace Media" : "Upload Media"}
          </Button>
        </div>
        {uploadError && (
          <p className="text-xs text-destructive">{uploadError}</p>
        )}
        <p className="text-xs text-muted-foreground">
          This media will appear on the guest start screen as a visual preview of the experience. Supports: JPG, PNG, GIF, MP4, WebM. Max 10MB.
        </p>
      </div>
    </div>
  );
}
