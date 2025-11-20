"use client";

/**
 * ExperienceTypeSelector - Reusable component for selecting experience type
 * Repurposed from legacy ModeSelector component
 *
 * Used in CreateExperienceForm for inline experience creation
 */

import { cn } from "@/lib/utils";
import type { ExperienceType } from "../../lib/schemas";

interface ExperienceTypeOption {
  type: ExperienceType;
  label: string;
  description: string;
  icon: string;
  available: boolean;
}

const EXPERIENCE_TYPES: ExperienceTypeOption[] = [
  {
    type: "photo",
    label: "Photo",
    description: "Capture a single photo with optional AI transformation",
    icon: "📷",
    available: true,
  },
  {
    type: "video",
    label: "Video",
    description: "Record a short video clip",
    icon: "🎥",
    available: false,
  },
  {
    type: "gif",
    label: "GIF",
    description: "Create an animated GIF from multiple frames",
    icon: "🎞️",
    available: true,
  },
  {
    type: "wheel",
    label: "Wheel",
    description: "Spin a wheel to select from multiple experiences",
    icon: "🎡",
    available: false,
  },
];

interface ExperienceTypeSelectorProps {
  selectedType: ExperienceType;
  onSelect: (type: ExperienceType) => void;
}

export function ExperienceTypeSelector({
  selectedType,
  onSelect,
}: ExperienceTypeSelectorProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
      {EXPERIENCE_TYPES.map((option) => (
        <button
          key={option.type}
          type="button"
          disabled={!option.available}
          onClick={() => option.available && onSelect(option.type)}
          className={cn(
            "relative flex flex-col items-start gap-2 rounded-lg border-2 p-4 transition-all",
            "min-h-[120px] min-w-0",
            "hover:border-primary/50",
            "disabled:cursor-not-allowed disabled:opacity-60",
            selectedType === option.type && option.available
              ? "border-primary bg-primary/5"
              : "border-border"
          )}
          aria-pressed={selectedType === option.type}
          aria-label={`${option.label} experience type${!option.available ? " (coming soon)" : ""}`}
        >
          {/* Coming Soon Badge */}
          {!option.available && (
            <div className="absolute top-2 right-2 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
              Coming Soon
            </div>
          )}

          {/* Icon */}
          <div className="text-3xl" aria-hidden="true">
            {option.icon}
          </div>

          {/* Label */}
          <div className="flex-1 text-left">
            <h3 className="font-semibold text-sm">{option.label}</h3>
            <p className="text-xs text-muted-foreground mt-1">
              {option.description}
            </p>
          </div>
        </button>
      ))}
    </div>
  );
}
