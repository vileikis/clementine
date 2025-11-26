"use client";

/**
 * Component: StepEditor
 *
 * Right panel of the journey editor.
 * Routes to the appropriate type-specific editor based on step.type.
 * Handles step updates and deletion.
 */

import { useCallback } from "react";
import { Trash2 } from "lucide-react";
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
  ExperiencePickerEditor,
} from "@/features/steps/components/editors";
import { useStepMutations } from "../../hooks";
import { getStepTypeMeta } from "@/features/steps/constants";
import type { Step, StepInfo, StepExperiencePicker } from "@/features/steps/types";
import type { Experience } from "@/features/experiences/types";

interface StepEditorProps {
  eventId: string;
  step: Step;
  experiences: Experience[];
  onStepDeleted?: () => void;
  onPreviewChange?: (step: Partial<Step>) => void;
}

export function StepEditor({
  eventId,
  step,
  experiences,
  onStepDeleted,
  onPreviewChange,
}: StepEditorProps) {
  const { updateStep, deleteStep, isUpdating, isDeleting } = useStepMutations();

  const handleUpdate = useCallback(
    async (updates: Record<string, unknown>) => {
      await updateStep(eventId, step.id, updates);
    },
    [eventId, step.id, updateStep]
  );

  const handleDelete = useCallback(async () => {
    const result = await deleteStep(eventId, step.id);
    if (result.success && onStepDeleted) {
      onStepDeleted();
    }
  }, [eventId, step.id, deleteStep, onStepDeleted]);

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
                This will permanently delete this step from the journey.
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Editor Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {isUpdating && (
          <div className="text-xs text-muted-foreground mb-2">Saving...</div>
        )}
        {renderEditor(step, experiences, handleUpdate, handlePreviewChange)}
      </div>
    </div>
  );
}

/**
 * Renders the appropriate editor based on step type.
 * For now, only InfoStepEditor is implemented.
 * Other step types will be added in later phases.
 */
function renderEditor(
  step: Step,
  experiences: Experience[],
  onUpdate: (updates: Record<string, unknown>) => Promise<void>,
  onPreviewChange: (values: Record<string, unknown>) => void
) {
  switch (step.type) {
    case "info":
      return (
        <InfoStepEditor
          step={step as StepInfo}
          onUpdate={onUpdate}
          onPreviewChange={onPreviewChange}
        />
      );

    case "experience-picker":
      return (
        <ExperiencePickerEditor
          step={step as StepExperiencePicker}
          experiences={experiences}
          onUpdate={onUpdate}
          onPreviewChange={onPreviewChange}
        />
      );

    // TODO: Add editors for other step types in Phase 7-9
    case "capture":
    case "short_text":
    case "long_text":
    case "multiple_choice":
    case "yes_no":
    case "opinion_scale":
    case "email":
    case "processing":
    case "reward":
      return (
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-sm">
            Editor for &quot;{step.type}&quot; step coming soon.
          </p>
          <p className="text-xs mt-2">
            Use the base fields above to configure this step.
          </p>
        </div>
      );

    default:
      return (
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-sm">Unknown step type</p>
        </div>
      );
  }
}
