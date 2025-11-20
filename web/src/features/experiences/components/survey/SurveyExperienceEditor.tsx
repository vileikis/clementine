"use client";

/**
 * Component: SurveyExperienceEditor
 *
 * Main container for editing survey experiences with a 3-column layout:
 * - Left: Step list with drag-and-drop reordering
 * - Center: Step editor with type-specific configuration
 * - Right: Real-time preview of the selected step
 *
 * Part of 001-survey-experience implementation (Phase 3 - User Story 1).
 *
 * Mobile-first: Stacks vertically on mobile, side-by-side on desktop (lg+).
 */

import { useState, useEffect } from "react";
import { useSurveySteps } from "../../hooks/useSurveySteps";
import { useSurveyStepMutations } from "../../hooks/useSurveyStepMutations";
import { SurveyStepList } from "./SurveyStepList";
import { SurveyStepEditor } from "./SurveyStepEditor";
import { SurveyStepPreview } from "./SurveyStepPreview";
import { SurveyStepTypeSelector } from "./SurveyStepTypeSelector";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import type { SurveyExperience } from "../../lib/schemas";

interface SurveyExperienceEditorProps {
  eventId: string;
  experience: SurveyExperience;
}

export function SurveyExperienceEditor({
  eventId,
  experience,
}: SurveyExperienceEditorProps) {
  // Real-time subscription to survey steps
  const { steps, loading, error } = useSurveySteps(eventId);

  // Mutation functions
  const mutations = useSurveyStepMutations();

  // State: Selected step ID
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);

  // State: Type selector dialog open/closed
  const [typeSelectorOpen, setTypeSelectorOpen] = useState(false);

  // Get ordered steps based on experience.config.stepsOrder
  const orderedSteps = experience.config.stepsOrder
    .map((stepId) => steps.find((s) => s.id === stepId))
    .filter(Boolean) as typeof steps;

  // Auto-select first step when steps load
  useEffect(() => {
    if (orderedSteps.length > 0 && !selectedStepId) {
      // Use setTimeout to avoid calling setState synchronously within effect
      const timeoutId = setTimeout(() => {
        setSelectedStepId(orderedSteps[0].id);
      }, 0);
      return () => clearTimeout(timeoutId);
    }
  }, [orderedSteps, selectedStepId]);

  // Find selected step
  const selectedStep = orderedSteps.find((s) => s.id === selectedStepId);

  // Handle step creation from type selector
  const handleStepTypeSelected = async (type: string) => {
    // Create step data based on type with proper defaults
    // These defaults match the Zod schema defaults
    let stepData;

    switch (type) {
      case "multiple_choice":
        stepData = {
          type: "multiple_choice" as const,
          title: "Multiple Choice Question",
          required: null,
          config: {
            options: ["Option 1"],
            allowMultiple: false,
          },
        };
        break;
      case "yes_no":
        stepData = {
          type: "yes_no" as const,
          title: "Yes/No Question",
          required: null,
        };
        break;
      case "opinion_scale":
        stepData = {
          type: "opinion_scale" as const,
          title: "Opinion Scale",
          required: null,
          config: {
            scaleMin: 1,
            scaleMax: 5,
          },
        };
        break;
      case "short_text":
        stepData = {
          type: "short_text" as const,
          title: "Short Text Question",
          required: null,
        };
        break;
      case "long_text":
        stepData = {
          type: "long_text" as const,
          title: "Long Text Question",
          required: null,
        };
        break;
      case "email":
        stepData = {
          type: "email" as const,
          title: "Email Address",
          required: null,
        };
        break;
      case "statement":
        stepData = {
          type: "statement" as const,
          title: "Statement",
          required: null,
        };
        break;
      default:
        console.error(`Unknown step type: ${type}`);
        return;
    }

    const result = await mutations.createStep(eventId, experience.id, stepData);

    if (result.success && result.stepId) {
      setSelectedStepId(result.stepId);
      setTypeSelectorOpen(false);
    } else if (result.error) {
      console.error("Failed to create step:", result.error);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Loading survey steps...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-destructive">Error: {error}</p>
      </div>
    );
  }

  // Empty state: No steps yet
  if (orderedSteps.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">No survey steps yet</h3>
          <p className="text-muted-foreground mb-4">
            Add your first question to get started
          </p>
        </div>
        <Button
          onClick={() => setTypeSelectorOpen(true)}
          size="lg"
          className="min-h-[44px] min-w-[44px]"
        >
          <Plus className="mr-2 h-5 w-5" />
          Add First Step
        </Button>
        <SurveyStepTypeSelector
          open={typeSelectorOpen}
          onOpenChange={setTypeSelectorOpen}
          onTypeSelected={handleStepTypeSelected}
          loading={mutations.createLoading}
        />
      </div>
    );
  }

  // Main 3-column layout
  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      {/* Left: Step List */}
      <aside className="w-full lg:w-64 shrink-0">
        <div className="space-y-4">
          <div className="flex items-center justify-between px-4">
            <h3 className="text-sm font-semibold text-foreground">Survey Steps</h3>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setTypeSelectorOpen(true)}
              className="h-8 w-8 p-0"
              aria-label="Add survey step"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <SurveyStepList
            eventId={eventId}
            experienceId={experience.id}
            steps={orderedSteps}
            selectedStepId={selectedStepId}
            onSelectStep={setSelectedStepId}
          />
        </div>
      </aside>

      {/* Center: Preview */}
      <main className="flex-1 min-w-0">
        {selectedStep ? (
          <SurveyStepPreview step={selectedStep} />
        ) : (
          <div className="flex items-center justify-center min-h-[400px]">
            <p className="text-muted-foreground">Select a step to preview</p>
          </div>
        )}
      </main>

      {/* Right: Step Editor */}
      <aside className="w-full lg:w-80 shrink-0">
        {selectedStep ? (
          <SurveyStepEditor
            eventId={eventId}
            experienceId={experience.id}
            step={selectedStep}
            onStepDeleted={() => {
              // Select next available step after deletion
              const currentIndex = orderedSteps.findIndex(
                (s) => s.id === selectedStepId
              );
              const nextStep =
                orderedSteps[currentIndex + 1] || orderedSteps[currentIndex - 1];
              setSelectedStepId(nextStep?.id || null);
            }}
          />
        ) : (
          <div className="flex items-center justify-center min-h-[400px]">
            <p className="text-muted-foreground">Select a step to edit</p>
          </div>
        )}
      </aside>

      {/* Step Type Selector Dialog */}
      <SurveyStepTypeSelector
        open={typeSelectorOpen}
        onOpenChange={setTypeSelectorOpen}
        onTypeSelected={handleStepTypeSelected}
        loading={mutations.createLoading}
      />
    </div>
  );
}
