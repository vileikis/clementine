"use client";

/**
 * Component: LongTextEditor
 *
 * Editor for Long Text step type.
 * Configures multi-line textarea input with variable name, placeholder, max length, and required flag.
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
import { useAutoSave } from "../../hooks";
import { STEP_CONSTANTS } from "../../constants";
import type { StepLongText } from "../../types";

const longTextFormSchema = z.object({
  // Base fields
  title: z.string().max(200).optional().nullable(),
  description: z.string().max(1000).optional().nullable(),
  mediaUrl: z.string().url().optional().nullable().or(z.literal("")),
  ctaLabel: z.string().max(50).optional().nullable(),
  // Config fields
  config: z.object({
    variable: z
      .string()
      .min(1)
      .max(STEP_CONSTANTS.MAX_VARIABLE_NAME_LENGTH)
      .regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/, "Must be a valid variable name"),
    placeholder: z.string().max(200).optional().nullable(),
    maxLength: z.number().min(1).max(STEP_CONSTANTS.MAX_LONG_TEXT_LENGTH),
    required: z.boolean(),
  }),
});

type LongTextFormValues = z.infer<typeof longTextFormSchema>;

/** Fields to compare for changes */
const FIELDS_TO_COMPARE: (keyof LongTextFormValues)[] = [
  "title",
  "description",
  "mediaUrl",
  "ctaLabel",
  "config",
];

interface LongTextEditorProps {
  step: StepLongText;
  companyId: string;
  onUpdate: (updates: Partial<LongTextFormValues>) => Promise<void>;
  onPreviewChange?: (values: LongTextFormValues) => void;
}

export function LongTextEditor({
  step,
  companyId,
  onUpdate,
  onPreviewChange,
}: LongTextEditorProps) {
  // Provide defaults for config in case it's undefined
  const config = step.config ?? {
    variable: "user_input",
    placeholder: "Share your thoughts...",
    maxLength: STEP_CONSTANTS.DEFAULT_LONG_TEXT_MAX_LENGTH,
    required: false,
  };

  const form = useForm<LongTextFormValues>({
    resolver: zodResolver(longTextFormSchema),
    defaultValues: {
      title: step.title ?? "",
      description: step.description ?? "",
      mediaUrl: step.mediaUrl ?? "",
      ctaLabel: step.ctaLabel ?? "",
      config: {
        variable: config.variable,
        placeholder: config.placeholder ?? "",
        maxLength: config.maxLength,
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
      ctaLabel: step.ctaLabel ?? "",
      config: {
        variable: config.variable,
        placeholder: config.placeholder ?? "",
        maxLength: config.maxLength,
        required: config.required,
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step.id, form]);

  // Subscribe to form changes for preview updates
  useEffect(() => {
    if (!onPreviewChange) return;

    const subscription = form.watch((values) => {
      onPreviewChange(values as LongTextFormValues);
    });

    return () => subscription.unsubscribe();
  }, [form, onPreviewChange]);

  return (
    <Form {...form}>
      <form onBlur={handleBlur} className="space-y-6">
        {/* Base Fields */}
        <BaseStepEditor
          form={form}
          companyId={companyId}
          showDescription={true}
          showMediaUrl={true}
          showCtaLabel={true}
          ctaLabelPlaceholder="Continue"
        />

        {/* Divider */}
        <div className="border-t pt-4">
          <h3 className="text-sm font-medium mb-4">Input Settings</h3>
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
                  placeholder="user_input"
                  {...field}
                  className="font-mono text-sm"
                />
              </FormControl>
              <FormDescription>
                Session variable to store the user&apos;s response
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Placeholder */}
        <FormField
          control={form.control}
          name="config.placeholder"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Placeholder Text</FormLabel>
              <FormControl>
                <Input
                  placeholder="Share your thoughts..."
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormDescription>
                Hint text shown when the textarea is empty
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Max Length */}
        <FormField
          control={form.control}
          name="config.maxLength"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Maximum Length</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={1}
                  max={STEP_CONSTANTS.MAX_LONG_TEXT_LENGTH}
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 1)}
                />
              </FormControl>
              <FormDescription>
                Maximum number of characters allowed (1-{STEP_CONSTANTS.MAX_LONG_TEXT_LENGTH})
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Required */}
        <FormField
          control={form.control}
          name="config.required"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Required</FormLabel>
                <FormDescription>
                  User must provide a response to continue
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
