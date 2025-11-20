"use client";

/**
 * Component: YesNoEditor
 *
 * Type-specific editor for yes_no step configuration.
 * Allows customizing labels for "Yes" and "No" buttons.
 *
 * Part of 001-survey-experience implementation (Phase 3 - User Story 1).
 */

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface YesNoEditorProps {
  config?: {
    yesLabel?: string;
    noLabel?: string;
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
 
export function YesNoEditor({
  config,
  register,
  watch,
  setValue,
  errors,
  onBlur,
}: YesNoEditorProps) {
  return (
    <div className="space-y-4">
      {/* Yes Label */}
      <div className="space-y-2">
        <Label htmlFor="yesLabel">Yes Label (optional)</Label>
        <Input
          id="yesLabel"
          {...register("config.yesLabel")}
          placeholder="Yes"
          className="min-h-[44px]"
          onBlur={onBlur}
          maxLength={50}
        />
        <p className="text-xs text-muted-foreground">
          Default: &quot;Yes&quot;
        </p>
        {errors.config?.yesLabel && (
          <p className="text-xs text-destructive">
            {errors.config.yesLabel.message}
          </p>
        )}
      </div>

      {/* No Label */}
      <div className="space-y-2">
        <Label htmlFor="noLabel">No Label (optional)</Label>
        <Input
          id="noLabel"
          {...register("config.noLabel")}
          placeholder="No"
          className="min-h-[44px]"
          onBlur={onBlur}
          maxLength={50}
        />
        <p className="text-xs text-muted-foreground">
          Default: &quot;No&quot;
        </p>
        {errors.config?.noLabel && (
          <p className="text-xs text-destructive">
            {errors.config.noLabel.message}
          </p>
        )}
      </div>
    </div>
  );
}
