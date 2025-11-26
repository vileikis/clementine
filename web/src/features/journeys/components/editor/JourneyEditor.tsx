"use client";

/**
 * Component: JourneyEditor
 *
 * Main 3-panel layout for the journey editor.
 * - Left: Step list with drag-and-drop reordering
 * - Middle: Preview panel (placeholder for Phase 4)
 * - Right: Step configuration editor
 *
 * Responsive: Stacks vertically on mobile, side-by-side on desktop.
 */

import { useState, useCallback } from "react";
import { JourneyEditorHeader } from "./JourneyEditorHeader";
import { StepList } from "./StepList";
import { StepEditor } from "./StepEditor";
import { useSteps, useSelectedStep } from "../../hooks";
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
    // After deletion, select the first remaining step or clear selection
    const remainingSteps = steps.filter((s) => s.id !== selectedStepId);
    if (remainingSteps.length > 0) {
      setSelectedStepId(remainingSteps[0].id);
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
    <div className="flex flex-col h-screen">
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
          <div className="flex-1 p-4 overflow-y-auto bg-muted/10">
            <div className="h-full flex items-center justify-center">
              {displayStep ? (
                <StepPreviewPlaceholder step={displayStep as Step} theme={event.theme} />
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

/**
 * Placeholder preview component.
 * Will be replaced with SimulatorScreen in Phase 4 (User Story 2).
 */
import type { EventTheme } from "@/features/events/types";

interface StepPreviewPlaceholderProps {
  step: Step;
  theme: EventTheme;
}

function StepPreviewPlaceholder({ step, theme }: StepPreviewPlaceholderProps) {
  return (
    <div
      className="w-full max-w-[320px] aspect-[9/16] rounded-2xl border-4 border-foreground/10 shadow-lg overflow-hidden relative"
      style={{
        backgroundColor: theme.background.color,
        color: theme.text.color,
      }}
    >
      {/* Background Image */}
      {theme.background.image && (
        <>
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${theme.background.image})` }}
          />
          <div
            className="absolute inset-0"
            style={{ backgroundColor: `rgba(0,0,0,${theme.background.overlayOpacity})` }}
          />
        </>
      )}

      {/* Content */}
      <div
        className="relative z-10 flex flex-col h-full p-6"
        style={{ textAlign: theme.text.alignment }}
      >
        {/* Logo */}
        {theme.logoUrl && (
          <div className="mb-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={theme.logoUrl}
              alt="Event logo"
              className="h-8 w-auto object-contain"
              style={{
                marginLeft: theme.text.alignment === "center" ? "auto" : undefined,
                marginRight: theme.text.alignment === "center" ? "auto" : undefined,
              }}
            />
          </div>
        )}

        {/* Media */}
        {step.mediaUrl && (
          <div className="mb-4 flex-shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={step.mediaUrl}
              alt="Step media"
              className="w-full h-32 object-cover rounded-lg"
            />
          </div>
        )}

        {/* Title & Description */}
        <div className="flex-1">
          {step.title && (
            <h2 className="text-xl font-bold mb-2">{step.title}</h2>
          )}
          {step.description && (
            <p className="text-sm opacity-80">{step.description}</p>
          )}
        </div>

        {/* CTA Button */}
        {step.ctaLabel && (
          <div className="mt-auto pt-4">
            <div
              className="w-full py-3 px-6 text-center font-medium"
              style={{
                backgroundColor: theme.button.backgroundColor ?? theme.primaryColor,
                color: theme.button.textColor,
                borderRadius:
                  theme.button.radius === "none"
                    ? "0"
                    : theme.button.radius === "sm"
                    ? "0.25rem"
                    : theme.button.radius === "md"
                    ? "0.5rem"
                    : "9999px",
              }}
            >
              {step.ctaLabel}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
