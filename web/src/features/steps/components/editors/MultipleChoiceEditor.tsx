"use client";

/**
 * Component: MultipleChoiceEditor
 *
 * Editor for Multiple Choice step type.
 * Configures options list, variable name, allow multiple selection, and required flag.
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
import { Switch } from "@/components/ui/switch";
import { BaseStepEditor } from "./BaseStepEditor";
import { useAutoSave } from "../../hooks";
import { STEP_CONSTANTS } from "../../constants";
import type { StepMultipleChoice } from "../../types";

const multipleChoiceFormSchema = z.object({
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
    options: z
      .array(
        z.object({
          label: z.string().min(1).max(STEP_CONSTANTS.MAX_OPTION_LABEL_LENGTH),
          value: z
            .string()
            .min(1)
            .max(STEP_CONSTANTS.MAX_OPTION_VALUE_LENGTH)
            .regex(/^[a-zA-Z0-9_]+$/, "Must be alphanumeric with underscores"),
        })
      )
      .min(STEP_CONSTANTS.MIN_OPTIONS)
      .max(STEP_CONSTANTS.MAX_OPTIONS),
    allowMultiple: z.boolean(),
    required: z.boolean(),
  }),
});

type MultipleChoiceFormValues = z.infer<typeof multipleChoiceFormSchema>;

/** Fields to compare for changes */
const FIELDS_TO_COMPARE: (keyof MultipleChoiceFormValues)[] = [
  "title",
  "description",
  "mediaUrl",
  "ctaLabel",
  "config",
];

interface MultipleChoiceEditorProps {
  step: StepMultipleChoice;
  onUpdate: (updates: Partial<MultipleChoiceFormValues>) => Promise<void>;
  onPreviewChange?: (values: MultipleChoiceFormValues) => void;
}

export function MultipleChoiceEditor({
  step,
  onUpdate,
  onPreviewChange,
}: MultipleChoiceEditorProps) {
  // Provide defaults for config in case it's undefined
  const config = step.config ?? {
    variable: "user_choice",
    options: [
      { label: "Option 1", value: "option_1" },
      { label: "Option 2", value: "option_2" },
    ],
    allowMultiple: false,
    required: false,
  };

  const form = useForm<MultipleChoiceFormValues>({
    resolver: zodResolver(multipleChoiceFormSchema),
    defaultValues: {
      title: step.title ?? "",
      description: step.description ?? "",
      mediaUrl: step.mediaUrl ?? "",
      ctaLabel: step.ctaLabel ?? "",
      config: {
        variable: config.variable,
        options: config.options,
        allowMultiple: config.allowMultiple,
        required: config.required,
      },
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "config.options",
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
        options: config.options,
        allowMultiple: config.allowMultiple,
        required: config.required,
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step.id, form]);

  // Subscribe to form changes for preview updates
  useEffect(() => {
    if (!onPreviewChange) return;

    const subscription = form.watch((values) => {
      onPreviewChange(values as MultipleChoiceFormValues);
    });

    return () => subscription.unsubscribe();
  }, [form, onPreviewChange]);

  // Add new option
  const handleAddOption = useCallback(() => {
    if (fields.length >= STEP_CONSTANTS.MAX_OPTIONS) return;
    const nextIndex = fields.length + 1;
    append({ label: `Option ${nextIndex}`, value: `option_${nextIndex}` });
  }, [fields.length, append]);

  // Remove option (save immediately after)
  const handleRemoveOption = useCallback(
    async (index: number) => {
      if (fields.length <= STEP_CONSTANTS.MIN_OPTIONS) return;
      remove(index);
      // Save after removal
      const values = form.getValues();
      const newOptions = values.config.options.filter((_, i) => i !== index);
      await onUpdate({
        config: {
          ...values.config,
          options: newOptions,
        },
      });
    },
    [fields.length, remove, form, onUpdate]
  );

  // Auto-generate value from label
  const handleLabelChange = useCallback(
    (index: number, label: string) => {
      const value = label
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "")
        .slice(0, STEP_CONSTANTS.MAX_OPTION_VALUE_LENGTH);
      form.setValue(`config.options.${index}.value`, value || `option_${index + 1}`);
    },
    [form]
  );

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
          <h3 className="text-sm font-medium mb-4">Choice Settings</h3>
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
                  placeholder="user_choice"
                  {...field}
                  className="font-mono text-sm"
                />
              </FormControl>
              <FormDescription>
                Session variable to store the selected value(s)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Options */}
        <div className="space-y-3">
          <FormLabel>Options</FormLabel>
          <div className="space-y-2">
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="flex items-center gap-2 p-2 border rounded-lg bg-muted/30"
              >
                <GripVertical className="h-4 w-4 text-muted-foreground shrink-0 cursor-grab" />
                <FormField
                  control={form.control}
                  name={`config.options.${index}.label`}
                  render={({ field: labelField }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <Input
                          placeholder="Option label"
                          {...labelField}
                          onChange={(e) => {
                            labelField.onChange(e);
                            handleLabelChange(index, e.target.value);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`config.options.${index}.value`}
                  render={({ field: valueField }) => (
                    <FormItem className="w-32">
                      <FormControl>
                        <Input
                          placeholder="value"
                          {...valueField}
                          className="font-mono text-xs"
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
                  disabled={fields.length <= STEP_CONSTANTS.MIN_OPTIONS}
                  onClick={() => handleRemoveOption(index)}
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Remove option</span>
                </Button>
              </div>
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddOption}
            disabled={fields.length >= STEP_CONSTANTS.MAX_OPTIONS}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Option
          </Button>
          <p className="text-xs text-muted-foreground">
            {fields.length} of {STEP_CONSTANTS.MAX_OPTIONS} options
          </p>
        </div>

        {/* Allow Multiple */}
        <FormField
          control={form.control}
          name="config.allowMultiple"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Allow Multiple</FormLabel>
                <FormDescription>
                  User can select more than one option
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
