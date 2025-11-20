"use client";

import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

interface GifCaptureSettingsProps {
  frameCount: number;
  intervalMs: number;
  loopCount: number;
  countdown?: number;
  onFrameCountChange: (count: number) => void;
  onIntervalMsChange: (ms: number) => void;
  onLoopCountChange: (count: number) => void;
  onCountdownChange?: (seconds: number) => void;
  disabled?: boolean;
}

/**
 * GifCaptureSettings component for configuring GIF capture parameters.
 * Part of 004-multi-experience-editor implementation (User Story 2).
 *
 * Features:
 * - Slider for frame count (3-10 frames)
 * - Slider for interval between frames (100-1000ms)
 * - Slider for loop count (0 = infinite, 1-10 = finite)
 * - Optional countdown timer (0-10 seconds)
 * - Mobile-friendly: touch targets ≥44x44px
 *
 * Schema Alignment:
 * - Maps to GifConfig.frameCount, intervalMs, loopCount, countdown
 * - All values validated by gifConfigSchema
 *
 * Usage:
 * ```tsx
 * <GifCaptureSettings
 *   frameCount={frameCount}
 *   intervalMs={intervalMs}
 *   loopCount={loopCount}
 *   countdown={countdown}
 *   onFrameCountChange={setFrameCount}
 *   onIntervalMsChange={setIntervalMs}
 *   onLoopCountChange={setLoopCount}
 *   onCountdownChange={setCountdown}
 * />
 * ```
 */
export function GifCaptureSettings({
  frameCount,
  intervalMs,
  loopCount,
  countdown,
  onFrameCountChange,
  onIntervalMsChange,
  onLoopCountChange,
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

      {/* Interval Between Frames */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="intervalMs">Frame Interval</Label>
          <span className="text-sm font-medium">{intervalMs}ms</span>
        </div>
        <Slider
          id="intervalMs"
          min={100}
          max={1000}
          step={50}
          value={[intervalMs]}
          onValueChange={(value) => onIntervalMsChange(value[0])}
          disabled={disabled}
          className="w-full"
        />
        <p className="text-xs text-muted-foreground">
          Time between frame captures (100-1000ms). Lower = faster animation.
        </p>
      </div>

      {/* Loop Count */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="loopCount">Loop Count</Label>
          <span className="text-sm font-medium">
            {loopCount === 0 ? "Infinite" : `${loopCount} times`}
          </span>
        </div>
        <Slider
          id="loopCount"
          min={0}
          max={10}
          step={1}
          value={[loopCount]}
          onValueChange={(value) => onLoopCountChange(value[0])}
          disabled={disabled}
          className="w-full"
        />
        <p className="text-xs text-muted-foreground">
          How many times the GIF should loop. Set to 0 for infinite looping.
        </p>
      </div>

      {/* Optional Countdown Timer */}
      {onCountdownChange && countdown !== undefined && (
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
      )}
    </div>
  );
}
