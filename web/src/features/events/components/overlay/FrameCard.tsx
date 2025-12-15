"use client";

import { useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { X, Upload } from "lucide-react";
import { toast } from "sonner";
import { uploadImage } from "@/lib/storage/actions";
import type { FrameEntry, OverlayAspectRatio } from "../../types/event.types";
import { OVERLAY_ASPECT_RATIOS } from "../../constants";
import Image from "next/image";

interface FrameCardProps {
  /** Aspect ratio (square or story) */
  ratio: OverlayAspectRatio;
  /** Current frame configuration */
  frame: FrameEntry;
  /** Callback when frame image is uploaded */
  onFrameUpload: (url: string) => void;
  /** Callback when frame is removed */
  onRemove: () => void;
  /** Disable all interactions (during save) */
  disabled?: boolean;
}

/**
 * FrameCard component - Visual frame overlay card with click-to-upload
 *
 * Features:
 * - Click anywhere on card to upload
 * - Shows placeholder in correct aspect ratio (1:1 or 9:16)
 * - Displays uploaded frame when available
 * - Hover shows subtle close icon to remove
 * - Minimal text, visual-first design
 */
export function FrameCard({
  ratio,
  frame,
  onFrameUpload,
  onRemove,
  disabled = false,
}: FrameCardProps) {
  const aspectInfo = OVERLAY_ASPECT_RATIOS[ratio];
  const hasFrame = Boolean(frame.frameUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleCardClick = () => {
    if (!disabled && !isUploading) {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const result = await uploadImage(file, "frames");
      if (result.success) {
        onFrameUpload(result.data.url);
      } else {
        // Handle upload failure
        const errorMessage = result.error?.message || "Failed to upload frame";
        console.error("Frame upload failed:", errorMessage);
        toast.error(errorMessage);
      }
    } catch (error) {
      // Handle exception during upload
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
      console.error("Frame upload exception:", error);
      toast.error(errorMessage);
    } finally {
      setIsUploading(false);
      // Reset input so same file can be uploaded again
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!disabled) {
      onRemove();
    }
  };

  return (
    <Card
      className={`max-w-xs border-0 shadow-none pt-0 relative overflow-hidden transition-all cursor-pointer hover:shadow-md ${
        disabled ? "opacity-60 cursor-not-allowed" : ""
      } ${isUploading ? "opacity-50" : ""}`}
      onClick={handleCardClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Preview container with fixed height */}
      <div className="relative w-full h-80 flex items-center justify-center ">
        {/* Inner container maintains aspect ratio */}
        <div
          className="relative h-full max-w-full bg-muted"
          style={{ aspectRatio: aspectInfo.cssAspect }}
        >
        {/* Frame preview or placeholder */}
        {hasFrame && frame.frameUrl ? (
          <>
            {/* Uploaded frame */}
            <Image
              src={frame.frameUrl}
              alt={`${aspectInfo.label} frame`}
              className="w-full h-full object-contain"
              width={200}
              height={200}
              unoptimized
            />
            {/* Remove button on hover */}
            {isHovered && !disabled && !isUploading && (
              <button
                onClick={handleRemove}
                className="absolute top-2 right-2 p-1.5 mr-1 bg-background/80 hover:bg-background rounded-full shadow-md transition-all"
                aria-label="Remove frame"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </>
        ) : (
          <>
            {/* Placeholder */}
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-linear-to-br from-gray-100 to-gray-200">
              <Upload className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                {isUploading ? "Uploading..." : "Click to upload"}
              </p>
            </div>
          </>
        )}
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled || isUploading}
      />

      {/* Label below */}
      <p className="text-sm text-center text-muted-foreground">
        {aspectInfo.label} ({aspectInfo.ratio})
      </p>
    </Card>
  );
}
