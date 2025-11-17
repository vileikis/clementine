"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ExperienceType } from "@/lib/types/firestore";

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
    available: false,
  },
  {
    type: "wheel",
    label: "Wheel",
    description: "Spin a wheel to select from multiple experiences",
    icon: "🎡",
    available: false,
  },
];

interface ExperienceTypeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectType: (type: ExperienceType) => void;
}

/**
 * ExperienceTypeDialog component for selecting experience type.
 * Part of Phase 6 (User Story 3) - Manage Photo Experiences
 *
 * Shows all experience types (photo, video, gif, wheel) with:
 * - Photo: Enabled and selectable
 * - Video, GIF, Wheel: Marked as "Coming Soon" and disabled
 */
export function ExperienceTypeDialog({
  open,
  onOpenChange,
  onSelectType,
}: ExperienceTypeDialogProps) {
  const [selectedType, setSelectedType] = useState<ExperienceType>("photo");

  const handleConfirm = () => {
    onSelectType(selectedType);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Choose Experience Type</DialogTitle>
          <DialogDescription>
            Select the type of experience you want to create. Only photo experiences are available at this time.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
          {EXPERIENCE_TYPES.map((option) => (
            <button
              key={option.type}
              type="button"
              disabled={!option.available}
              onClick={() => option.available && setSelectedType(option.type)}
              className={cn(
                "relative flex flex-col items-start gap-2 rounded-lg border-2 p-4 transition-all",
                "min-h-[120px]",
                "hover:border-primary/50",
                "disabled:cursor-not-allowed disabled:opacity-60",
                selectedType === option.type && option.available
                  ? "border-primary bg-primary/5"
                  : "border-border"
              )}
            >
              {/* Coming Soon Badge */}
              {!option.available && (
                <div className="absolute top-2 right-2 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                  Coming Soon
                </div>
              )}

              {/* Icon */}
              <div className="text-3xl">{option.icon}</div>

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

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleConfirm}>
            Create Experience
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
