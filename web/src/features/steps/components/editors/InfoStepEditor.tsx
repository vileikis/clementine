"use client";

/**
 * Component: InfoStepEditor
 *
 * Editor for Info step type (welcome/message screens).
 * Uses only base fields (title, description, mediaUrl, ctaLabel).
 */

import { useEffect, useCallback, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form } from "@/components/ui/form";
import { BaseStepEditor } from "./BaseStepEditor";
import type { StepInfo } from "../../types";

const infoStepFormSchema = z.object({
  title: z.string().max(200).optional().nullable(),
  description: z.string().max(1000).optional().nullable(),
  mediaUrl: z.string().url().optional().nullable().or(z.literal("")),
  ctaLabel: z.string().max(50).optional().nullable(),
});

type InfoStepFormValues = z.infer<typeof infoStepFormSchema>;

interface InfoStepEditorProps {
  step: StepInfo;
  onUpdate: (updates: Partial<InfoStepFormValues>) => Promise<void>;
  onPreviewChange?: (values: InfoStepFormValues) => void;
}

export function InfoStepEditor({
  step,
  onUpdate,
  onPreviewChange,
}: InfoStepEditorProps) {
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const form = useForm<InfoStepFormValues>({
    resolver: zodResolver(infoStepFormSchema),
    defaultValues: {
      title: step.title ?? "",
      description: step.description ?? "",
      mediaUrl: step.mediaUrl ?? "",
      ctaLabel: step.ctaLabel ?? "",
    },
  });

  // Reset form when step ID changes
  useEffect(() => {
    form.reset({
      title: step.title ?? "",
      description: step.description ?? "",
      mediaUrl: step.mediaUrl ?? "",
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

  // Debounced auto-save on blur
  const handleBlur = useCallback(async () => {
    // Clear any pending debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Debounce the save
    debounceRef.current = setTimeout(async () => {
      const isValid = await form.trigger();
      if (isValid) {
        const values = form.getValues();
        // Only send changed fields
        const updates: Partial<InfoStepFormValues> = {};
        if (values.title !== step.title) updates.title = values.title || null;
        if (values.description !== step.description)
          updates.description = values.description || null;
        if (values.mediaUrl !== step.mediaUrl)
          updates.mediaUrl = values.mediaUrl || null;
        if (values.ctaLabel !== step.ctaLabel)
          updates.ctaLabel = values.ctaLabel || null;

        if (Object.keys(updates).length > 0) {
          await onUpdate(updates);
        }
      }
    }, 300);
  }, [form, step.title, step.description, step.mediaUrl, step.ctaLabel, onUpdate]);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return (
    <Form {...form}>
      <form onBlur={handleBlur} className="space-y-4">
        <BaseStepEditor
          form={form}
          showDescription={true}
          showMediaUrl={true}
          showCtaLabel={true}
          ctaLabelPlaceholder="Continue"
        />
      </form>
    </Form>
  );
}
