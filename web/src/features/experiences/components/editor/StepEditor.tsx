"use client";

/**
 * Component: StepEditor
 *
 * Right panel of the experience editor.
 * Routes to the appropriate type-specific editor based on step.type.
 * Handles step updates and deletion.
 */

import { useCallback } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  InfoStepEditor,
  CaptureStepEditor,
  ShortTextEditor,
  LongTextEditor,
  MultipleChoiceEditor,
  YesNoEditor,
  OpinionScaleEditor,
  EmailEditor,
  ProcessingStepEditor,
  RewardStepEditor,
} from "@/features/steps/components/editors";
import { useStepMutations } from "../../hooks";
import { getStepTypeMeta } from "@/features/steps/constants";
import type {
  Step,
  StepInfo,
  StepCapture,
  StepShortText,
  StepLongText,
  StepMultipleChoice,
  StepYesNo,
  StepOpinionScale,
  StepEmail,
  StepProcessing,
  StepReward,
} from "@/features/steps/types";
import type { AiPreset } from "@/features/ai-presets/types";

interface StepEditorProps {
  experienceId: string;
  companyId: string;
  step: Step;
  aiPresets: AiPreset[];
  onStepDeleted?: () => void;
  onPreviewChange?: (step: Partial<Step>) => void;
}

export function StepEditor({
  experienceId,
  companyId,
  step,
  aiPresets,
  onStepDeleted,
  onPreviewChange,
}: StepEditorProps) {
  const { updateStep, deleteStep, isUpdating, isDeleting } = useStepMutations();

  const handleUpdate = useCallback(
    async (updates: Record<string, unknown>) => {
      await updateStep(experienceId, step.id, updates);
    },
    [experienceId, step.id, updateStep]
  );

  const handleDelete = useCallback(async () => {
    const result = await deleteStep(experienceId, step.id);
    if (result.success && onStepDeleted) {
      onStepDeleted();
    }
  }, [experienceId, step.id, deleteStep, onStepDeleted]);

  const handlePreviewChange = useCallback(
    (values: Record<string, unknown>) => {
      if (onPreviewChange) {
        onPreviewChange({ ...step, ...values });
      }
    },
    [step, onPreviewChange]
  );

  const stepMeta = getStepTypeMeta(step.type);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div>
          <h2 className="text-sm font-semibold">{stepMeta?.label || step.type}</h2>
          <p className="text-xs text-muted-foreground">
            {stepMeta?.description || "Configure this step"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isUpdating && (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          )}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                disabled={isDeleting}
              >
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">Delete step</span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete step?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete this step from the experience.
                  This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-white hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Editor Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {renderEditor(step, companyId, aiPresets, handleUpdate, handlePreviewChange)}
      </div>
    </div>
  );
}

/**
 * Renders the appropriate editor based on step type.
 */
function renderEditor(
  step: Step,
  companyId: string,
  aiPresets: AiPreset[],
  onUpdate: (updates: Record<string, unknown>) => Promise<void>,
  onPreviewChange: (values: Record<string, unknown>) => void
) {
  switch (step.type) {
    case "info":
      return (
        <InfoStepEditor
          step={step as StepInfo}
          companyId={companyId}
          onUpdate={onUpdate}
          onPreviewChange={onPreviewChange}
        />
      );
      
    case "capture":
      return (
        <CaptureStepEditor
          step={step as StepCapture}
          companyId={companyId}
          experiences={aiPresets}
          onUpdate={onUpdate}
          onPreviewChange={onPreviewChange}
        />
      );

    case "short_text":
      return (
        <ShortTextEditor
          step={step as StepShortText}
          companyId={companyId}
          onUpdate={onUpdate}
          onPreviewChange={onPreviewChange}
        />
      );

    case "long_text":
      return (
        <LongTextEditor
          step={step as StepLongText}
          companyId={companyId}
          onUpdate={onUpdate}
          onPreviewChange={onPreviewChange}
        />
      );

    case "multiple_choice":
      return (
        <MultipleChoiceEditor
          step={step as StepMultipleChoice}
          companyId={companyId}
          onUpdate={onUpdate}
          onPreviewChange={onPreviewChange}
        />
      );

    case "yes_no":
      return (
        <YesNoEditor
          step={step as StepYesNo}
          companyId={companyId}
          onUpdate={onUpdate}
          onPreviewChange={onPreviewChange}
        />
      );

    case "opinion_scale":
      return (
        <OpinionScaleEditor
          step={step as StepOpinionScale}
          companyId={companyId}
          onUpdate={onUpdate}
          onPreviewChange={onPreviewChange}
        />
      );

    case "email":
      return (
        <EmailEditor
          step={step as StepEmail}
          companyId={companyId}
          onUpdate={onUpdate}
          onPreviewChange={onPreviewChange}
        />
      );

    case "processing":
      return (
        <ProcessingStepEditor
          step={step as StepProcessing}
          companyId={companyId}
          onUpdate={onUpdate}
          onPreviewChange={onPreviewChange}
        />
      );

    case "reward":
      return (
        <RewardStepEditor
          step={step as StepReward}
          companyId={companyId}
          onUpdate={onUpdate}
          onPreviewChange={onPreviewChange}
        />
      );

    default:
      return (
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-sm">Unknown step type</p>
        </div>
      );
  }
}
