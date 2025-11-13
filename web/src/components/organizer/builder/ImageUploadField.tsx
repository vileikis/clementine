"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Upload } from "lucide-react";
import { uploadImage } from "@/lib/actions/storage";

interface ImageUploadFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (url: string) => void;
  destination: "welcome" | "experience-preview" | "experience-overlay" | "ai-reference";
  disabled?: boolean;
  aspectRatio?: string;
  recommendedSize?: string;
}

/**
 * Reusable image upload field component
 * Shows uploaded image preview with remove button
 * Used across Welcome Editor and Experience Editor
 */
export function ImageUploadField({
  id,
  label,
  value,
  onChange,
  destination,
  disabled = false,
  aspectRatio = "aspect-video",
  recommendedSize,
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
    } catch (error) {
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
          <div className={`relative ${aspectRatio} w-full overflow-hidden rounded-lg border`}>
            <img
              src={value}
              alt={label}
              className="h-full w-full object-cover"
            />
            <Button
              variant="destructive"
              size="sm"
              className="absolute top-2 right-2"
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
            accept="image/png,image/jpeg,image/webp"
            onChange={handleImageUpload}
            disabled={isUploading || disabled}
            className="hidden"
          />
          <Button
            variant="outline"
            className="w-full"
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
