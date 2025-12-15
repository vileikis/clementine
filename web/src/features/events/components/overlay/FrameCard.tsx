"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { ImageUploadField } from "@/components/shared";
import { Trash2, CheckCircle2, XCircle } from "lucide-react";
import type { FrameEntry, OverlayAspectRatio } from "../../types/event.types";
import { OVERLAY_ASPECT_RATIOS } from "../../constants";

interface FrameCardProps {
  /** Aspect ratio (square or story) */
  ratio: OverlayAspectRatio;
  /** Current frame configuration */
  frame: FrameEntry;
  /** Callback when frame image is uploaded */
  onFrameUpload: (url: string) => void;
  /** Callback when enabled state changes */
  onEnabledChange: (enabled: boolean) => void;
  /** Callback when frame is removed */
  onRemove: () => void;
  /** Disable all interactions (during save) */
  disabled?: boolean;
}

/**
 * FrameCard component - Manages frame overlay configuration for one aspect ratio
 *
 * Features:
 * - Upload frame image with ImageUploadField
 * - Enable/disable toggle (preserves URL when disabled)
 * - Remove button (clears URL and disables)
 * - Status indicators (configured/unconfigured)
 *
 * Mobile-first design with touch-friendly controls
 */
export function FrameCard({
  ratio,
  frame,
  onFrameUpload,
  onEnabledChange,
  onRemove,
  disabled = false,
}: FrameCardProps) {
  const aspectInfo = OVERLAY_ASPECT_RATIOS[ratio];
  const hasFrame = Boolean(frame.frameUrl);

  return (
    <Card className={disabled ? "opacity-60" : ""}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base">
              {aspectInfo.label} ({aspectInfo.ratio})
            </CardTitle>
            <CardDescription className="mt-1">
              Frame overlay for {aspectInfo.label.toLowerCase()} aspect ratio outputs
            </CardDescription>
          </div>
          {/* Status indicator */}
          <div className="flex items-center gap-2 text-sm">
            {hasFrame ? (
              frame.enabled ? (
                <div className="flex items-center gap-1 text-green-600">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Active</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <XCircle className="h-4 w-4" />
                  <span className="hidden sm:inline">Disabled</span>
                </div>
              )
            ) : (
              <span className="text-muted-foreground text-xs">Not configured</span>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Frame upload */}
        <ImageUploadField
          id={`frame-${ratio}`}
          label="Frame Image"
          value={frame.frameUrl ?? ""}
          onChange={onFrameUpload}
          destination="frames"
          disabled={disabled}
          recommendedSize={`Transparent PNG, ${aspectInfo.ratio} aspect ratio recommended`}
          accept="image/png,image/jpeg,image/webp"
        />

        {/* Enable toggle - only show if frame exists */}
        {hasFrame && (
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="space-y-0.5">
              <Label htmlFor={`enable-${ratio}`} className="text-sm font-medium">
                Enable Frame
              </Label>
              <p className="text-xs text-muted-foreground">
                Apply this frame to generated outputs
              </p>
            </div>
            <Switch
              id={`enable-${ratio}`}
              checked={frame.enabled}
              onCheckedChange={onEnabledChange}
              disabled={disabled}
            />
          </div>
        )}

        {/* Remove button - only show if frame exists */}
        {hasFrame && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onRemove}
            disabled={disabled}
            className="w-full text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Remove Frame
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
