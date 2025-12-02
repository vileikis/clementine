"use client";

/**
 * Component: ExperiencePickerEditor
 *
 * Editor for Experience Picker step type.
 * Allows configuring:
 * - Layout (grid, list, carousel)
 * - Variable name for storing selection
 * - Experience selection from available event experiences
 *
 * Experience display data (name, previewMediaUrl) is resolved at runtime.
 */

import { useEffect, useCallback, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlertCircle, ImageIcon, Plus, Trash2 } from "lucide-react";
import { Form } from "@/components/ui/form";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { BaseStepEditor } from "./BaseStepEditor";
import { useAutoSave } from "../../hooks";
import { STEP_CONSTANTS } from "../../constants";
import { stepMediaTypeSchema } from "../../schemas";
import type { StepExperiencePicker } from "../../types";
import type { Experience } from "@/features/ai-presets";

const experiencePickerFormSchema = z.object({
  // Base fields
  title: z.string().max(200).optional().nullable(),
  description: z.string().max(1000).optional().nullable(),
  mediaUrl: z.string().url().optional().nullable().or(z.literal("")),
  mediaType: stepMediaTypeSchema.optional().nullable(),
  ctaLabel: z.string().max(50).optional().nullable(),
  // Config fields
  config: z.object({
    layout: z.enum(["grid", "list", "carousel"]),
    variable: z
      .string()
      .min(1)
      .max(STEP_CONSTANTS.MAX_VARIABLE_NAME_LENGTH)
      .regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/, "Must be a valid variable name"),
    experienceIds: z.array(z.string()).max(STEP_CONSTANTS.MAX_EXPERIENCE_OPTIONS),
  }),
});

type ExperiencePickerFormValues = z.infer<typeof experiencePickerFormSchema>;

/** Fields to compare for changes */
const FIELDS_TO_COMPARE: (keyof ExperiencePickerFormValues)[] = [
  "title",
  "description",
  "mediaUrl",
  "mediaType",
  "ctaLabel",
  "config",
];

interface ExperiencePickerEditorProps {
  step: StepExperiencePicker;
  companyId: string;
  experiences: Experience[];
  onUpdate: (updates: Partial<ExperiencePickerFormValues>) => Promise<void>;
  onPreviewChange?: (values: ExperiencePickerFormValues) => void;
}

