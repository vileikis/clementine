"use client";

/**
 * Component: ProcessingStepEditor
 *
 * Editor for Processing step type (loading/generation screen).
 * Configures rotating messages and estimated duration.
 */

import { useEffect, useCallback } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2, GripVertical } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { BaseStepEditor } from "./BaseStepEditor";
import { useAutoSave } from "../../hooks";
import { STEP_CONSTANTS } from "../../constants";
import { stepMediaTypeSchema } from "../../schemas";
import type { StepProcessing } from "../../types";

const processingStepFormSchema = z.object({
  // Base fields
  title: z.string().max(200).optional().nullable(),
  description: z.string().max(1000).optional().nullable(),
  mediaUrl: z.string().url().optional().nullable().or(z.literal("")),
  mediaType: stepMediaTypeSchema.optional().nullable(),
  ctaLabel: z.string().max(50).optional().nullable(),
  // Config fields
  config: z.object({
    messages: z
      .array(z.string().min(1).max(STEP_CONSTANTS.MAX_PROCESSING_MESSAGE_LENGTH))
      .min(STEP_CONSTANTS.MIN_PROCESSING_MESSAGES)
      .max(STEP_CONSTANTS.MAX_PROCESSING_MESSAGES),
    estimatedDuration: z
      .number()
      .min(STEP_CONSTANTS.MIN_ESTIMATED_DURATION)
      .max(STEP_CONSTANTS.MAX_ESTIMATED_DURATION),
  }),
});

type ProcessingStepFormValues = z.infer<typeof processingStepFormSchema>;

/** Fields to compare for changes */
const FIELDS_TO_COMPARE: (keyof ProcessingStepFormValues)[] = [
  "title",
  "description",
  "mediaUrl",
  "mediaType",
  "ctaLabel",
  "config",
];

interface ProcessingStepEditorProps {
  step: StepProcessing;
  companyId: string;
  onUpdate: (updates: Partial<ProcessingStepFormValues>) => Promise<void>;
  onPreviewChange?: (values: ProcessingStepFormValues) => void;
}

export function ProcessingStepEditor({
  step,
  companyId,
  onUpdate,
  onPreviewChange,
}: ProcessingStepEditorProps) {
  // Provide defaults for config in case it's undefined
  const config = step.config ?? {
    messages: [
      "Creating your image...",
      "Almost there...",
      "Finishing touches...",
    ],
    estimatedDuration: 30,
  };

  const form = useForm<ProcessingStepFormValues>({
    resolver: zodResolver(processingStepFormSchema),
    defaultValues: {
      title: step.title ?? "",
      description: step.description ?? "",
      mediaUrl: step.mediaUrl ?? "",
      mediaType: step.mediaType ?? null,
      ctaLabel: step.ctaLabel ?? "",
      config: {
        messages: config.messages,
        estimatedDuration: config.estimatedDuration,
      },
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "config.messages" as never,
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
        messages: config.messages,
        estimatedDuration: config.estimatedDuration,
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step.id, form]);

  // Subscribe to form changes for preview updates
  useEffect(() => {
    if (!onPreviewChange) return;

    const subscription = form.watch((values) => {
      onPreviewChange(values as ProcessingStepFormValues);
    });

    return () => subscription.unsubscribe();
  }, [form, onPreviewChange]);

  // Add new message
  const handleAddMessage = useCallback(() => {
    if (fields.length >= STEP_CONSTANTS.MAX_PROCESSING_MESSAGES) return;
    append("Processing..." as never);
  }, [fields.length, append]);

  // Remove message (save immediately after)
  const handleRemoveMessage = useCallback(
    async (index: number) => {
      if (fields.length <= STEP_CONSTANTS.MIN_PROCESSING_MESSAGES) return;
      remove(index);
      // Save after removal
      const values = form.getValues();
      const newMessages = values.config.messages.filter((_, i) => i !== index);
      await onUpdate({
        config: {
          ...values.config,
          messages: newMessages,
        },
      });
    },
    [fields.length, remove, form, onUpdate]
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
          showCtaLabel={false}
          ctaLabelPlaceholder=""
        />

        {/* Divider */}
        <div className="border-t pt-4">
          <h3 className="text-sm font-medium mb-4">Processing Settings</h3>
        </div>

        {/* Messages */}
        <div className="space-y-3">
          <FormLabel>Loading Messages</FormLabel>
          <FormDescription className="text-xs">
            Messages shown to users while processing. They rotate automatically.
          </FormDescription>
          <div className="space-y-2">
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="flex items-center gap-2 p-2 border rounded-lg bg-muted/30"
              >
                <GripVertical className="h-4 w-4 text-muted-foreground shrink-0 cursor-grab" />
                <FormField
                  control={form.control}
                  name={`config.messages.${index}`}
                  render={({ field: messageField }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <Input
                          placeholder="Enter loading message..."
                          maxLength={STEP_CONSTANTS.MAX_PROCESSING_MESSAGE_LENGTH}
                          {...messageField}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  disabled={fields.length <= STEP_CONSTANTS.MIN_PROCESSING_MESSAGES}
                  onClick={() => handleRemoveMessage(index)}
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Remove message</span>
                </Button>
              </div>
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddMessage}
            disabled={fields.length >= STEP_CONSTANTS.MAX_PROCESSING_MESSAGES}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Message
          </Button>
          <p className="text-xs text-muted-foreground">
            {fields.length} of {STEP_CONSTANTS.MAX_PROCESSING_MESSAGES} messages
          </p>
        </div>

        {/* Estimated Duration */}
        <FormField
          control={form.control}
          name="config.estimatedDuration"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Estimated Duration</FormLabel>
              <FormControl>
                <div className="space-y-3">
                  <Slider
                    min={STEP_CONSTANTS.MIN_ESTIMATED_DURATION}
                    max={STEP_CONSTANTS.MAX_ESTIMATED_DURATION}
                    step={5}
                    value={[field.value]}
                    onValueChange={(value) => field.onChange(value[0])}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{STEP_CONSTANTS.MIN_ESTIMATED_DURATION}s</span>
                    <span className="font-medium text-foreground">
                      {field.value} seconds
                    </span>
                    <span>{STEP_CONSTANTS.MAX_ESTIMATED_DURATION}s</span>
                  </div>
                </div>
              </FormControl>
              <FormDescription>
                Approximate time for AI processing (used for progress indication)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}
