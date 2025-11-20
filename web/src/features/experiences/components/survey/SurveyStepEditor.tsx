"use client";

/**
 * Component: SurveyStepEditor
 *
 * Main editor for configuring survey step properties.
 * Uses React Hook Form with Zod validation for type-safe form management.
 * Integrates type-specific editors based on step.type discriminator.
 *
 * Part of 001-survey-experience implementation (Phase 3 - User Story 1).
 */

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSurveyStepMutations } from "../../hooks/useSurveyStepMutations";
import { surveyStepSchema, type SurveyStep } from "../../lib/schemas";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { MultipleChoiceEditor } from "./step-types/MultipleChoiceEditor";
import { YesNoEditor } from "./step-types/YesNoEditor";
import { OpinionScaleEditor } from "./step-types/OpinionScaleEditor";
import { TextEditor } from "./step-types/TextEditor";
import { EmailEditor } from "./step-types/EmailEditor";
import { StatementEditor } from "./step-types/StatementEditor";
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

interface SurveyStepEditorProps {
  eventId: string;
  experienceId: string;
  step: SurveyStep;
  onStepDeleted?: () => void;
}

export function SurveyStepEditor({
  eventId,
  experienceId,
  step,
  onStepDeleted,
}: SurveyStepEditorProps) {
  const mutations = useSurveyStepMutations();

  // React Hook Form setup with Zod validation
   
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset,
  } = useForm({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(surveyStepSchema) as any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    defaultValues: step as any,
  });

  // Reset form when step changes
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    reset(step as any);
  }, [step, reset]);

  // Auto-save on form changes (debounced in real implementation)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onSubmit = async (data: any) => {
    await mutations.updateStep(eventId, step.id, {
      title: data.title,
      description: data.description,
      required: data.required ?? null,
      helperText: data.helperText,
      ctaLabel: data.ctaLabel,
      mediaUrl: data.mediaUrl,
      config: data.config ?? null,
    });
  };

  // Handle step deletion
  const handleDelete = async () => {
    const result = await mutations.deleteStep(eventId, experienceId, step.id);
    if (result.success) {
      onStepDeleted?.();
    } else if (result.error) {
      // Error is already tracked in mutations.deleteError
      console.error("Failed to delete step:", result.error);
    }
  };

  // Watch values for character counts
  const titleValue = watch("title") || "";
  const descriptionValue = watch("description") || "";

  // Handler for onBlur events
  const handleBlur = () => {
    handleSubmit(onSubmit)();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Header with Delete Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Edit Step</h2>
          <p className="text-sm text-muted-foreground">
            {formatStepType(step.type)}
          </p>
        </div>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="min-h-[44px] min-w-[44px]"
              disabled={mutations.deleteLoading}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this step?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. The step will be permanently
                removed from your survey.
              </AlertDialogDescription>
            </AlertDialogHeader>
            {mutations.deleteError && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {mutations.deleteError}
              </div>
            )}
            <AlertDialogFooter>
              <AlertDialogCancel disabled={mutations.deleteLoading}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={mutations.deleteLoading}
                className="bg-destructive hover:bg-destructive/90"
              >
                {mutations.deleteLoading ? "Deleting..." : "Delete Step"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Common Fields */}
      <div className="space-y-4">
        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="title">
            Question Title <span className="text-destructive">*</span>
          </Label>
          <Input
            id="title"
            {...register("title")}
            placeholder="Enter your question"
            className="min-h-[44px]"
            onBlur={handleBlur}
          />
          <div className="flex items-center justify-between">
            {errors.title && (
              <p className="text-xs text-destructive">{String(errors.title.message)}</p>
            )}
            <p
              className={cn(
                "text-xs text-muted-foreground ml-auto",
                titleValue.length > 200 && "text-destructive"
              )}
            >
              {titleValue.length}/200
            </p>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">Description (optional)</Label>
          <Textarea
            id="description"
            {...register("description")}
            placeholder="Add helpful context or instructions"
            rows={2}
            className="resize-none"
            onBlur={handleBlur}
          />
          <div className="flex items-center justify-between">
            {errors.description && (
              <p className="text-xs text-destructive">
                {String(errors.description.message)}
              </p>
            )}
            <p
              className={cn(
                "text-xs text-muted-foreground ml-auto",
                descriptionValue.length > 500 && "text-destructive"
              )}
            >
              {descriptionValue.length}/500
            </p>
          </div>
        </div>

        {/* Required Toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="required">Required</Label>
            <p className="text-xs text-muted-foreground">
              Guests must answer this question
            </p>
          </div>
          <Switch
            id="required"
            checked={watch("required") ?? false}
            onCheckedChange={(checked) => {
              setValue("required", checked, { shouldDirty: true });
              handleBlur();
            }}
          />
        </div>
      </div>

      {/* Type-Specific Configuration */}
      <div className="border-t pt-6">
        <h3 className="font-semibold mb-4">Configuration</h3>
        {renderTypeSpecificEditor(step, register, watch, setValue, errors, handleBlur)}
      </div>

      {/* Save Indicator */}
      {mutations.updateLoading && (
        <p className="text-sm text-muted-foreground">Saving...</p>
      )}
      {mutations.updateError && (
        <p className="text-sm text-destructive">{mutations.updateError}</p>
      )}
    </form>
  );
}

/**
 * Render type-specific editor based on step.type discriminator
 */
function renderTypeSpecificEditor(
  step: SurveyStep,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  watch: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setValue: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  errors: any,
  onSubmit: () => void
) {
  switch (step.type) {
    case "multiple_choice":
      return (
        <MultipleChoiceEditor
          config={step.config}
          watch={watch}
          setValue={setValue}
          errors={errors}
          onBlur={onSubmit}
        />
      );

    case "yes_no":
      return (
        <YesNoEditor
          config={step.config}
          register={register}
          watch={watch}
          setValue={setValue}
          errors={errors}
          onBlur={onSubmit}
        />
      );

    case "opinion_scale":
      return (
        <OpinionScaleEditor
          config={step.config}
          register={register}
          watch={watch}
          setValue={setValue}
          errors={errors}
          onBlur={onSubmit}
        />
      );

    case "short_text":
    case "long_text":
      return (
        <TextEditor
          type={step.type}
          config={step.config}
          register={register}
          watch={watch}
          setValue={setValue}
          errors={errors}
          onBlur={onSubmit}
        />
      );

    case "email":
      return (
        <EmailEditor
          config={step.config}
          register={register}
          watch={watch}
          setValue={setValue}
          errors={errors}
          onBlur={onSubmit}
        />
      );

    case "statement":
      return <StatementEditor />;

    default:
      // Exhaustive check for discriminated union
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _exhaustive: never = step;
      return null;
  }
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
