"use client";

/**
 * Component: StepList
 *
 * Displays a draggable list of journey steps with selection state.
 * Uses @dnd-kit for drag-and-drop reordering.
 * Mobile-first with touch-friendly interactions.
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
} from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StepListItem } from "./StepListItem";
import { StepTypeSelector } from "./StepTypeSelector";
import { useStepMutations } from "../../hooks";
import type { Step, StepType } from "@/features/steps/types";

interface StepListProps {
  eventId: string;
  journeyId: string;
  steps: Step[];
  selectedStepId: string | null;
  onSelectStep: (stepId: string) => void;
}

export function StepList({
  eventId,
  journeyId,
  steps,
  selectedStepId,
  onSelectStep,
}: StepListProps) {
  const { createStep, reorderSteps, isCreating, isReordering } = useStepMutations();
  const [optimisticSteps, setOptimisticSteps] = useState<Step[] | null>(null);
  const [showTypeSelector, setShowTypeSelector] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Configure sensors for drag-and-drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Prevent accidental drags
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
      return;
    }

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

    // Optimistically update local state
    const newOrder = arrayMove(currentSteps, oldIndex, newIndex);
    setOptimisticSteps(newOrder);

    // Persist to Firestore
    const newOrderIds = newOrder.map((s) => s.id);
    const result = await reorderSteps(eventId, journeyId, newOrderIds);

    if (!result.success) {
      // Revert on error
      setOptimisticSteps(null);
    } else {
      // Clear optimistic state after delay
      timeoutRef.current = setTimeout(() => {
        setOptimisticSteps(null);
      }, 500);
    }
  };

  // Handle step type selection
  const handleTypeSelected = async (type: StepType) => {
    const result = await createStep(eventId, journeyId, type);
    if (result.success && result.stepId) {
      setShowTypeSelector(false);
      onSelectStep(result.stepId);
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

  const displaySteps = optimisticSteps || steps;

  return (
    <div className="flex flex-col h-full">
      {/* Header with Add Button */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <h2 className="text-sm font-semibold">Steps</h2>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowTypeSelector(true)}
          disabled={isCreating}
          className="h-8"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add
        </Button>
      </div>

      {/* Step List */}
      <div className="flex-1 overflow-y-auto p-4">
        {displaySteps.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <p className="text-sm text-muted-foreground mb-4">
              No steps yet. Add your first step to get started.
            </p>
            <Button
              variant="outline"
              onClick={() => setShowTypeSelector(true)}
              disabled={isCreating}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Step
            </Button>
          </div>
        ) : (
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
                  <StepListItem
                    key={step.id}
                    step={step}
                    index={index}
                    isSelected={step.id === selectedStepId}
                    onSelect={() => onSelectStep(step.id)}
                    isDragging={isReordering}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* Step Type Selector Dialog */}
      <StepTypeSelector
        open={showTypeSelector}
        onOpenChange={setShowTypeSelector}
        onTypeSelected={handleTypeSelected}
        loading={isCreating}
      />
    </div>
  );
}
