"use client";

/**
 * Component: YesNoEditor
 *
 * Editor for Yes/No step type.
 * Configures binary choice with customizable yes/no labels.
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
import { stepMediaTypeSchema } from "../../schemas";
import type { StepYesNo } from "../../types";

const yesNoFormSchema = z.object({
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
    yesLabel: z.string().min(1).max(50),
    noLabel: z.string().min(1).max(50),
    required: z.boolean(),
  }),
});

type YesNoFormValues = z.infer<typeof yesNoFormSchema>;

/** Fields to compare for changes */
const FIELDS_TO_COMPARE: (keyof YesNoFormValues)[] = [
  "title",
  "description",
  "mediaUrl",
  "mediaType",
  "ctaLabel",
  "config",
];

interface YesNoEditorProps {
  step: StepYesNo;
  companyId: string;
  onUpdate: (updates: Partial<YesNoFormValues>) => Promise<void>;
  onPreviewChange?: (values: YesNoFormValues) => void;
}

export function YesNoEditor({
  step,
  companyId,
  onUpdate,
  onPreviewChange,
}: YesNoEditorProps) {
  // Provide defaults for config in case it's undefined
  const config = step.config ?? {
    variable: "user_answer",
    yesLabel: "Yes",
    noLabel: "No",
    required: false,
  };

  const form = useForm<YesNoFormValues>({
    resolver: zodResolver(yesNoFormSchema),
    defaultValues: {
      title: step.title ?? "",
      description: step.description ?? "",
      mediaUrl: step.mediaUrl ?? "",
      mediaType: step.mediaType ?? null,
      ctaLabel: step.ctaLabel ?? "",
      config: {
        variable: config.variable,
        yesLabel: config.yesLabel,
        noLabel: config.noLabel,
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
        yesLabel: config.yesLabel,
        noLabel: config.noLabel,
        required: config.required,
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step.id, form]);

  // Subscribe to form changes for preview updates
  useEffect(() => {
    if (!onPreviewChange) return;

    const subscription = form.watch((values) => {
      onPreviewChange(values as YesNoFormValues);
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
          onMediaChange={async (mediaUrl, mediaType) => {
            await onUpdate({ mediaUrl, mediaType });
          }}
          showDescription={true}
          showMediaUrl={true}
          showCtaLabel={false}
        />

        {/* Divider */}
        <div className="border-t pt-4">
          <h3 className="text-sm font-medium mb-4">Button Labels</h3>
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
                  placeholder="user_answer"
                  {...field}
                  className="font-mono text-sm"
                />
              </FormControl>
              <FormDescription>
                Session variable to store the answer (&quot;yes&quot; or &quot;no&quot;)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Yes Label */}
        <FormField
          control={form.control}
          name="config.yesLabel"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Yes Button Text</FormLabel>
              <FormControl>
                <Input placeholder="Yes" {...field} />
              </FormControl>
              <FormDescription>
                Text for the affirmative option
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* No Label */}
        <FormField
          control={form.control}
          name="config.noLabel"
          render={({ field }) => (
            <FormItem>
              <FormLabel>No Button Text</FormLabel>
              <FormControl>
                <Input placeholder="No" {...field} />
              </FormControl>
              <FormDescription>
                Text for the negative option
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
                  User must make a selection to continue
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
