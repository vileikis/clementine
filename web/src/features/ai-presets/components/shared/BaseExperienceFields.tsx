"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface BaseExperienceFieldsProps {
  name: string;
  enabled: boolean;
  onNameChange: (value: string) => void;
  onEnabledChange: (value: boolean) => void;
  disabled?: boolean;
}

/**
 * BaseExperienceFields - Shared component for common experience configuration
 * Refactored for normalized Firestore design (data-model-v4).
 *
 * Provides editing UI for fields shared across all experience types:
 * - Name (1-50 characters) - renamed from 'label'
 * - Enabled status toggle
 *
 * Used by: PhotoExperienceEditor, GifExperienceEditor, VideoExperienceEditor, etc.
 */
export function BaseExperienceFields({
  name,
  enabled,
  onNameChange,
  onEnabledChange,
  disabled,
}: BaseExperienceFieldsProps) {
  return (
    <div className="space-y-4">
      {/* Name Input */}
      <div className="space-y-2">
        <Label htmlFor="name">Experience Name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="e.g., Neon Portrait"
          disabled={disabled}
          maxLength={50}
        />
        <p className="text-xs text-muted-foreground">
          {name.length}/50 characters
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
