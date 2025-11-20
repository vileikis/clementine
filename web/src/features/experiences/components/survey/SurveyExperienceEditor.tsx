"use client";

/**
 * Component: SurveyExperienceEditor
 * Updated to use unified ExperienceEditorHeader component
 *
 * Main container for editing survey experiences with:
 * - Unified header: Title, enabled toggle, required toggle (additionalControls), delete button
 * - 3-column layout:
 *   - Left: Step list with drag-and-drop reordering
 *   - Center: Step editor with type-specific configuration
 *   - Right: Real-time preview of the selected step
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
import { ExperienceEditorHeader } from "../shared/ExperienceEditorHeader";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Plus, HelpCircle, AlertTriangle } from "lucide-react";
import { updateSurveyExperience } from "../../actions/survey-update";
import { deleteExperience } from "../../actions/shared";
import type { SurveyExperience, PreviewType } from "../../lib/schemas";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { SURVEY_STEP_SOFT_LIMIT, SURVEY_STEP_HARD_LIMIT } from "../../lib/constants";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface SurveyExperienceEditorProps {
  eventId: string;
  experience: SurveyExperience;
}

export function SurveyExperienceEditor({
  eventId,
  experience,
}: SurveyExperienceEditorProps) {
  const router = useRouter();

  // Real-time subscription to survey steps
  const { steps, loading, error } = useSurveySteps(eventId);

  // Mutation functions
  const mutations = useSurveyStepMutations();

  // State: Selected step ID
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);

  // State: Type selector dialog open/closed
  const [typeSelectorOpen, setTypeSelectorOpen] = useState(false);

  // State: Loading states for toggles
  const [requiredLoading, setRequiredLoading] = useState(false);

  // State: Preview media
  const [previewPath, setPreviewPath] = useState(experience.previewPath || "");
  const [previewType, setPreviewType] = useState<PreviewType | undefined>(experience.previewType || undefined);

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

  // Handle title save
  const handleTitleSave = async (newTitle: string) => {
    const result = await updateSurveyExperience(eventId, experience.id, {
      label: newTitle,
    });
    if (!result.success) {
      throw new Error(result.error.message);
    }
    toast.success("Experience name updated");
  };

  // Handle enabled toggle
  const handleEnabledToggle = async (checked: boolean) => {
    const result = await updateSurveyExperience(eventId, experience.id, {
      enabled: checked,
    });

    if (!result.success) {
      toast.error(result.error.message);
    } else {
      toast.success(`Survey ${checked ? "enabled" : "disabled"}`);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    const result = await deleteExperience(eventId, experience.id);
    if (result.success) {
      toast.success("Survey experience deleted");
      router.push(`/events/${eventId}`);
    } else {
      throw new Error(result.error.message);
    }
  };

  // Handle preview media upload - save immediately for survey
  const handlePreviewMediaUpload = async (publicUrl: string, fileType: PreviewType) => {
    setPreviewPath(publicUrl);
    setPreviewType(fileType);

    // Save to database immediately (surveys don't have a Save button)
    const result = await updateSurveyExperience(eventId, experience.id, {
      previewPath: publicUrl,
      previewType: fileType,
    });

    if (!result.success) {
      // Revert local state on error
      setPreviewPath(experience.previewPath || "");
      setPreviewType(experience.previewType || undefined);
      toast.error("Failed to save preview media");
    } else {
      toast.success("Preview media updated");
    }
  };

  // Handle preview media removal - save immediately for survey
  const handlePreviewMediaRemove = async () => {
    setPreviewPath("");
    setPreviewType(undefined);

    // Save to database immediately (surveys don't have a Save button, use null to clear fields)
    const result = await updateSurveyExperience(eventId, experience.id, {
      previewPath: null,
      previewType: null,
    });

    if (!result.success) {
      // Revert local state on error
      setPreviewPath(experience.previewPath || "");
      setPreviewType(experience.previewType || undefined);
      toast.error("Failed to remove preview media");
    } else {
      toast.success("Preview media removed");
    }
  };

  // Handle required toggle
  const handleRequiredToggle = async (checked: boolean) => {
    setRequiredLoading(true);
    try {
      const result = await updateSurveyExperience(eventId, experience.id, {
        config: {
          ...experience.config,
          required: checked,
        },
      });

      if (!result.success) {
        toast.error(result.error.message);
      } else {
        toast.success(`Survey ${checked ? "required" : "optional"}`);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update required status");
    } finally {
      setRequiredLoading(false);
    }
  };

  // Handle step creation from type selector
  const handleStepTypeSelected = async (type: string) => {
    // Check step count limit (hard limit)
    if (orderedSteps.length >= SURVEY_STEP_HARD_LIMIT) {
      // Error will be shown in UI - cannot add more steps
      return;
    }

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

  // Required toggle as additional control for the header
  const renderRequiredToggle = () => (
    <TooltipProvider>
      <div className="flex items-center gap-3">
        <Switch
          id="survey-required"
          checked={experience.config.required}
          onCheckedChange={handleRequiredToggle}
          disabled={requiredLoading || !experience.enabled}
          className="data-[state=checked]:bg-primary"
        />
        <Label
          htmlFor="survey-required"
          className="cursor-pointer text-sm font-medium"
        >
          {requiredLoading ? "Updating..." : "Required"}
        </Label>
        <Tooltip>
          <TooltipTrigger asChild>
            <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            <p>When enabled, guests must complete the survey before proceeding. Only available when survey is enabled.</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );

  // Survey header with unified component
  const renderSurveyHeader = () => (
    <ExperienceEditorHeader
      eventId={eventId}
      experience={experience}
      showPreview={true}
      previewPath={previewPath}
      previewType={previewType}
      onPreviewUpload={handlePreviewMediaUpload}
      onPreviewRemove={handlePreviewMediaRemove}
      onTitleSave={handleTitleSave}
      enabled={experience.enabled}
      onEnabledChange={handleEnabledToggle}
      onDelete={handleDelete}
      additionalControls={renderRequiredToggle()}
    />
  );

  // Empty state: No steps yet
  if (orderedSteps.length === 0) {
    return (
      <div className="flex flex-col">
        {renderSurveyHeader()}
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
      </div>
    );
  }

  // Step count warnings/errors
  const renderStepLimitAlert = () => {
    const stepCount = orderedSteps.length;

    if (stepCount >= SURVEY_STEP_HARD_LIMIT) {
      return (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Maximum steps reached.</strong> You have reached the maximum limit of {SURVEY_STEP_HARD_LIMIT} survey steps.
            Please delete a step before adding more.
          </AlertDescription>
        </Alert>
      );
    }

    if (stepCount >= SURVEY_STEP_SOFT_LIMIT) {
      return (
        <Alert className="mb-6 border-amber-500 bg-amber-50 text-amber-900 dark:bg-amber-950 dark:text-amber-200">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Survey length notice.</strong> You have {stepCount} steps.
            Consider keeping surveys under {SURVEY_STEP_SOFT_LIMIT} steps for better completion rates.
          </AlertDescription>
        </Alert>
      );
    }

    return null;
  };

  // Main 3-column layout
  return (
    <div className="flex flex-col">
      {renderSurveyHeader()}
      {renderStepLimitAlert()}
      <div className={`flex flex-col gap-6 lg:flex-row ${!experience.enabled ? "opacity-50" : ""}`}>
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
              disabled={orderedSteps.length >= SURVEY_STEP_HARD_LIMIT}
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
    </div>
  );
}
