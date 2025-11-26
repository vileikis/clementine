"use client";

/**
 * Component: ExperiencePickerEditor
 *
 * Editor for Experience Picker step type.
 * Allows configuring:
 * - Layout (grid, list, carousel)
 * - Variable name for storing selection
 * - Experience options (id, label, imageUrl)
 *
 * Base fields (title, description, mediaUrl, ctaLabel) are handled by BaseStepEditor.
 */

import { useEffect, useCallback, useRef } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BaseStepEditor } from "./BaseStepEditor";
import { STEP_CONSTANTS } from "../../constants";
import type { StepExperiencePicker } from "../../types";

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
    options: z
      .array(
        z.object({
          id: z.string(),
          experienceId: z.string(),
          label: z.string().min(1).max(100),
          imageUrl: z.string().url().optional().nullable().or(z.literal("")),
        })
      )
      .max(STEP_CONSTANTS.MAX_EXPERIENCE_OPTIONS),
  }),
});

type ExperiencePickerFormValues = z.infer<typeof experiencePickerFormSchema>;

interface ExperiencePickerEditorProps {
  step: StepExperiencePicker;
  onUpdate: (updates: Partial<ExperiencePickerFormValues>) => Promise<void>;
  onPreviewChange?: (values: ExperiencePickerFormValues) => void;
}

export function ExperiencePickerEditor({
  step,
  onUpdate,
  onPreviewChange,
}: ExperiencePickerEditorProps) {
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const form = useForm<ExperiencePickerFormValues>({
    resolver: zodResolver(experiencePickerFormSchema),
    defaultValues: {
      title: step.title ?? "",
      description: step.description ?? "",
      mediaUrl: step.mediaUrl ?? "",
      ctaLabel: step.ctaLabel ?? "",
      config: {
        layout: step.config.layout,
        variable: step.config.variable,
        options: step.config.options.map((opt) => ({
          id: opt.id,
          experienceId: opt.experienceId,
          label: opt.label,
          imageUrl: opt.imageUrl ?? "",
        })),
      },
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "config.options",
  });

  // Reset form when step ID changes
  useEffect(() => {
    form.reset({
      title: step.title ?? "",
      description: step.description ?? "",
      mediaUrl: step.mediaUrl ?? "",
      ctaLabel: step.ctaLabel ?? "",
      config: {
        layout: step.config.layout,
        variable: step.config.variable,
        options: step.config.options.map((opt) => ({
          id: opt.id,
          experienceId: opt.experienceId,
          label: opt.label,
          imageUrl: opt.imageUrl ?? "",
        })),
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
        // Build updates object
        const updates: Partial<ExperiencePickerFormValues> = {};

        if (values.title !== step.title) updates.title = values.title || null;
        if (values.description !== step.description)
          updates.description = values.description || null;
        if (values.mediaUrl !== step.mediaUrl)
          updates.mediaUrl = values.mediaUrl || null;
        if (values.ctaLabel !== step.ctaLabel)
          updates.ctaLabel = values.ctaLabel || null;

        // Check config changes
        const configChanged =
          values.config.layout !== step.config.layout ||
          values.config.variable !== step.config.variable ||
          JSON.stringify(values.config.options) !==
            JSON.stringify(step.config.options);

        if (configChanged) {
          updates.config = {
            layout: values.config.layout,
            variable: values.config.variable,
            options: values.config.options.map((opt) => ({
              id: opt.id,
              experienceId: opt.experienceId,
              label: opt.label,
              imageUrl: opt.imageUrl || null,
            })),
          };
        }

        if (Object.keys(updates).length > 0) {
          await onUpdate(updates);
        }
      }
    }, 300);
  }, [form, step, onUpdate]);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const handleAddOption = () => {
    const newId = `opt_${Date.now()}`;
    append({
      id: newId,
      experienceId: "",
      label: `Option ${fields.length + 1}`,
      imageUrl: "",
    });
  };

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

        {/* Options */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <FormLabel>Options</FormLabel>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddOption}
              disabled={fields.length >= STEP_CONSTANTS.MAX_EXPERIENCE_OPTIONS}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Option
            </Button>
          </div>

          {fields.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No options added yet. Add options for guests to choose from.
            </p>
          )}

          <div className="space-y-3">
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="flex items-start gap-2 p-3 border rounded-lg bg-muted/30"
              >
                <GripVertical className="h-5 w-5 text-muted-foreground mt-2 shrink-0" />
                <div className="flex-1 space-y-2">
                  <FormField
                    control={form.control}
                    name={`config.options.${index}.label`}
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input placeholder="Option label" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`config.options.${index}.experienceId`}
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            placeholder="Experience ID"
                            {...field}
                            className="font-mono text-xs"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`config.options.${index}.imageUrl`}
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            placeholder="Image URL (optional)"
                            type="url"
                            {...field}
                            value={field.value ?? ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => remove(index)}
                  className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </form>
    </Form>
  );
}
