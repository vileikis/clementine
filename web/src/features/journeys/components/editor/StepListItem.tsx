"use client";

/**
 * Component: StepListItem
 *
 * A single step item in the step list with drag handle and selection state.
 * Uses @dnd-kit/sortable for drag-and-drop reordering.
 * Mobile-first with ≥44px touch targets.
 */

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  GripVertical,
  Layout,
  Grid3X3,
  Camera,
  Type,
  AlignLeft,
  ListChecks,
  ToggleLeft,
  Gauge,
  Mail,
  Loader2,
  Gift,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Step, StepType } from "@/features/steps/types";

interface StepListItemProps {
  step: Step;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  isDragging?: boolean;
}

const STEP_TYPE_ICONS: Record<StepType, typeof Layout> = {
  info: Layout,
  "experience-picker": Grid3X3,
  capture: Camera,
  short_text: Type,
  long_text: AlignLeft,
  multiple_choice: ListChecks,
  yes_no: ToggleLeft,
  opinion_scale: Gauge,
  email: Mail,
  processing: Loader2,
  reward: Gift,
};

const STEP_TYPE_LABELS: Record<StepType, string> = {
  info: "Info",
  "experience-picker": "Picker",
  capture: "Capture",
  short_text: "Short Text",
  long_text: "Long Text",
  multiple_choice: "Choice",
  yes_no: "Yes/No",
  opinion_scale: "Scale",
  email: "Email",
  processing: "Processing",
  reward: "Reward",
};

export function StepListItem({
  step,
  index,
  isSelected,
  onSelect,
  isDragging: globalDragging,
}: StepListItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: step.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const Icon = STEP_TYPE_ICONS[step.type] || Layout;
  const typeLabel = STEP_TYPE_LABELS[step.type] || step.type;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "w-full p-3 rounded-lg border transition-colors",
        "min-h-[44px] touch-manipulation",
        isSelected
          ? "border-primary bg-primary/5 shadow-sm"
          : "border-border hover:bg-accent hover:border-accent-foreground/20",
        isDragging && "cursor-grabbing z-10 shadow-lg",
        globalDragging && !isDragging && "pointer-events-none"
      )}
    >
      <div className="flex items-center gap-2">
        {/* Drag Handle */}
        <button
          type="button"
          className={cn(
            "flex items-center justify-center cursor-grab active:cursor-grabbing",
            "min-w-[44px] min-h-[44px] -ml-3 touch-manipulation",
            "hover:bg-accent/50 rounded-md transition-colors",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          )}
          {...attributes}
          {...listeners}
          aria-label="Drag to reorder"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </button>

        {/* Step Content - Clickable to select */}
        <button
          type="button"
          onClick={onSelect}
          className="flex-1 min-w-0 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded py-1"
        >
          <div className="flex items-center gap-2">
            {/* Step Number */}
            <span className="text-xs font-medium text-muted-foreground w-5 shrink-0">
              {index + 1}
            </span>

            {/* Step Icon */}
            <Icon className="h-4 w-4 text-muted-foreground shrink-0" />

            {/* Step Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {step.title || "Untitled"}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {typeLabel}
              </p>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}
