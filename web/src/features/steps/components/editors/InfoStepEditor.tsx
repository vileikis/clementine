"use client";

/**
 * Component: InfoStepEditor
 *
 * Editor for Info step type (welcome/message screens).
 * Uses only base fields (title, description, mediaUrl, ctaLabel).
 */

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form } from "@/components/ui/form";
import { BaseStepEditor } from "./BaseStepEditor";
import { useAutoSave } from "../../hooks";
import type { StepInfo } from "../../types";

import { stepMediaTypeSchema } from "../../schemas";

const infoStepFormSchema = z.object({
  title: z.string().max(200).optional().nullable(),
  description: z.string().max(1000).optional().nullable(),
  mediaUrl: z.string().url().optional().nullable().or(z.literal("")),
  mediaType: stepMediaTypeSchema.optional().nullable(),
  ctaLabel: z.string().max(50).optional().nullable(),
});

type InfoStepFormValues = z.infer<typeof infoStepFormSchema>;

/** Fields to compare for changes */
const FIELDS_TO_COMPARE: (keyof InfoStepFormValues)[] = [
  "title",
  "description",
  "mediaUrl",
  "mediaType",
  "ctaLabel",
];

interface InfoStepEditorProps {
  step: StepInfo;
  companyId: string;
  onUpdate: (updates: Partial<InfoStepFormValues>) => Promise<void>;
  onPreviewChange?: (values: InfoStepFormValues) => void;
}

export function InfoStepEditor({
  step,
  companyId,
  onUpdate,
  onPreviewChange,
}: InfoStepEditorProps) {
  const form = useForm<InfoStepFormValues>({
    resolver: zodResolver(infoStepFormSchema),
    defaultValues: {
      title: step.title ?? "",
      description: step.description ?? "",
      mediaUrl: step.mediaUrl ?? "",
      mediaType: step.mediaType ?? null,
      ctaLabel: step.ctaLabel ?? "",
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
    });
    // Only reset when step.id changes, not on every step field change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step.id, form]);

  // Subscribe to form changes for preview updates
  useEffect(() => {
    if (!onPreviewChange) return;

    const subscription = form.watch((values) => {
      onPreviewChange(values as InfoStepFormValues);
    });

    return () => subscription.unsubscribe();
  }, [form, onPreviewChange]);

  return (
    <Form {...form}>
      <form onBlur={handleBlur} className="space-y-4">
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
      </form>
    </Form>
  );
}
