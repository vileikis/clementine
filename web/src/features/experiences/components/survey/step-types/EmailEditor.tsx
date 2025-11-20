"use client";

/**
 * Component: EmailEditor
 *
 * Type-specific editor for email step configuration.
 * Allows configuring placeholder text.
 *
 * Part of 001-survey-experience implementation (Phase 3 - User Story 1).
 */

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface EmailEditorProps {
  config?: {
    placeholder?: string;
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
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function EmailEditor({
  config,
  register,
  watch,
  setValue,
  errors,
  onBlur,
}: EmailEditorProps) {
  return (
    <div className="space-y-4">
      {/* Placeholder */}
      <div className="space-y-2">
        <Label htmlFor="placeholder">Placeholder (optional)</Label>
        <Input
          id="placeholder"
          {...register("config.placeholder")}
          placeholder="e.g., your@email.com"
          className="min-h-[44px]"
          onBlur={onBlur}
          maxLength={100}
        />
        <p className="text-xs text-muted-foreground">
          Hint text shown in the email input field
        </p>
        {errors.config?.placeholder && (
          <p className="text-xs text-destructive">
            {errors.config.placeholder.message}
          </p>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        Email validation is automatically enforced for guest responses.
      </p>
    </div>
  );
}
