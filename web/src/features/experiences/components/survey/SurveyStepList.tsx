"use client";

/**
 * Component: SurveyStepList
 *
 * Displays a draggable list of survey steps with selection state.
 * Uses @dnd-kit for drag-and-drop reordering with mobile-first touch support.
 *
 * Part of 001-survey-experience implementation (Phase 4 - User Story 2).
 */

import { useState, useEffect, useRef } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SurveyStep } from "../../lib/schemas";
import { useSurveyStepMutations } from "../../hooks/useSurveyStepMutations";

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
  const { reorderSteps, reorderLoading } = useSurveyStepMutations();
  const [optimisticSteps, setOptimisticSteps] = useState<SurveyStep[] | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Configure sensors for drag-and-drop
  // PointerSensor: Supports mouse and touch with activation distance to prevent accidental drags
  // KeyboardSensor: Supports keyboard navigation for accessibility
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px minimum distance before drag starts (prevents accidental drags)
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle drag end event
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return; // No change in position
    }

    // Use current displayed steps (either optimistic or props)
    const currentSteps = optimisticSteps || steps;
    const oldIndex = currentSteps.findIndex((s) => s.id === active.id);
    const newIndex = currentSteps.findIndex((s) => s.id === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Optimistically update local state for immediate feedback
    const newOrder = arrayMove(currentSteps, oldIndex, newIndex);
    setOptimisticSteps(newOrder);

    // Persist to Firestore
    const newOrderIds = newOrder.map((s) => s.id);
    const result = await reorderSteps(eventId, experienceId, newOrderIds);

    if (!result.success) {
      // Revert on error - clear optimistic state to fall back to props
      setOptimisticSteps(null);
      console.error("Failed to reorder steps:", result.error);
    } else {
      // Success - clear optimistic state after a delay to let Firestore update propagate
      timeoutRef.current = setTimeout(() => {
        setOptimisticSteps(null);
      }, 500);
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Use optimistic steps if available, otherwise use props
  const displaySteps = optimisticSteps || steps;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={displaySteps.map((s) => s.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-2">
          {displaySteps.map((step, index) => (
            <StepItem
              key={step.id}
              step={step}
              index={index}
              isSelected={step.id === selectedStepId}
              onSelect={() => onSelectStep(step.id)}
              isDragging={reorderLoading}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

interface StepItemProps {
  step: SurveyStep;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  isDragging?: boolean;
}

function StepItem({ step, index, isSelected, onSelect, isDragging }: StepItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isCurrentlyDragging,
  } = useSortable({ id: step.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isCurrentlyDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "w-full p-3 rounded-lg border transition-colors",
        "min-h-[44px] touch-manipulation", // Mobile-first: touch targets ≥44px
        isSelected
          ? "border-primary bg-primary/5 shadow-sm"
          : "border-border hover:bg-accent hover:border-accent-foreground/20",
        isCurrentlyDragging && "cursor-grabbing z-10 shadow-lg",
        isDragging && "pointer-events-none"
      )}
    >
      <div className="flex items-center gap-3">
        {/* Drag Handle - Touch-friendly size (44x44px minimum) */}
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
          <GripVertical className="h-5 w-5 text-muted-foreground" />
        </button>

        {/* Step Content - Clickable to select */}
        <button
          type="button"
          onClick={onSelect}
          className="flex-1 min-w-0 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
        >
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
        </button>
      </div>
    </div>
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
