"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Square, Smartphone } from "lucide-react";
import type { EventOverlayConfig, OverlayAspectRatio } from "../../types/event.types";
import { OVERLAY_ASPECT_RATIOS } from "../../constants";

interface OverlayPreviewProps {
  /** Current overlay configuration */
  overlay: EventOverlayConfig;
  /** Currently selected aspect ratio for preview */
  selectedRatio: OverlayAspectRatio;
  /** Callback when aspect ratio changes */
  onRatioChange: (ratio: OverlayAspectRatio) => void;
}

/**
 * OverlayPreview component - Shows frame overlay composited over placeholder image
 *
 * Features:
 * - Aspect ratio switcher (square/story)
 * - Frame compositing with CSS absolute positioning
 * - Placeholder image when no real content exists
 * - Conditional rendering (only shows frame if enabled and frameUrl exists)
 *
 * Uses PreviewShell pattern for consistent preview experience
 */
export function OverlayPreview({
  overlay,
  selectedRatio,
  onRatioChange,
}: OverlayPreviewProps) {
  const frame = overlay.frames[selectedRatio];
  const aspectInfo = OVERLAY_ASPECT_RATIOS[selectedRatio];
  const showFrame = frame.enabled && Boolean(frame.frameUrl);

  // Placeholder image path (will be added later)
  const placeholderImage = selectedRatio === "square"
    ? "/placeholders/square-placeholder.jpg"
    : "/placeholders/story-placeholder.jpg";

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Preview</CardTitle>
            <CardDescription>
              See how your frame will look on generated images
            </CardDescription>
          </div>

          {/* Aspect ratio switcher */}
          <ToggleGroup
            type="single"
            value={selectedRatio}
            onValueChange={(value) => {
              if (value === "square" || value === "story") {
                onRatioChange(value);
              }
            }}
          >
            <ToggleGroupItem value="square" aria-label="Square aspect ratio">
              <Square className="h-4 w-4" />
              <span className="ml-2 hidden sm:inline">Square</span>
            </ToggleGroupItem>
            <ToggleGroupItem value="story" aria-label="Story aspect ratio">
              <Smartphone className="h-4 w-4" />
              <span className="ml-2 hidden sm:inline">Story</span>
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </CardHeader>

      <CardContent>
        {/* Preview container with dynamic aspect ratio */}
        <div
          className="relative w-full mx-auto bg-muted rounded-lg overflow-hidden"
          style={{
            aspectRatio: aspectInfo.cssAspect,
            maxWidth: selectedRatio === "square" ? "400px" : "300px",
          }}
        >
          {/* Placeholder/base image */}
          <div className="absolute inset-0 w-full h-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={placeholderImage}
              alt="Preview placeholder"
              className="w-full h-full object-cover"
              onError={(e) => {
                // Fallback to gray background if placeholder image fails
                e.currentTarget.style.display = "none";
              }}
            />
            {/* Fallback background if image fails to load */}
            <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
              <p className="text-sm text-muted-foreground text-center px-4">
                Preview<br />
                <span className="text-xs">({aspectInfo.ratio})</span>
              </p>
            </div>
          </div>

          {/* Frame overlay - only shown if enabled and frameUrl exists */}
          {showFrame && frame.frameUrl && (
            <div className="absolute inset-0 w-full h-full pointer-events-none z-10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={frame.frameUrl}
                alt={`${aspectInfo.label} frame overlay`}
                className="w-full h-full object-contain"
              />
            </div>
          )}
        </div>

        {/* Status text */}
        <div className="mt-4 text-center">
          <p className="text-sm text-muted-foreground">
            {showFrame
              ? `${aspectInfo.label} frame is active`
              : `No frame applied to ${aspectInfo.label.toLowerCase()} outputs`}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
