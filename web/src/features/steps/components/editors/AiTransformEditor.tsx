"use client";

/**
 * Component: AiTransformEditor
 *
 * Editor for AI Transform step type.
 * Configures AI model, prompt, output type, aspect ratio, and reference images.
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAutoSave } from "../../hooks";
import type { StepAiTransform } from "../../types";

// Available AI models
const AI_MODELS = [
  { value: "gemini-2.5-flash-image", label: "Gemini 2.5 Flash Image" },
  { value: "gemini-3-pro-image-preview", label: "Gemini 3 Pro Image Preview" },
] as const;

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

// Local config schema for form
const aiTransformConfigFormSchema = z.object({
  model: z.string().nullable(),
  prompt: z.string().max(1000).nullable(),
  outputType: z.enum(["image", "video", "gif"]),
  aspectRatio: z.string(),
  referenceImageUrls: z.array(z.string()).max(5),
});

const aiTransformFormSchema = z.object({
  config: aiTransformConfigFormSchema,
});

type AiTransformFormValues = z.infer<typeof aiTransformFormSchema>;

/** Fields to compare for changes */
const FIELDS_TO_COMPARE: (keyof AiTransformFormValues)[] = ["config"];

interface AiTransformEditorProps {
  step: StepAiTransform;
  onUpdate: (updates: Partial<AiTransformFormValues>) => Promise<void>;
  onPreviewChange?: (values: AiTransformFormValues) => void;
}

export function AiTransformEditor({
  step,
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
      config: {
        model: config.model ?? "",
        prompt: config.prompt ?? "",
        outputType: config.outputType ?? "image",
        aspectRatio: config.aspectRatio ?? "1:1",
        referenceImageUrls: config.referenceImageUrls ?? [],
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
      config: {
        model: config.model ?? "",
        prompt: config.prompt ?? "",
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
        {/* AI Configuration Header */}
        <div>
          <h3 className="text-sm font-medium mb-4">AI Configuration</h3>
        </div>

        {/* Model Selection */}
        <FormField
          control={form.control}
          name="config.model"
          render={({ field }) => (
            <FormItem>
              <FormLabel>AI Model</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value ?? undefined}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select AI model" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {AI_MODELS.map((model) => (
                    <SelectItem key={model.value} value={model.value}>
                      {model.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                The AI model to use for image transformation
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
                  placeholder="Transform this photo into..."
                  {...field}
                  value={field.value ?? ""}
                  className="min-h-[100px] resize-y"
                  maxLength={1000}
                />
              </FormControl>
              <FormDescription>
                Describe the transformation. Max 1000 characters.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Reference Images placeholder */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Reference Images</h4>
          <p className="text-sm text-muted-foreground">
            Reference image upload will be available in a future update.
          </p>
        </div>

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
      </form>
    </Form>
  );
}
