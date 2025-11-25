"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Upload } from "lucide-react";
import { uploadFrameOverlay, deleteFrameOverlay } from "../../actions/photo-media";

interface OverlaySettingsProps {
  eventId: string;
  experienceId: string;
  overlayEnabled: boolean;
  overlayFramePath?: string;
  onOverlayEnabledChange: (enabled: boolean) => void;
  onUpload: (publicUrl: string) => void;
  onRemove: () => void;
  disabled?: boolean;
}

/**
 * Overlay Settings component for frame overlay configuration
 * Matches the style of PreviewMediaUpload for consistency
 * Created in 001-photo-experience-tweaks (User Story 4)
 */
export function OverlaySettings({
  eventId,
  experienceId,
  overlayEnabled,
  overlayFramePath,
  onOverlayEnabledChange,
  onUpload,
  onRemove,
  disabled = false,
}: OverlaySettingsProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleOverlayUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      const result = await uploadFrameOverlay(eventId, experienceId, file);

      if (result.success) {
        onUpload(result.data.publicUrl);
        onOverlayEnabledChange(true);
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

  const handleRemoveOverlay = async () => {
    if (!overlayFramePath) return;

    setIsDeleting(true);
    setUploadError(null);

    try {
      const result = await deleteFrameOverlay(eventId, experienceId, overlayFramePath);

      if (result.success) {
        onRemove();
        // Note: We don't disable the toggle here - user might want to upload a new overlay
      } else {
        setUploadError(result.error.message);
        setTimeout(() => setUploadError(null), 5000);
      }
    } catch {
      setUploadError("Failed to delete frame overlay");
      setTimeout(() => setUploadError(null), 5000);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header with Toggle */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Frame Overlay</h2>
        <Switch
          id="overlayEnabled"
          checked={overlayEnabled}
          onCheckedChange={onOverlayEnabledChange}
          disabled={disabled}
        />
      </div>

      {/* Upload Area - only visible when enabled */}
      {overlayEnabled && (
        <div className="space-y-2">
          <Label htmlFor="frame-overlay">Upload Frame</Label>
          <div className="space-y-2">
            {overlayFramePath && (
              <div className="relative w-full h-48 overflow-hidden rounded-lg border bg-muted">
                <Image
                  src={overlayFramePath}
                  alt="Frame overlay"
                  fill
                  className="object-contain"
                  unoptimized
                />
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={handleRemoveOverlay}
                  disabled={isUploading || isDeleting || disabled}
                  type="button"
                >
                  {isDeleting ? "Removing..." : "Remove"}
                </Button>
              </div>
            )}
            <div className="relative">
              <input
                id="frame-overlay"
                type="file"
                accept="image/png,image/jpeg,image/jpg"
                onChange={handleOverlayUpload}
                disabled={isUploading || isDeleting || disabled}
                className="hidden"
              />
              <Button
                variant="outline"
                className="w-full"
                disabled={isUploading || isDeleting || disabled}
                onClick={() => document.getElementById("frame-overlay")?.click()}
                type="button"
              >
                <Upload className="mr-2 h-4 w-4" />
                {isUploading ? "Uploading..." : overlayFramePath ? "Replace Overlay" : "Upload Overlay"}
              </Button>
            </div>
            {uploadError && (
              <p className="text-xs text-destructive">{uploadError}</p>
            )}
            <p className="text-xs text-muted-foreground">
              The frame will be overlaid on top of guest photos. PNG recommended for transparency. Max 10MB.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
