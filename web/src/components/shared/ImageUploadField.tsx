"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Upload } from "lucide-react";
import { uploadImage } from "@/lib/storage/upload";

interface ImageUploadFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (url: string) => void;
  destination: "welcome" | "experience-preview" | "experience-overlay" | "ai-reference";
  disabled?: boolean;
  recommendedSize?: string;
  accept?: string;
  previewType?: "image" | "video";
}

/**
 * Reusable image upload field component
 * Shows uploaded image/video preview with remove button
 * Used across Welcome Editor and Experience Editor
 * Enhanced in 001-photo-experience-tweaks (Phase 8) to support video preview and custom accept types
 */
export function ImageUploadField({
  id,
  label,
  value,
  onChange,
  destination,
  disabled = false,
  recommendedSize,
  accept = "image/png,image/jpeg,image/webp",
  previewType = "image",
}: ImageUploadFieldProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      const result = await uploadImage(file, destination);

      if (result.success) {
        // Store the full URL for easy display
        onChange(result.data.url);
      } else {
        setUploadError(result.error.message);
        setTimeout(() => setUploadError(null), 5000);
      }
    } catch {
      setUploadError("An unexpected error occurred during upload");
      setTimeout(() => setUploadError(null), 5000);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = () => {
    onChange("");
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="space-y-2">
        {value && (
          <div className="relative w-full h-32 overflow-hidden rounded-lg border bg-muted">
            {previewType === "video" ? (
              <video
                src={value}
                autoPlay
                muted
                loop
                playsInline
                className="h-full w-full object-contain"
              />
            ) : (
              <img
                src={value}
                alt={label}
                className="h-full w-full object-contain"
              />
            )}
            <Button
              variant="destructive"
              size="sm"
              className="absolute top-2 right-2 min-h-[44px] min-w-[44px]"
              onClick={handleRemoveImage}
              disabled={isUploading || disabled}
              type="button"
            >
              Remove
            </Button>
          </div>
        )}
        <div className="relative">
          <input
            id={id}
            type="file"
            accept={accept}
            onChange={handleImageUpload}
            disabled={isUploading || disabled}
            className="hidden"
          />
          <Button
            variant="outline"
            className="w-full min-h-[44px]"
            disabled={isUploading || disabled}
            onClick={() => document.getElementById(id)?.click()}
            type="button"
          >
            <Upload className="mr-2 h-4 w-4" />
            {isUploading ? "Uploading..." : "Upload Image"}
          </Button>
        </div>
        {uploadError && (
          <p className="text-xs text-destructive">{uploadError}</p>
        )}
        {recommendedSize && (
          <p className="text-xs text-muted-foreground">
            {recommendedSize}
          </p>
        )}
      </div>
    </div>
  );
}
