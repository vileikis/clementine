"use client";

/**
 * Component: TextEditor
 *
 * Type-specific editor for both short_text and long_text step configurations.
 * Allows configuring placeholder and maxLength.
 *
 * Part of 001-survey-experience implementation (Phase 3 - User Story 1).
 */

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface TextEditorProps {
  type: "short_text" | "long_text";
  config?: {
    placeholder?: string;
    maxLength?: number;
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
 
export function TextEditor({
  type,
  config,
  register,
  watch,
  setValue,
  errors,
  onBlur,
}: TextEditorProps) {
  const maxCharLimit = type === "short_text" ? 500 : 2000;

  return (
    <div className="space-y-4">
      {/* Placeholder */}
      <div className="space-y-2">
        <Label htmlFor="placeholder">Placeholder (optional)</Label>
        <Input
          id="placeholder"
          {...register("config.placeholder")}
          placeholder="e.g., Enter your answer here"
          className="min-h-[44px]"
          onBlur={onBlur}
          maxLength={100}
        />
        <p className="text-xs text-muted-foreground">
          Hint text shown in the input field
        </p>
        {errors.config?.placeholder && (
          <p className="text-xs text-destructive">
            {errors.config.placeholder.message}
          </p>
        )}
      </div>

      {/* Max Length */}
      <div className="space-y-2">
        <Label htmlFor="maxLength">Maximum Length (optional)</Label>
        <Input
          id="maxLength"
          type="number"
          {...register("config.maxLength", { valueAsNumber: true })}
          placeholder={maxCharLimit.toString()}
          className="min-h-[44px]"
          onBlur={onBlur}
          min={1}
          max={maxCharLimit}
        />
        <p className="text-xs text-muted-foreground">
          Character limit for responses (max {maxCharLimit})
        </p>
        {errors.config?.maxLength && (
          <p className="text-xs text-destructive">
            {errors.config.maxLength.message}
          </p>
        )}
      </div>
    </div>
  );
}
