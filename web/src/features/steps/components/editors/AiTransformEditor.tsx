"use client";

/**
 * Component: AiTransformEditor
 *
 * Editor for AI Transform step type.
 * Configures AI model, prompt, variables, output type, and reference images.
 */

import { useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2 } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BaseStepEditor } from "./BaseStepEditor";
import { useAutoSave } from "../../hooks";
import { stepMediaTypeSchema } from "../../schemas";
import type { StepAiTransform } from "../../types";

// Output types available for AI Transform
const OUTPUT_TYPES = [
  { value: "image", label: "Image" },
  { value: "video", label: "Video" },
  { value: "gif", label: "GIF" },
] as const;

// Common aspect ratios
const ASPECT_RATIOS = [
  { value: "1:1", label: "1:1 (Square)" },
  { value: "3:4", label: "3:4 (Portrait)" },
  { value: "4:3", label: "4:3 (Landscape)" },
  { value: "9:16", label: "9:16 (Vertical)" },
  { value: "16:9", label: "16:9 (Widescreen)" },
] as const;

// Variable source types
const SOURCE_TYPES = [
  { value: "capture", label: "Capture (from camera/upload)" },
  { value: "input", label: "Input (from form field)" },
  { value: "static", label: "Static (fixed value)" },
] as const;

// Local variable schema for form
const aiTransformVariableFormSchema = z.object({
  key: z.string().min(1).max(50),
  sourceType: z.enum(["capture", "input", "static"]),
  sourceStepId: z.string().optional(),
  staticValue: z.string().optional(),
});

// Local config schema for form (without refinements that cause issues with react-hook-form)
const aiTransformConfigFormSchema = z.object({
  model: z.string().nullable(),
  prompt: z.string().max(1000).nullable(),
  variables: z.array(aiTransformVariableFormSchema),
  outputType: z.enum(["image", "video", "gif"]),
  aspectRatio: z.string(),
  referenceImageUrls: z.array(z.string().url()).max(5),
});

const aiTransformFormSchema = z.object({
  // Base fields
  title: z.string().max(200).optional().nullable(),
  description: z.string().max(1000).optional().nullable(),
  mediaUrl: z.string().url().optional().nullable().or(z.literal("")),
  mediaType: stepMediaTypeSchema.optional().nullable(),
  ctaLabel: z.string().max(50).optional().nullable(),
  // Config fields
  config: aiTransformConfigFormSchema,
});

type AiTransformFormValues = z.infer<typeof aiTransformFormSchema>;

/** Fields to compare for changes */
const FIELDS_TO_COMPARE: (keyof AiTransformFormValues)[] = [
  "title",
  "description",
  "mediaUrl",
  "mediaType",
  "ctaLabel",
  "config",
];

interface AiTransformEditorProps {
  step: StepAiTransform;
  companyId: string;
  onUpdate: (updates: Partial<AiTransformFormValues>) => Promise<void>;
  onPreviewChange?: (values: AiTransformFormValues) => void;
}

