"use client";

/**
 * Component: CaptureStepEditor
 *
 * Editor for Capture step type.
 * Allows configuring:
 * - Source variable name (which session variable holds the experience ID)
 * - Fallback experience (used when source variable is not set)
 *
 * The capture step loads Experience config at runtime based on the source variable.
 */

import { useEffect, useCallback, useMemo } from "react";
import { useForm } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { z } from "zod";
import { AlertCircle, ImageIcon } from "lucide-react";
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
import { BaseStepEditor } from "./BaseStepEditor";
import { useAutoSave } from "@/hooks";
import { STEP_CONSTANTS } from "../../constants";
import { stepMediaTypeSchema } from "../../schemas";
import type { StepCapture } from "../../types";
import type { Experience } from "@/features/ai-presets";

const captureFormSchema = z.object({
  // Base fields
  title: z.string().max(200).optional().nullable(),
  description: z.string().max(1000).optional().nullable(),
  mediaUrl: z.string().url().optional().nullable().or(z.literal("")),
  mediaType: stepMediaTypeSchema.optional().nullable(),
  ctaLabel: z.string().max(50).optional().nullable(),
  // Config fields
  config: z.object({
    source: z
      .string()
      .min(1)
      .max(STEP_CONSTANTS.MAX_VARIABLE_NAME_LENGTH)
      .regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/, "Must be a valid variable name"),
    fallbackExperienceId: z.string().nullable().optional(),
  }),
});

type CaptureFormValues = z.infer<typeof captureFormSchema>;

/** Fields to compare for changes */
const FIELDS_TO_COMPARE: (keyof CaptureFormValues)[] = [
  "title",
  "description",
  "mediaUrl",
  "mediaType",
  "ctaLabel",
  "config",
];

interface CaptureStepEditorProps {
  step: StepCapture;
  companyId: string;
  experiences: Experience[];
  onUpdate: (updates: Partial<CaptureFormValues>) => Promise<void>;
  onPreviewChange?: (values: CaptureFormValues) => void;
}

export function CaptureStepEditor({
  step,
  companyId,
  experiences,
  onUpdate,
  onPreviewChange,
}: CaptureStepEditorProps) {
  // Provide defaults for config in case it's undefined
  const config = step.config ?? {
    source: "selected_experience_id",
    fallbackExperienceId: null,
  };

  const form = useForm<CaptureFormValues>({
    resolver: standardSchemaResolver(captureFormSchema),
    defaultValues: {
      title: step.title ?? "",
      description: step.description ?? "",
      mediaUrl: step.mediaUrl ?? "",
      mediaType: step.mediaType ?? null,
      ctaLabel: step.ctaLabel ?? "",
      config: {
        source: config.source,
        fallbackExperienceId: config.fallbackExperienceId ?? null,
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

  // Check if fallback experience exists
  const fallbackExperienceId = form.watch("config.fallbackExperienceId");
  const isFallbackMissing = useMemo(() => {
    if (!fallbackExperienceId) return false;
    return !experiences.some((e) => e.id === fallbackExperienceId);
  }, [fallbackExperienceId, experiences]);

  // Get fallback experience data
  const fallbackExperience = useMemo(() => {
    if (!fallbackExperienceId) return null;
    return experiences.find((e) => e.id === fallbackExperienceId) ?? null;
  }, [fallbackExperienceId, experiences]);

  // Reset form when step ID changes
  useEffect(() => {
    form.reset({
      title: step.title ?? "",
      description: step.description ?? "",
      mediaUrl: step.mediaUrl ?? "",
      mediaType: step.mediaType ?? null,
      ctaLabel: step.ctaLabel ?? "",
      config: {
        source: config.source,
        fallbackExperienceId: config.fallbackExperienceId ?? null,
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step.id, form]);

  // Subscribe to form changes for preview updates
  useEffect(() => {
    if (!onPreviewChange) return;

    const subscription = form.watch((values) => {
      onPreviewChange(values as CaptureFormValues);
    });

    return () => subscription.unsubscribe();
  }, [form, onPreviewChange]);

  // Handle fallback experience change
  const handleFallbackChange = useCallback(
    async (value: string) => {
      const newValue = value === "none" ? null : value;
      form.setValue("config.fallbackExperienceId", newValue);

      // Save immediately
      await onUpdate({
        config: {
          ...form.getValues("config"),
          fallbackExperienceId: newValue,
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
          ctaLabelPlaceholder="Take Photo"
        />

        {/* Divider */}
        <div className="border-t pt-4">
          <h3 className="text-sm font-medium mb-4">Capture Settings</h3>
        </div>

        {/* Source Variable */}
        <FormField
          control={form.control}
          name="config.source"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Source Variable</FormLabel>
              <FormControl>
                <Input
                  placeholder="selected_experience_id"
                  {...field}
                  className="font-mono text-sm"
                />
              </FormControl>
              <FormDescription>
                Session variable that holds the selected experience ID
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Missing Fallback Warning */}
        {isFallbackMissing && (
          <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm">
            <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-destructive">Missing experience</p>
              <p className="text-muted-foreground">
                The selected fallback experience no longer exists in this event.
              </p>
            </div>
          </div>
        )}

        {/* Fallback Experience */}
        <FormField
          control={form.control}
          name="config.fallbackExperienceId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fallback Experience</FormLabel>
              {!experiences || experiences.length === 0 ? (
                <div className="text-sm text-muted-foreground py-2">
                  No experiences available for this event.
                </div>
              ) : (
                <Select
                  onValueChange={handleFallbackChange}
                  value={field.value ?? "none"}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select fallback experience" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">
                      <span className="text-muted-foreground">
                        No fallback (require selection)
                      </span>
                    </SelectItem>
                    {experiences.map((experience) => (
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
              <FormDescription>
                Used when the source variable is not set (e.g., guest skips
                experience picker)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Selected Fallback Preview */}
        {fallbackExperience && (
          <div className="flex items-center gap-3 p-3 border border-border rounded-lg bg-muted/30">
            {fallbackExperience.previewMediaUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={fallbackExperience.previewMediaUrl}
                alt=""
                className="h-10 w-10 rounded object-cover shrink-0"
              />
            ) : (
              <div className="h-10 w-10 rounded bg-muted flex items-center justify-center shrink-0">
                <ImageIcon className="h-5 w-5 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {fallbackExperience.name}
              </p>
              <p className="text-xs text-muted-foreground capitalize">
                {fallbackExperience.type}
              </p>
            </div>
          </div>
        )}
      </form>
    </Form>
  );
}
