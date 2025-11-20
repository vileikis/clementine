"use client";

/**
 * Component: MultipleChoiceEditor
 *
 * Type-specific editor for multiple_choice step configuration.
 * Allows managing options list (add/remove, max 10) and allowMultiple toggle.
 *
 * Part of 001-survey-experience implementation (Phase 3 - User Story 1).
 */

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { X, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface MultipleChoiceEditorProps {
  config: {
    options: string[];
    allowMultiple: boolean;
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

export function MultipleChoiceEditor({
  config,
  register,
  watch,
  setValue,
  errors,
  onBlur,
}: MultipleChoiceEditorProps) {
  const options = watch("config.options") || config.options || [""];
  const allowMultiple = watch("config.allowMultiple") ?? config.allowMultiple ?? false;

  const handleAddOption = () => {
    if (options.length < 10) {
      setValue("config.options", [...options, ""], { shouldDirty: true });
    }
  };

  const handleRemoveOption = (index: number) => {
    if (options.length > 1) {
      const newOptions = options.filter((_: string, i: number) => i !== index);
      setValue("config.options", newOptions, { shouldDirty: true });
      onBlur();
    }
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setValue("config.options", newOptions, { shouldDirty: true });
  };

  return (
    <div className="space-y-4">
      {/* Options List */}
      <div className="space-y-2">
        <Label>
          Options <span className="text-destructive">*</span>
        </Label>
        <p className="text-xs text-muted-foreground">
          Add up to 10 options (min 1 required)
        </p>

        <div className="space-y-2">
          {options.map((option: string, index: number) => (
            <div key={index} className="flex items-center gap-2">
              <Input
                value={option}
                onChange={(e) => handleOptionChange(index, e.target.value)}
                onBlur={onBlur}
                placeholder={`Option ${index + 1}`}
                className="min-h-[44px] flex-1"
                maxLength={100}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveOption(index)}
                disabled={options.length === 1}
                className="min-h-[44px] min-w-[44px] shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        {/* Add Option Button */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddOption}
          disabled={options.length >= 10}
          className="w-full min-h-[44px]"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Option ({options.length}/10)
        </Button>

        {errors.config?.options && (
          <p className="text-xs text-destructive">
            {errors.config.options.message}
          </p>
        )}
      </div>

      {/* Allow Multiple Toggle */}
      <div className="flex items-center justify-between pt-2 border-t">
        <div className="space-y-0.5">
          <Label htmlFor="allowMultiple">Allow Multiple Selection</Label>
          <p className="text-xs text-muted-foreground">
            Let guests select more than one option
          </p>
        </div>
        <Switch
          id="allowMultiple"
          checked={allowMultiple}
          onCheckedChange={(checked) => {
            setValue("config.allowMultiple", checked, { shouldDirty: true });
            onBlur();
          }}
        />
      </div>
    </div>
  );
}
