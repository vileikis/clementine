"use client";

import { useState, useTransition } from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Upload, X } from "lucide-react";
import { uploadFrameOverlay, deleteFrameOverlay } from "@/lib/actions/experiences";
import { toast } from "sonner";

interface OverlaySettingsProps {
  eventId: string;
  experienceId: string;
  overlayFramePath: string | undefined;
  onOverlayChange: (overlayPath: string | undefined) => void;
  disabled?: boolean;
}

/**
 * OverlaySettings component for configuring frame overlay on photos.
 * Created in 001-photo-experience-tweaks (User Story 4 - Priority P2).
 *
 * Features:
 * - Toggle to enable/disable frame overlay
 * - Frame overlay upload field (PNG recommended for transparency)
 * - Preview display of overlay composited over sample photo
 * - Upload/replace/remove button handlers calling Server Actions
 * - Mobile-friendly: touch targets ≥44x44px
 *
 * Usage:
 * ```tsx
 * <OverlaySettings
 *   eventId={experience.eventId}
 *   experienceId={experience.id}
 *   overlayFramePath={overlayFramePath}
 *   onOverlayChange={setOverlayFramePath}
 * />
 * ```
 */
export function OverlaySettings({
  eventId,
  experienceId,
  overlayFramePath,
  onOverlayChange,
  disabled = false,
}: OverlaySettingsProps) {
  const [isPending, startTransition] = useTransition();
  const [overlayEnabled, setOverlayEnabled] = useState(!!overlayFramePath);
  const [isUploading, setIsUploading] = useState(false);

  // Handle overlay toggle
  const handleOverlayToggle = (enabled: boolean) => {
    setOverlayEnabled(enabled);
    if (!enabled && overlayFramePath) {
      // Clear overlay when disabled
      handleRemove();
    }
  };

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ["image/png", "image/jpeg", "image/jpg"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Invalid file type. Please upload PNG, JPEG, or JPG. PNG recommended for transparency.");
      return;
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error("File too large. Maximum size: 10MB");
      return;
    }

    setIsUploading(true);

    startTransition(async () => {
      try {
        const result = await uploadFrameOverlay(eventId, experienceId, file);

        if (result.success) {
          onOverlayChange(result.data.publicUrl);
          setOverlayEnabled(true);
          toast.success("Frame overlay uploaded successfully");
        } else {
          toast.error(result.error.message);
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to upload frame overlay");
      } finally {
        setIsUploading(false);
      }
    });
  };

  // Handle overlay removal
  const handleRemove = () => {
    if (!overlayFramePath) return;

    startTransition(async () => {
      try {
        const result = await deleteFrameOverlay(eventId, experienceId, overlayFramePath);

        if (result.success) {
          onOverlayChange(undefined);
          setOverlayEnabled(false);
          toast.success("Frame overlay removed successfully");
        } else {
          toast.error(result.error.message);
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to remove frame overlay");
      }
    });
  };

  const isDisabled = disabled || isPending || isUploading;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Frame Overlay</h2>
        <Switch
          id="overlayEnabled"
          checked={overlayEnabled}
          onCheckedChange={handleOverlayToggle}
          disabled={isDisabled}
        />
      </div>

      {overlayEnabled && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="frameOverlay">Upload Frame</Label>
            {overlayFramePath ? (
              <div className="space-y-2">
                {/* Preview of overlay composited over sample photo */}
                <div className="relative w-full h-64 overflow-hidden rounded-lg border bg-muted">
                  {/* Sample background photo */}
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center">
                    <p className="text-white text-sm font-medium">Sample Photo</p>
                  </div>
                  {/* Overlay frame */}
                  <img
                    src={overlayFramePath}
                    alt="Frame overlay"
                    className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                  />
                </div>
                <div className="flex gap-2">
                  {/* Replace button */}
                  <Button
                    variant="outline"
                    className="flex-1"
                    disabled={isDisabled}
                    type="button"
                    onClick={() => document.getElementById("frameOverlay")?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {isUploading ? "Uploading..." : "Replace Frame"}
                  </Button>
                  {/* Remove button */}
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={handleRemove}
                    disabled={isDisabled}
                    type="button"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="outline"
                className="w-full"
                disabled={isDisabled}
                type="button"
                onClick={() => document.getElementById("frameOverlay")?.click()}
              >
                <Upload className="h-4 w-4 mr-2" />
                {isUploading ? "Uploading..." : "Upload Frame"}
              </Button>
            )}
            <input
              id="frameOverlay"
              type="file"
              accept="image/png,image/jpeg,image/jpg"
              onChange={handleFileUpload}
              disabled={isDisabled}
              className="hidden"
            />
            <p className="text-xs text-muted-foreground">
              Recommended: 1080x1080px PNG with transparency. Max 10MB. The frame will be overlaid on top of guest photos.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
