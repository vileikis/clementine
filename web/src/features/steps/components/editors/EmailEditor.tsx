"use client";

/**
 * Component: EmailEditor
 *
 * Editor for Email step type.
 * Configures email input with variable name, placeholder, and required flag.
 */

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
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
import type { StepEmail } from "../../types";

const emailFormSchema = z.object({
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
    placeholder: z.string().max(100).optional().nullable(),
    required: z.boolean(),
  }),
});

type EmailFormValues = z.infer<typeof emailFormSchema>;

/** Fields to compare for changes */
const FIELDS_TO_COMPARE: (keyof EmailFormValues)[] = [
  "title",
  "description",
  "mediaUrl",
  "mediaType",
  "ctaLabel",
  "config",
];

interface EmailEditorProps {
  step: StepEmail;
  companyId: string;
  onUpdate: (updates: Partial<EmailFormValues>) => Promise<void>;
  onPreviewChange?: (values: EmailFormValues) => void;
}

export function EmailEditor({
  step,
  companyId,
  onUpdate,
  onPreviewChange,
}: EmailEditorProps) {
  // Provide defaults for config in case it's undefined
  const config = step.config ?? {
    variable: "user_email",
    placeholder: "email@example.com",
    required: false,
  };

  const form = useForm<EmailFormValues>({
    resolver: standardSchemaResolver(emailFormSchema),
    defaultValues: {
      title: step.title ?? "",
      description: step.description ?? "",
      mediaUrl: step.mediaUrl ?? "",
      mediaType: step.mediaType ?? null,
      ctaLabel: step.ctaLabel ?? "",
      config: {
        variable: config.variable,
        placeholder: config.placeholder ?? "",
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
        placeholder: config.placeholder ?? "",
        required: config.required,
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step.id, form]);

  // Subscribe to form changes for preview updates
  useEffect(() => {
    if (!onPreviewChange) return;

    const subscription = form.watch((values) => {
      onPreviewChange(values as EmailFormValues);
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
          showCtaLabel={true}
          ctaLabelPlaceholder="Continue"
        />

        {/* Divider */}
        <div className="border-t pt-4">
          <h3 className="text-sm font-medium mb-4">Email Settings</h3>
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
                  placeholder="user_email"
                  {...field}
                  className="font-mono text-sm"
                />
              </FormControl>
              <FormDescription>
                Session variable to store the email address
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
                  placeholder="email@example.com"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormDescription>
                Example text shown when the input is empty
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
                  User must provide an email to continue
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
