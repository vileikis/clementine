"use client";

/**
 * Component: BaseStepEditor
 *
 * Provides common step fields (title, description, mediaUrl, ctaLabel).
 * Used as a composition helper by type-specific editors.
 */

import { type UseFormReturn } from "react-hook-form";
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
import { STEP_CONSTANTS } from "../../constants";

interface BaseStepEditorProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: UseFormReturn<any>;
  showDescription?: boolean;
  showMediaUrl?: boolean;
  showCtaLabel?: boolean;
  ctaLabelPlaceholder?: string;
}

export function BaseStepEditor({
  form,
  showDescription = true,
  showMediaUrl = true,
  showCtaLabel = true,
  ctaLabelPlaceholder = "Continue",
}: BaseStepEditorProps) {
  return (
    <div className="space-y-4">
      {/* Title */}
      <FormField
        control={form.control}
        name="title"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Title</FormLabel>
            <FormControl>
              <Input
                placeholder="Enter step title..."
                maxLength={STEP_CONSTANTS.MAX_TITLE_LENGTH}
                {...field}
                value={field.value ?? ""}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Description */}
      {showDescription && (
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Add a description (optional)..."
                  maxLength={STEP_CONSTANTS.MAX_DESCRIPTION_LENGTH}
                  rows={3}
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormDescription>
                Subtitle or helper text shown below the title
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {/* Media URL */}
      {showMediaUrl && (
        <FormField
          control={form.control}
          name="mediaUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Media URL</FormLabel>
              <FormControl>
                <Input
                  placeholder="https://example.com/image.jpg"
                  type="url"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormDescription>
                Hero image or video URL (optional)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {/* CTA Label */}
      {showCtaLabel && (
        <FormField
          control={form.control}
          name="ctaLabel"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Button Text</FormLabel>
              <FormControl>
                <Input
                  placeholder={ctaLabelPlaceholder}
                  maxLength={STEP_CONSTANTS.MAX_CTA_LABEL_LENGTH}
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormDescription>
                Text displayed on the action button
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
    </div>
  );
}
