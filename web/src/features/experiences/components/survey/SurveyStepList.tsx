"use client";

/**
 * Component: SurveyStepList
 *
 * Displays a draggable list of survey steps with selection state.
 * Uses @dnd-kit for drag-and-drop reordering with mobile-first touch support.
 *
 * Part of 001-survey-experience implementation (Phase 3 - User Story 1).
 */

import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SurveyStep } from "../../lib/schemas";

interface SurveyStepListProps {
  eventId: string;
  experienceId: string;
  steps: SurveyStep[];
  selectedStepId: string | null;
  onSelectStep: (stepId: string) => void;
}

export function SurveyStepList({
  eventId,
  experienceId,
  steps,
  selectedStepId,
  onSelectStep,
}: SurveyStepListProps) {
  // For Phase 3 (US1), we show a basic list without drag-and-drop
  // Drag-and-drop will be added in Phase 4 (US2)

  return (
    <div className="space-y-2">
      {steps.map((step, index) => (
        <StepItem
          key={step.id}
          step={step}
          index={index}
          isSelected={step.id === selectedStepId}
          onSelect={() => onSelectStep(step.id)}
        />
      ))}
    </div>
  );
}

interface StepItemProps {
  step: SurveyStep;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
}

function StepItem({ step, index, isSelected, onSelect }: StepItemProps) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        "w-full p-3 rounded-lg border transition-colors text-left",
        "min-h-[44px] touch-manipulation", // Mobile-first: touch targets ≥44px
        isSelected
          ? "border-primary bg-primary/5 shadow-sm"
          : "border-border hover:bg-accent hover:border-accent-foreground/20"
      )}
    >
      <div className="flex items-center gap-3">
        {/* Drag Handle (placeholder for Phase 4) */}
        <div className="flex items-center justify-center min-w-[24px] min-h-[24px]">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>

        {/* Step Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium text-muted-foreground">
              {index + 1}
            </span>
            <span className="text-xs font-medium text-muted-foreground uppercase">
              {formatStepType(step.type)}
            </span>
          </div>
          <p className="text-sm font-medium truncate">
            {step.title || "Untitled step"}
          </p>
        </div>
      </div>
    </button>
  );
}

/**
 * Format step type for display (convert snake_case to Title Case)
 */
function formatStepType(type: string): string {
  return type
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
