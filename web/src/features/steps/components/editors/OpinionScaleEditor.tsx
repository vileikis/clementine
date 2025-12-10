"use client";

/**
 * Component: OpinionScaleEditor
 *
 * Editor for Opinion Scale step type.
 * Configures numeric scale with min/max values and endpoint labels.
 */

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { Switch } from "@/components/ui/switch";
import { BaseStepEditor } from "./BaseStepEditor";
import { useAutoSave } from "@/hooks";
import { STEP_CONSTANTS } from "../../constants";
import { stepMediaTypeSchema } from "../../schemas";
import type { StepOpinionScale } from "../../types";

const opinionScaleFormSchema = z
  .object({
    // Base fields
    title: z.string().max(200).optional().nullable(),
    description: z.string().max(1000).optional().nullable(),
    mediaUrl: z.string().url().optional().nullable().or(z.literal("")),
    mediaType: stepMediaTypeSchema.optional().nullable(),
    ctaLabel: z.string().max(50).optional().nullable(),
    // Config fields
    config: z.object({
      variable: z
        .string()
        .min(1)
        .max(STEP_CONSTANTS.MAX_VARIABLE_NAME_LENGTH)
        .regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/, "Must be a valid variable name"),
      scaleMin: z
        .number()
        .min(STEP_CONSTANTS.MIN_SCALE_VALUE)
        .max(STEP_CONSTANTS.MAX_SCALE_VALUE),
      scaleMax: z
        .number()
        .min(2)
        .max(STEP_CONSTANTS.MAX_SCALE_VALUE),
      minLabel: z.string().max(50).optional().nullable(),
      maxLabel: z.string().max(50).optional().nullable(),
      required: z.boolean(),
    }),
  })
  .refine((data) => data.config.scaleMax > data.config.scaleMin, {
    message: "Maximum must be greater than minimum",
    path: ["config", "scaleMax"],
  });

type OpinionScaleFormValues = z.infer<typeof opinionScaleFormSchema>;

/** Fields to compare for changes */
const FIELDS_TO_COMPARE: (keyof OpinionScaleFormValues)[] = [
  "title",
  "description",
  "mediaUrl",
  "mediaType",
  "ctaLabel",
  "config",
];

interface OpinionScaleEditorProps {
  step: StepOpinionScale;
  companyId: string;
  onUpdate: (updates: Partial<OpinionScaleFormValues>) => Promise<void>;
  onPreviewChange?: (values: OpinionScaleFormValues) => void;
}

export function OpinionScaleEditor({
  step,
  companyId,
  onUpdate,
  onPreviewChange,
}: OpinionScaleEditorProps) {
  // Provide defaults for config in case it's undefined
  const config = step.config ?? {
    variable: "user_rating",
    scaleMin: 1,
    scaleMax: 5,
    minLabel: "Not at all",
    maxLabel: "Very much",
    required: false,
  };

  const form = useForm<OpinionScaleFormValues>({
    resolver: zodResolver(opinionScaleFormSchema),
    defaultValues: {
      title: step.title ?? "",
      description: step.description ?? "",
      mediaUrl: step.mediaUrl ?? "",
      mediaType: step.mediaType ?? null,
      ctaLabel: step.ctaLabel ?? "",
      config: {
        variable: config.variable,
        scaleMin: config.scaleMin,
        scaleMax: config.scaleMax,
        minLabel: config.minLabel ?? "",
        maxLabel: config.maxLabel ?? "",
        required: config.required,
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

  // Reset form when step ID changes
  useEffect(() => {
    form.reset({
      title: step.title ?? "",
      description: step.description ?? "",
      mediaUrl: step.mediaUrl ?? "",
      mediaType: step.mediaType ?? null,
      ctaLabel: step.ctaLabel ?? "",
      config: {
        variable: config.variable,
        scaleMin: config.scaleMin,
        scaleMax: config.scaleMax,
        minLabel: config.minLabel ?? "",
        maxLabel: config.maxLabel ?? "",
        required: config.required,
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step.id, form]);

  // Subscribe to form changes for preview updates
  useEffect(() => {
    if (!onPreviewChange) return;

    const subscription = form.watch((values) => {
      onPreviewChange(values as OpinionScaleFormValues);
    });

    return () => subscription.unsubscribe();
  }, [form, onPreviewChange]);

  // Watch scale values for preview
  const scaleMin = form.watch("config.scaleMin");
  const scaleMax = form.watch("config.scaleMax");
  const scaleRange = Math.max(0, scaleMax - scaleMin + 1);

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
          showCtaLabel={false}
        />

        {/* Divider */}
        <div className="border-t pt-4">
          <h3 className="text-sm font-medium mb-4">Scale Settings</h3>
        </div>

        {/* Variable Name */}
        <FormField
          control={form.control}
          name="config.variable"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Variable Name</FormLabel>
              <FormControl>
                <Input
                  placeholder="user_rating"
                  {...field}
                  className="font-mono text-sm"
                />
              </FormControl>
              <FormDescription>
                Session variable to store the selected number
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Scale Range */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="config.scaleMin"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Minimum</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={STEP_CONSTANTS.MIN_SCALE_VALUE}
                    max={STEP_CONSTANTS.MAX_SCALE_VALUE}
                    {...field}
                    onChange={(e) =>
                      field.onChange(parseInt(e.target.value, 10) || 0)
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="config.scaleMax"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Maximum</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={2}
                    max={STEP_CONSTANTS.MAX_SCALE_VALUE}
                    {...field}
                    onChange={(e) =>
                      field.onChange(parseInt(e.target.value, 10) || 2)
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Scale will show {scaleRange} options ({scaleMin} to {scaleMax})
        </p>

        {/* Scale Labels */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="config.minLabel"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Low Label</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Not at all"
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormDescription>Label for minimum value</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="config.maxLabel"
            render={({ field }) => (
              <FormItem>
                <FormLabel>High Label</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Very much"
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormDescription>Label for maximum value</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Required */}
        <FormField
          control={form.control}
          name="config.required"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Required</FormLabel>
                <FormDescription>
                  User must select a rating to continue
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}