export function ExperiencePickerEditor({
  step,
  companyId,
  experiences,
  onUpdate,
  onPreviewChange,
}: ExperiencePickerEditorProps) {
  // Provide defaults for config in case it's undefined
  const config = step.config ?? {
    layout: "grid" as const,
    variable: "selected_experience_id",
    experienceIds: [],
  };

  const form = useForm<ExperiencePickerFormValues>({
    resolver: zodResolver(experiencePickerFormSchema),
    defaultValues: {
      title: step.title ?? "",
      description: step.description ?? "",
      mediaUrl: step.mediaUrl ?? "",
      mediaType: step.mediaType ?? null,
      ctaLabel: step.ctaLabel ?? "",
      config: {
        layout: config.layout,
        variable: config.variable,
        experienceIds: config.experienceIds || [],
      },
    },
  });

  // Auto-save on blur with debouncing
  const { handleBlur } = useAutoSave({
    form,
    originalValues: step,
    onUpdate,
    fieldsToCompare: FIELDS_TO_COMPARE,
  });

  const selectedIds = form.watch("config.experienceIds");

  // Track which experienceIds reference missing experiences
  const missingExperienceIds = useMemo(() => {
    const availableIds = new Set((experiences ?? []).map((e) => e.id));
    return (config.experienceIds || []).filter((id) => !availableIds.has(id));
  }, [config.experienceIds, experiences]);

  // Reset form when step ID changes
  useEffect(() => {
    form.reset({
      title: step.title ?? "",
      description: step.description ?? "",
      mediaUrl: step.mediaUrl ?? "",
      mediaType: step.mediaType ?? null,
      ctaLabel: step.ctaLabel ?? "",
      config: {
        layout: config.layout,
        variable: config.variable,
        experienceIds: config.experienceIds || [],
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step.id, form]);

  // Subscribe to form changes for preview updates
  useEffect(() => {
    if (!onPreviewChange) return;

    const subscription = form.watch((values) => {
      onPreviewChange(values as ExperiencePickerFormValues);
    });

    return () => subscription.unsubscribe();
  }, [form, onPreviewChange]);

  // Get available (unselected) experiences for the dropdown
  const availableExperiences = useMemo(() => {
    const selectedSet = new Set(selectedIds);
    return (experiences ?? []).filter((e) => !selectedSet.has(e.id));
  }, [experiences, selectedIds]);

  // Get selected experiences with their data
  const selectedExperiences = useMemo(() => {
    const experienceMap = new Map((experiences ?? []).map((e) => [e.id, e]));
    return selectedIds
      .map((id) => experienceMap.get(id))
      .filter((e): e is Experience => e !== undefined);
  }, [experiences, selectedIds]);

  // Add experience to selection
  const handleAddExperience = useCallback(
    async (experienceId: string) => {
      const currentIds = form.getValues("config.experienceIds");
      if (currentIds.includes(experienceId)) return;

      const newIds = [...currentIds, experienceId];
      form.setValue("config.experienceIds", newIds);

      // Save immediately
      await onUpdate({
        config: {
          ...form.getValues("config"),
          experienceIds: newIds,
        },
      });
    },
    [form, onUpdate]
  );

  // Remove experience from selection
  const handleRemoveExperience = useCallback(
    async (experienceId: string) => {
      const currentIds = form.getValues("config.experienceIds");
      const newIds = currentIds.filter((id) => id !== experienceId);
      form.setValue("config.experienceIds", newIds);

      // Save immediately
      await onUpdate({
        config: {
          ...form.getValues("config"),
          experienceIds: newIds,
        },
      });
    },
    [form, onUpdate]
  );

  return (
    <Form {...form}>
      <form onBlur={handleBlur} className="space-y-6">
        {/* Base Fields */}
        <BaseStepEditor
          form={form}
          companyId={companyId}
          onMediaChange={async (mediaUrl, mediaType) => {
            await onUpdate({ mediaUrl, mediaType });
          }}
          showDescription={true}
          showMediaUrl={true}
          showCtaLabel={true}
          ctaLabelPlaceholder="Continue"
        />

        {/* Divider */}
        <div className="border-t pt-4">
          <h3 className="text-sm font-medium mb-4">Experience Picker Settings</h3>
        </div>

        {/* Layout */}
        <FormField
          control={form.control}
          name="config.layout"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Layout</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select layout" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="grid">Grid</SelectItem>
                  <SelectItem value="list">List</SelectItem>
                  <SelectItem value="carousel">Carousel</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>How options are displayed to guests</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Variable Name */}
        <FormField
          control={form.control}
          name="config.variable"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Variable Name</FormLabel>
              <FormControl>
                <Input
                  placeholder="selected_experience_id"
                  {...field}
                  className="font-mono text-sm"
                />
              </FormControl>
              <FormDescription>
                Session variable to store the selected experience ID
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Missing Experiences Warning */}
        {missingExperienceIds.length > 0 && (
          <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm">
            <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-destructive">Missing experiences</p>
              <p className="text-muted-foreground">
                {missingExperienceIds.length} selected experience(s) no longer exist
                in this event.
              </p>
            </div>
          </div>
        )}

        {/* Experience Selection */}
        <div className="space-y-3">
          <FormLabel>Experiences</FormLabel>

          {/* Add Experience Dropdown */}
          {!experiences || experiences.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No experiences available for this event.
            </p>
          ) : availableExperiences.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">
              All experiences have been added.
            </p>
          ) : (
            <Select onValueChange={handleAddExperience} value="">
              <SelectTrigger className="w-full">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Plus className="h-4 w-4" />
                  <span>Add experience...</span>
                </div>
              </SelectTrigger>
              <SelectContent>
                {availableExperiences.map((experience) => (
                  <SelectItem key={experience.id} value={experience.id}>
                    <div className="flex items-center gap-2">
                      {experience.previewMediaUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={experience.previewMediaUrl}
                          alt=""
                          className="h-6 w-6 rounded object-cover shrink-0"
                        />
                      ) : (
                        <div className="h-6 w-6 rounded bg-muted flex items-center justify-center shrink-0">
                          <ImageIcon className="h-3 w-3 text-muted-foreground" />
                        </div>
                      )}
                      <span>{experience.name}</span>
                      <span className="text-xs text-muted-foreground capitalize">
                        ({experience.type})
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Selected Experiences List */}
          {selectedExperiences.length > 0 && (
            <div className="space-y-2">
              {selectedExperiences.map((experience) => (
                <div
                  key={experience.id}
                  className="flex items-center gap-3 p-3 border border-border rounded-lg bg-muted/30"
                >
                  {experience.previewMediaUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={experience.previewMediaUrl}
                      alt=""
                      className="h-10 w-10 rounded object-cover shrink-0"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded bg-muted flex items-center justify-center shrink-0">
                      <ImageIcon className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{experience.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {experience.type}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                    onClick={() => handleRemoveExperience(experience.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Remove {experience.name}</span>
                  </Button>
                </div>
              ))}
            </div>
          )}

          <FormDescription>
            {selectedIds.length} of {STEP_CONSTANTS.MAX_EXPERIENCE_OPTIONS} max
            selected
          </FormDescription>
        </div>
      </form>
    </Form>
  );
}
