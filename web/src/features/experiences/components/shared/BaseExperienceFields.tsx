"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface BaseExperienceFieldsProps {
  label: string;
  enabled: boolean;
  onLabelChange: (value: string) => void;
  onEnabledChange: (value: boolean) => void;
  disabled?: boolean;
}

/**
 * BaseExperienceFields - Shared component for common experience configuration
 * Part of Phase 2 (User Story 1) - Edit Shared Experience Fields
 *
 * Provides editing UI for fields shared across all experience types:
 * - Label (1-50 characters)
 * - Enabled status toggle
 *
 * Used by: PhotoExperienceEditor, GifExperienceEditor, VideoExperienceEditor, etc.
 */
export function BaseExperienceFields({
  label,
  enabled,
  onLabelChange,
  onEnabledChange,
  disabled,
}: BaseExperienceFieldsProps) {
  return (
    <div className="space-y-4">
      {/* Label Input */}
      <div className="space-y-2">
        <Label htmlFor="label">Experience Label</Label>
        <Input
          id="label"
          value={label}
          onChange={(e) => onLabelChange(e.target.value)}
          placeholder="e.g., Neon Portrait"
          disabled={disabled}
          maxLength={50}
        />
        <p className="text-xs text-muted-foreground">
          {label.length}/50 characters
        </p>
      </div>

      {/* Enabled Toggle */}
      <div className="flex items-center gap-3">
        <Label htmlFor="enabled" className="flex-shrink-0">Enable Experience</Label>
        <div className="inline-flex items-center justify-center min-h-[44px] min-w-[44px]">
          <Switch
            id="enabled"
            checked={enabled}
            onCheckedChange={onEnabledChange}
            disabled={disabled}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          {enabled ? "Guests can access this experience" : "Hidden from guests"}
        </p>
      </div>
    </div>
  );
}
