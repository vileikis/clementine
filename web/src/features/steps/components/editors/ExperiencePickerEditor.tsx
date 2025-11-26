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

import { useEffect, useCallback, useRef, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlertCircle, Check, ImageIcon } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { BaseStepEditor } from "./BaseStepEditor";
import { STEP_CONSTANTS } from "../../constants";
import type { StepExperiencePicker } from "../../types";
import type { Experience } from "@/features/experiences/types";

const experiencePickerFormSchema = z.object({
  // Base fields
  title: z.string().max(200).optional().nullable(),
  description: z.string().max(1000).optional().nullable(),
  mediaUrl: z.string().url().optional().nullable().or(z.literal("")),
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

interface ExperiencePickerEditorProps {
  step: StepExperiencePicker;
  experiences: Experience[];
  onUpdate: (updates: Partial<ExperiencePickerFormValues>) => Promise<void>;
  onPreviewChange?: (values: ExperiencePickerFormValues) => void;
}

export function ExperiencePickerEditor({
  step,
  experiences,
  onUpdate,
  onPreviewChange,
}: ExperiencePickerEditorProps) {
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Provide defaults for config in case it's undefined
  const config = step.config ?? { layout: "grid" as const, variable: "selected_experience_id", experienceIds: [] };

  const form = useForm<ExperiencePickerFormValues>({
    resolver: zodResolver(experiencePickerFormSchema),
    defaultValues: {
      title: step.title ?? "",
      description: step.description ?? "",
      mediaUrl: step.mediaUrl ?? "",
      ctaLabel: step.ctaLabel ?? "",
      config: {
        layout: config.layout,
        variable: config.variable,
        experienceIds: config.experienceIds || [],
      },
    },
  });


  const selectedIds = form.watch("config.experienceIds");


  // Track which experienceIds reference missing experiences
  const missingExperienceIds = useMemo(() => {
    const availableIds = new Set((experiences ?? []).map((e) => e.id));
    console.log("----availableIds", availableIds);
    console.log("----config.experienceIds", JSON.stringify(config.experienceIds, null, 2));

    return config.experienceIds?.filter((id) => !availableIds.has(id)) ?? [];
  }, [config.experienceIds, experiences]);

  // Reset form when step ID changes
  useEffect(() => {
    form.reset({
      title: step.title ?? "",
      description: step.description ?? "",
      mediaUrl: step.mediaUrl ?? "",
      ctaLabel: step.ctaLabel ?? "",
      config: {
        layout: config.layout,
        variable: config.variable,
        experienceIds: config.experienceIds,
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

  // Debounced auto-save on blur
  const handleBlur = useCallback(async () => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(async () => {
      const isValid = await form.trigger();
      if (isValid) {
        const values = form.getValues();
        const updates: Partial<ExperiencePickerFormValues> = {};

        if (values.title !== step.title) updates.title = values.title || null;
        if (values.description !== step.description)
          updates.description = values.description || null;
        if (values.mediaUrl !== step.mediaUrl)
          updates.mediaUrl = values.mediaUrl || null;
        if (values.ctaLabel !== step.ctaLabel)
          updates.ctaLabel = values.ctaLabel || null;

        // Check config changes
        const stepConfig = step.config ?? { layout: "grid", variable: "selected_experience_id", experienceIds: [] };
        const configChanged =
          values.config.layout !== stepConfig.layout ||
          values.config.variable !== stepConfig.variable ||
          JSON.stringify(values.config.experienceIds) !==
            JSON.stringify(stepConfig.experienceIds);

        if (configChanged) {
          updates.config = values.config;
        }

        if (Object.keys(updates).length > 0) {
          await onUpdate(updates);
        }
      }
    }, 300);
  }, [form, step, onUpdate]);

  // Save immediately when experience selection changes
  const handleExperienceToggle = useCallback(
    async (experienceId: string, checked: boolean) => {
      const currentIds = form.getValues("config.experienceIds");
      const newIds = checked
        ? [...currentIds, experienceId]
        : currentIds.filter((id) => id !== experienceId);

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

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return (
    <Form {...form}>
      <form onBlur={handleBlur} className="space-y-6">
        {/* Base Fields */}
        <BaseStepEditor
          form={form}
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
          <FormLabel>Select Experiences</FormLabel>
          {!experiences || experiences.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No experiences available for this event.
            </p>
          ) : (
            <div className="space-y-2">
              {experiences.map((experience) => {
                const isSelected = selectedIds.includes(experience.id);
                return (
                  <label
                    key={experience.id}
                    className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-muted/50"
                    }`}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(checked) =>
                        handleExperienceToggle(experience.id, checked === true)
                      }
                    />
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
                    {isSelected && (
                      <Check className="h-4 w-4 text-primary shrink-0" />
                    )}
                  </label>
                );
              })}
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
