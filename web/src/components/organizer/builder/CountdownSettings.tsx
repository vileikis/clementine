"use client";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";

interface CountdownSettingsProps {
  countdownEnabled: boolean;
  countdownSeconds: number;
  onCountdownEnabledChange: (enabled: boolean) => void;
  onCountdownSecondsChange: (seconds: number) => void;
  disabled?: boolean;
}

/**
 * CountdownSettings component for configuring countdown timer before photo capture.
 * Created in 001-photo-experience-tweaks (User Story 3 - Priority P2).
 *
 * Features:
 * - Toggle to enable/disable countdown timer
 * - Slider for countdown duration (0-10 seconds)
 * - Conditional rendering: slider hidden when toggle is disabled
 * - Default value: 3 seconds
 * - Mobile-friendly: touch targets ≥44x44px
 *
 * Usage:
 * ```tsx
 * <CountdownSettings
 *   countdownEnabled={countdownEnabled}
 *   countdownSeconds={countdownSeconds}
 *   onCountdownEnabledChange={setCountdownEnabled}
 *   onCountdownSecondsChange={setCountdownSeconds}
 * />
 * ```
 */
export function CountdownSettings({
  countdownEnabled,
  countdownSeconds,
  onCountdownEnabledChange,
  onCountdownSecondsChange,
  disabled = false,
}: CountdownSettingsProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Countdown Timer</h2>
        <Switch
          id="countdownEnabled"
          checked={countdownEnabled}
          onCheckedChange={onCountdownEnabledChange}
          disabled={disabled}
        />
      </div>

      {countdownEnabled && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="countdownSeconds">Countdown Duration</Label>
            <span className="text-sm font-medium">{countdownSeconds}s</span>
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
            Set timer duration from 0 to 10 seconds. Guests will see a countdown before photo capture.
          </p>
        </div>
      )}
    </div>
  );
}
