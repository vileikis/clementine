"use client";

/**
 * Component: OpinionScaleEditor
 *
 * Type-specific editor for opinion_scale step configuration.
 * Allows configuring scale range (min/max) and optional labels.
 *
 * Part of 001-survey-experience implementation (Phase 3 - User Story 1).
 */

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface OpinionScaleEditorProps {
  config: {
    scaleMin: number;
    scaleMax: number;
    minLabel?: string;
    maxLabel?: string;
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  watch: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setValue: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  errors: any;
  onBlur: () => void;
}

// Unused params suppressed for React Hook Form integration
 
export function OpinionScaleEditor({
  config,
  register,
  watch,
  setValue,
  errors,
  onBlur,
}: OpinionScaleEditorProps) {
  return (
    <div className="space-y-4">
      {/* Scale Range */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="scaleMin">
            Minimum Value <span className="text-destructive">*</span>
          </Label>
          <Input
            id="scaleMin"
            type="number"
            {...register("config.scaleMin", { valueAsNumber: true })}
            placeholder="0"
            className="min-h-[44px]"
            onBlur={onBlur}
          />
          {errors.config?.scaleMin && (
            <p className="text-xs text-destructive">
              {errors.config.scaleMin.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="scaleMax">
            Maximum Value <span className="text-destructive">*</span>
          </Label>
          <Input
            id="scaleMax"
            type="number"
            {...register("config.scaleMax", { valueAsNumber: true })}
            placeholder="10"
            className="min-h-[44px]"
            onBlur={onBlur}
          />
          {errors.config?.scaleMax && (
            <p className="text-xs text-destructive">
              {errors.config.scaleMax.message}
            </p>
          )}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Common scales: 0-5, 1-5, 0-10, 1-10
      </p>

      {/* Scale Labels */}
      <div className="space-y-4 pt-2 border-t">
        <div className="space-y-2">
          <Label htmlFor="minLabel">Minimum Label (optional)</Label>
          <Input
            id="minLabel"
            {...register("config.minLabel")}
            placeholder="e.g., Not likely"
            className="min-h-[44px]"
            onBlur={onBlur}
            maxLength={50}
          />
          {errors.config?.minLabel && (
            <p className="text-xs text-destructive">
              {errors.config.minLabel.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="maxLabel">Maximum Label (optional)</Label>
          <Input
            id="maxLabel"
            {...register("config.maxLabel")}
            placeholder="e.g., Very likely"
            className="min-h-[44px]"
            onBlur={onBlur}
            maxLength={50}
          />
          {errors.config?.maxLabel && (
            <p className="text-xs text-destructive">
              {errors.config.maxLabel.message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
