"use client";

import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

interface GifCaptureSettingsProps {
  frameCount: number;
  countdown: number;
  onFrameCountChange: (count: number) => void;
  onCountdownChange: (seconds: number) => void;
  disabled?: boolean;
}

/**
 * GifCaptureSettings component for configuring GIF capture parameters.
 * Refactored for normalized Firestore design (data-model-v4).
 *
 * Features:
 * - Slider for frame count (3-10 frames)
 * - Countdown timer (0-10 seconds)
 * - Mobile-friendly: touch targets ≥44x44px
 *
 * Schema Alignment:
 * - Maps to GifCaptureConfig.frameCount, countdown
 * - All values validated by gifCaptureConfigSchema
 *
 * Usage:
 * ```tsx
 * <GifCaptureSettings
 *   frameCount={frameCount}
 *   countdown={countdown}
 *   onFrameCountChange={setFrameCount}
 *   onCountdownChange={setCountdown}
 * />
 * ```
 */
export function GifCaptureSettings({
  frameCount,
  countdown,
  onFrameCountChange,
  onCountdownChange,
  disabled = false,
}: GifCaptureSettingsProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">GIF Capture Settings</h2>

      {/* Frame Count */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="frameCount">Frame Count</Label>
          <span className="text-sm font-medium">{frameCount} frames</span>
        </div>
        <Slider
          id="frameCount"
          min={3}
          max={10}
          step={1}
          value={[frameCount]}
          onValueChange={(value) => onFrameCountChange(value[0])}
          disabled={disabled}
          className="w-full"
        />
        <p className="text-xs text-muted-foreground">
          Number of frames to capture for the GIF (3-10 frames)
        </p>
      </div>

      {/* Countdown Timer */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="countdown">Countdown Timer</Label>
          <span className="text-sm font-medium">
            {countdown === 0 ? "Disabled" : `${countdown}s`}
          </span>
        </div>
        <Slider
          id="countdown"
          min={0}
          max={10}
          step={1}
          value={[countdown]}
          onValueChange={(value) => onCountdownChange(value[0])}
          disabled={disabled}
          className="w-full"
        />
        <p className="text-xs text-muted-foreground">
          Countdown before first frame capture. Set to 0 to disable.
        </p>
      </div>
    </div>
  );
}
