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
 */

import { useState, useCallback } from "react";
import { JourneyEditorHeader } from "./JourneyEditorHeader";
import { StepList } from "./StepList";
import { StepEditor } from "./StepEditor";
import { StepPreview } from "./StepPreview";
import { useSteps, useSelectedStep, useEventExperiences } from "../../hooks";
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

  // Preview state - holds the in-progress form values for live preview
  const [previewStep, setPreviewStep] = useState<Partial<Step> | null>(null);

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

  // Merge selected step with preview changes for display
  const displayStep = selectedStep
    ? previewStep
      ? { ...selectedStep, ...previewStep }
      : selectedStep
    : null;

  return (
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
  );
}
