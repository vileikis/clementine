"use client";

import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

interface CountdownSettingsProps {
  countdownSeconds: number;
  onCountdownSecondsChange: (seconds: number) => void;
  disabled?: boolean;
}

/**
 * CountdownSettings component for configuring countdown timer before photo capture.
 * Updated in 003-experience-schema to align with new schema structure.
 *
 * Features:
 * - Slider for countdown duration (0-10 seconds)
 * - 0 seconds = disabled (no countdown)
 * - 1-10 seconds = countdown duration
 * - Default value: 0 (disabled)
 * - Mobile-friendly: touch targets ≥44x44px
 *
 * New Schema Alignment:
 * - No separate toggle needed (0 = disabled)
 * - Directly maps to config.countdown value
 *
 * Usage:
 * ```tsx
 * <CountdownSettings
 *   countdownSeconds={countdownSeconds}
 *   onCountdownSecondsChange={setCountdownSeconds}
 * />
 * ```
 */
export function CountdownSettings({
  countdownSeconds,
  onCountdownSecondsChange,
  disabled = false,
}: CountdownSettingsProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Countdown Timer</h2>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="countdownSeconds">Countdown Duration</Label>
          <span className="text-sm font-medium">
            {countdownSeconds === 0 ? "Disabled" : `${countdownSeconds}s`}
          </span>
        </div>
        <Slider
          id="countdownSeconds"
          min={0}
          max={10}
          step={1}
          value={[countdownSeconds]}
          onValueChange={(value) => onCountdownSecondsChange(value[0])}
          disabled={disabled}
          className="w-full"
        />
        <p className="text-xs text-muted-foreground">
          Set to 0 to disable countdown, or 1-10 seconds for countdown duration. Guests will see a countdown before photo capture.
        </p>
      </div>
    </div>
  );
}
