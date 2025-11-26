"use client";

/**
 * Component: JourneyEditor
 *
 * Main 3-panel layout for the journey editor.
 * - Left: Step list with drag-and-drop reordering
 * - Middle: Live preview panel with event theme
 * - Right: Step configuration editor
 *
 * Responsive: Stacks vertically on mobile, side-by-side on desktop.
 *
 * Keyboard shortcuts:
 * - ArrowUp/ArrowDown: Navigate between steps
 * - Delete/Backspace: Delete selected step (with confirmation)
 * - Cmd/Ctrl+D: Duplicate selected step
 */

import { useState, useCallback } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { JourneyEditorHeader } from "./JourneyEditorHeader";
import { StepList } from "./StepList";
import { StepEditor } from "./StepEditor";
import { StepPreview } from "./StepPreview";
import {
  useSteps,
  useSelectedStep,
  useEventExperiences,
  useStepMutations,
  useKeyboardShortcuts,
} from "../../hooks";
import type { Journey } from "../../types";
import type { Step } from "@/features/steps/types";
import type { Event } from "@/features/events/types";

interface JourneyEditorProps {
  event: Event;
  journey: Journey;
}

export function JourneyEditor({ event, journey }: JourneyEditorProps) {
  const { steps, loading: stepsLoading } = useSteps(event.id, journey.id, journey);
  const { selectedStepId, selectedStep, setSelectedStepId } = useSelectedStep(steps);
  const { experiences } = useEventExperiences(event.id);
  const { deleteStep, duplicateStep } = useStepMutations();

  // Preview state - holds the in-progress form values for live preview
  const [previewStep, setPreviewStep] = useState<Partial<Step> | null>(null);

  // Delete confirmation dialog state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleSelectStep = useCallback(
    (stepId: string) => {
      setSelectedStepId(stepId);
      setPreviewStep(null); // Reset preview state when switching steps
    },
    [setSelectedStepId]
  );

  const handleStepDeleted = useCallback(() => {
    // After deletion, select the next step (or previous if at end), or clear selection
    const currentIndex = steps.findIndex((s) => s.id === selectedStepId);
    const remainingSteps = steps.filter((s) => s.id !== selectedStepId);

    if (remainingSteps.length > 0) {
      // Try to select the step at the same position (next step)
      // If at end, select the previous step (last in remaining)
      const nextIndex = Math.min(currentIndex, remainingSteps.length - 1);
      setSelectedStepId(remainingSteps[nextIndex].id);
    } else {
      setSelectedStepId(null);
    }
    setPreviewStep(null);
  }, [steps, selectedStepId, setSelectedStepId]);

  const handlePreviewChange = useCallback((updates: Partial<Step>) => {
    setPreviewStep(updates);
  }, []);

  // Keyboard shortcut: Delete with confirmation
  const handleKeyboardDelete = useCallback(() => {
    if (selectedStepId) {
      setShowDeleteDialog(true);
    }
  }, [selectedStepId]);

  // Keyboard shortcut: Confirm delete
  const handleConfirmDelete = useCallback(async () => {
    if (selectedStepId) {
      const result = await deleteStep(event.id, selectedStepId);
      if (result.success) {
        handleStepDeleted();
      }
    }
    setShowDeleteDialog(false);
  }, [event.id, selectedStepId, deleteStep, handleStepDeleted]);

  // Keyboard shortcut: Duplicate step
  const handleDuplicateStep = useCallback(async () => {
    if (selectedStepId) {
      const result = await duplicateStep(event.id, selectedStepId);
      if (result.success && result.stepId) {
        setSelectedStepId(result.stepId);
      }
    }
  }, [event.id, selectedStepId, duplicateStep, setSelectedStepId]);

  // Register keyboard shortcuts
  useKeyboardShortcuts({
    stepIds: steps.map((s) => s.id),
    selectedStepId,
    onSelectStep: handleSelectStep,
    onDeleteStep: handleKeyboardDelete,
    onDuplicateStep: handleDuplicateStep,
    enabled: !stepsLoading,
  });

  // Merge selected step with preview changes for display
  const displayStep = selectedStep
    ? previewStep
      ? { ...selectedStep, ...previewStep }
      : selectedStep
    : null;

  return (
    <>
      <div className="flex flex-col h-full">
        {/* Header */}
        <JourneyEditorHeader eventId={event.id} journey={journey} />

        {/* Main Content */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Left Panel - Step List */}
          <aside className="w-full lg:w-64 xl:w-72 border-b lg:border-b-0 lg:border-r bg-muted/30 shrink-0">
            {stepsLoading ? (
              <div className="flex items-center justify-center h-full p-4">
                <p className="text-sm text-muted-foreground">Loading steps...</p>
              </div>
            ) : (
              <StepList
                eventId={event.id}
                journeyId={journey.id}
                steps={steps}
                selectedStepId={selectedStepId}
                onSelectStep={handleSelectStep}
              />
            )}
          </aside>

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            {/* Middle Panel - Preview */}
            <div className="flex-1 p-6 overflow-y-auto bg-muted/10">
              <div className="flex justify-center">
                {displayStep ? (
                  <StepPreview
                    step={displayStep as Step}
                    theme={event.theme}
                    experiences={experiences}
                  />
                ) : (
                  <div className="text-center text-muted-foreground">
                    <p className="text-sm">Select a step to preview</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right Panel - Step Editor */}
            <aside className="w-full md:w-80 xl:w-96 border-t md:border-t-0 md:border-l bg-background shrink-0 overflow-hidden">
              {selectedStep ? (
                <StepEditor
                  eventId={event.id}
                  step={selectedStep}
                  experiences={experiences}
                  onStepDeleted={handleStepDeleted}
                  onPreviewChange={handlePreviewChange}
                />
              ) : (
                <div className="flex items-center justify-center h-full p-4">
                  <p className="text-sm text-muted-foreground">
                    {steps.length === 0
                      ? "Add a step to get started"
                      : "Select a step to edit"}
                  </p>
                </div>
              )}
            </aside>
          </div>
        </div>
      </div>

      {/* Keyboard Shortcut Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete step?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this step from the journey.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