export function AiTransformEditor({
  step,
  companyId,
  onUpdate,
  onPreviewChange,
}: AiTransformEditorProps) {
  // Provide defaults for config in case it's undefined
  const config = step.config ?? {
    model: null,
    prompt: null,
    variables: [],
    outputType: "image" as const,
    aspectRatio: "1:1",
    referenceImageUrls: [],
  };

  const form = useForm<AiTransformFormValues>({
    resolver: zodResolver(aiTransformFormSchema),
    defaultValues: {
      title: step.title ?? "",
      description: step.description ?? "",
      mediaUrl: step.mediaUrl ?? "",
      mediaType: step.mediaType ?? null,
      ctaLabel: step.ctaLabel ?? "",
      config: {
        model: config.model ?? "",
        prompt: config.prompt ?? "",
        variables: config.variables ?? [],
        outputType: config.outputType ?? "image",
        aspectRatio: config.aspectRatio ?? "1:1",
        referenceImageUrls: config.referenceImageUrls ?? [],
      },
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "config.variables",
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
        model: config.model ?? "",
        prompt: config.prompt ?? "",
        variables: config.variables ?? [],
        outputType: config.outputType ?? "image",
        aspectRatio: config.aspectRatio ?? "1:1",
        referenceImageUrls: config.referenceImageUrls ?? [],
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step.id, form]);

  // Subscribe to form changes for preview updates
  useEffect(() => {
    if (!onPreviewChange) return;

    const subscription = form.watch((values) => {
      onPreviewChange(values as AiTransformFormValues);
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
          ctaLabelPlaceholder="Generate"
        />

        {/* Divider - AI Configuration */}
        <div className="border-t pt-4">
          <h3 className="text-sm font-medium mb-4">AI Configuration</h3>
        </div>

        {/* Model */}
        <FormField
          control={form.control}
          name="config.model"
          render={({ field }) => (
            <FormItem>
              <FormLabel>AI Model</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., gemini-2.5-flash-image"
                  {...field}
                  value={field.value ?? ""}
                  className="font-mono text-sm"
                />
              </FormControl>
              <FormDescription>
                The AI model identifier to use for transformation
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Prompt */}
        <FormField
          control={form.control}
          name="config.prompt"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Prompt Template</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Transform this photo into a {{style}} style portrait..."
                  {...field}
                  value={field.value ?? ""}
                  className="min-h-[100px] resize-y"
                  maxLength={1000}
                />
              </FormControl>
              <FormDescription>
                Use {"{{variable}}"} syntax for dynamic values. Max 1000
                characters.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Divider - Output Settings */}
        <div className="border-t pt-4">
          <h3 className="text-sm font-medium mb-4">Output Settings</h3>
        </div>

        {/* Output Type */}
        <FormField
          control={form.control}
          name="config.outputType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Output Type</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select output type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {OUTPUT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                The format of the generated result
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Aspect Ratio */}
        <FormField
          control={form.control}
          name="config.aspectRatio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Aspect Ratio</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select aspect ratio" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {ASPECT_RATIOS.map((ratio) => (
                    <SelectItem key={ratio.value} value={ratio.value}>
                      {ratio.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                The aspect ratio of the generated result
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Divider - Variables */}
        <div className="border-t pt-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium">Prompt Variables</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                append({
                  key: "",
                  sourceType: "static",
                  staticValue: "",
                })
              }
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Variable
            </Button>
          </div>
        </div>

        {fields.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4 border border-dashed rounded-lg">
            No variables defined. Add variables to use dynamic values in your
            prompt.
          </p>
        )}

        {fields.map((field, index) => (
          <div
            key={field.id}
            className="space-y-3 p-4 border rounded-lg relative"
          >
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 h-8 w-8"
              onClick={() => remove(index)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>

            {/* Variable Key */}
            <FormField
              control={form.control}
              name={`config.variables.${index}.key`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Variable Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., style"
                      {...field}
                      className="font-mono text-sm"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Source Type */}
            <FormField
              control={form.control}
              name={`config.variables.${index}.sourceType`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Source Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select source" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {SOURCE_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Conditional: Source Step ID */}
            {(form.watch(`config.variables.${index}.sourceType`) ===
              "capture" ||
              form.watch(`config.variables.${index}.sourceType`) ===
                "input") && (
              <FormField
                control={form.control}
                name={`config.variables.${index}.sourceStepId`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Source Step ID</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Step ID"
                        {...field}
                        value={field.value ?? ""}
                        className="font-mono text-sm"
                      />
                    </FormControl>
                    <FormDescription>
                      The ID of the step that provides this value
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Conditional: Static Value */}
            {form.watch(`config.variables.${index}.sourceType`) ===
              "static" && (
              <FormField
                control={form.control}
                name={`config.variables.${index}.staticValue`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Static Value</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter value"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormDescription>
                      A fixed value to use in the prompt
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>
        ))}

        {/* Note about reference images - to be implemented later */}
        <div className="border-t pt-4">
          <h3 className="text-sm font-medium mb-2">Reference Images</h3>
          <p className="text-sm text-muted-foreground">
            Reference image upload will be available in a future update.
          </p>
        </div>
      </form>
    </Form>
  );
}
