"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Upload, X, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LottiePlayer } from "@/components/shared/LottiePlayer";
import { uploadStepMedia } from "../../actions/step-media";
import { getMediaType } from "../../utils/media-type";
import { ACCEPT_STRING } from "../../utils/media-validation";
import type { StepMediaType } from "../../types";

interface StepMediaUploadProps {
  /** Company ID for storage path */
  companyId: string;
  /** Current media URL (if any) */
  mediaUrl?: string | null;
  /** Current media type (if any) */
  mediaType?: StepMediaType | null;
  /** Callback when media is uploaded */
  onUpload: (url: string, type: StepMediaType) => void;
  /** Callback when media is removed (unlink only) */
  onRemove: () => void;
  /** Disable upload/remove buttons */
  disabled?: boolean;
}

/**
 * Media upload component for step editors
 *
 * Supports:
 * - Images: JPG, PNG, WebP (10MB max)
 * - GIFs: animated GIFs (10MB max)
 * - Videos: MP4, WebM (25MB max)
 * - Lottie: JSON animations (5MB max)
 */
export function StepMediaUpload({
  companyId,
  mediaUrl,
  mediaType,
  onUpload,
  onRemove,
  disabled = false,
}: StepMediaUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Get effective media type (stored or inferred from URL)
  const effectiveMediaType = getMediaType(mediaType, mediaUrl);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Clear previous error
    setError(null);
    setIsUploading(true);
    setUploadProgress(10);

    try {
      // Simulate progress (actual Firebase upload doesn't provide progress easily)
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      const result = await uploadStepMedia(companyId, file);

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (result.success) {
        onUpload(result.data.publicUrl, result.data.mediaType);
      } else {
        setError(result.error.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemove = () => {
    setError(null);
    onRemove();
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  // Render preview based on media type
  const renderPreview = () => {
    if (!mediaUrl || !effectiveMediaType) return null;

    switch (effectiveMediaType) {
      case "image":
        return (
          <Image
            src={mediaUrl}
            alt=""
            fill
            className="object-contain"
            sizes="(max-width: 768px) 100vw, 300px"
          />
        );
      case "gif":
        return (
          <Image
            src={mediaUrl}
            alt=""
            fill
            className="object-contain"
            sizes="(max-width: 768px) 100vw, 300px"
            unoptimized
          />
        );
      case "video":
        return (
          <video
            src={mediaUrl}
            autoPlay
            muted
            loop
            playsInline
            className="h-full w-full object-contain"
          />
        );
      case "lottie":
        return <LottiePlayer url={mediaUrl} className="h-full w-full" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-2">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPT_STRING}
        onChange={handleFileSelect}
        disabled={disabled || isUploading}
        className="hidden"
      />

      {/* Preview or Upload Area */}
      {mediaUrl ? (
        <div className="relative aspect-video w-full overflow-hidden rounded-lg border bg-muted">
          {renderPreview()}

          {/* Remove button */}
          {!disabled && (
            <Button
              variant="destructive"
              size="icon"
              className="absolute right-2 top-2 h-8 w-8"
              onClick={handleRemove}
              type="button"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={triggerFileSelect}
          disabled={disabled || isUploading}
          className={cn(
            "flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed transition-colors",
            disabled || isUploading
              ? "cursor-not-allowed border-muted bg-muted/50 text-muted-foreground"
              : "cursor-pointer border-muted-foreground/25 hover:border-primary hover:bg-muted/50"
          )}
        >
          {isUploading ? (
            <>
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">
                Uploading... {uploadProgress}%
              </span>
            </>
          ) : (
            <>
              <Upload className="h-8 w-8 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Click to upload media
              </span>
              <span className="text-xs text-muted-foreground/70">
                Images, GIFs, videos, or Lottie animations
              </span>
            </>
          )}
        </button>
      )}

      {/* Error message */}
      {error && (
        <div className="flex items-start gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
