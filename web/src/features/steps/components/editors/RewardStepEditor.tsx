"use client";

/**
 * Component: RewardStepEditor
 *
 * Editor for Reward step type (final result display with sharing options).
 * Configures download, sharing, and social media options.
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
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { BaseStepEditor } from "./BaseStepEditor";
import { useAutoSave } from "@/hooks";
import { STEP_CONSTANTS } from "../../constants";
import { stepMediaTypeSchema } from "../../schemas";
import type { StepReward, ShareSocial } from "../../types";

const rewardStepFormSchema = z.object({
  // Base fields
  title: z.string().max(200).optional().nullable(),
  description: z.string().max(1000).optional().nullable(),
  mediaUrl: z.string().url().optional().nullable().or(z.literal("")),
  mediaType: stepMediaTypeSchema.optional().nullable(),
  ctaLabel: z.string().max(50).optional().nullable(),
  // Config fields
  config: z.object({
    allowDownload: z.boolean(),
    allowSystemShare: z.boolean(),
    allowEmail: z.boolean(),
    socials: z.array(z.enum(STEP_CONSTANTS.AVAILABLE_SOCIALS)),
  }),
});

type RewardStepFormValues = z.infer<typeof rewardStepFormSchema>;

/** Fields to compare for changes */
const FIELDS_TO_COMPARE: (keyof RewardStepFormValues)[] = [
  "title",
  "description",
  "mediaUrl",
  "mediaType",
  "ctaLabel",
  "config",
];

/** Social media options with labels and icons */
const SOCIAL_OPTIONS: { value: ShareSocial; label: string }[] = [
  { value: "instagram", label: "Instagram" },
  { value: "facebook", label: "Facebook" },
  { value: "twitter", label: "X (Twitter)" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "tiktok", label: "TikTok" },
  { value: "whatsapp", label: "WhatsApp" },
];

interface RewardStepEditorProps {
  step: StepReward;
  companyId: string;
  onUpdate: (updates: Partial<RewardStepFormValues>) => Promise<void>;
  onPreviewChange?: (values: RewardStepFormValues) => void;
}

export function RewardStepEditor({
  step,
  companyId,
  onUpdate,
  onPreviewChange,
}: RewardStepEditorProps) {
  // Provide defaults for config in case it's undefined
  const config = step.config ?? {
    allowDownload: true,
    allowSystemShare: true,
    allowEmail: false,
    socials: [],
  };

  const form = useForm<RewardStepFormValues>({
    resolver: standardSchemaResolver(rewardStepFormSchema),
    defaultValues: {
      title: step.title ?? "",
      description: step.description ?? "",
      mediaUrl: step.mediaUrl ?? "",
      mediaType: step.mediaType ?? null,
      ctaLabel: step.ctaLabel ?? "",
      config: {
        allowDownload: config.allowDownload,
        allowSystemShare: config.allowSystemShare,
        allowEmail: config.allowEmail,
        socials: config.socials,
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
        allowDownload: config.allowDownload,
        allowSystemShare: config.allowSystemShare,
        allowEmail: config.allowEmail,
        socials: config.socials,
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step.id, form]);

  // Subscribe to form changes for preview updates
  useEffect(() => {
    if (!onPreviewChange) return;

    const subscription = form.watch((values) => {
      onPreviewChange(values as RewardStepFormValues);
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
          showDescription={true}
          showMediaUrl={false}
          showCtaLabel={true}
          ctaLabelPlaceholder="Start Over"
        />

        {/* Divider */}
        <div className="border-t pt-4">
          <h3 className="text-sm font-medium mb-4">Sharing Options</h3>
        </div>

        {/* Allow Download */}
        <FormField
          control={form.control}
          name="config.allowDownload"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Allow Download</FormLabel>
                <FormDescription>
                  User can download the result to their device
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

        {/* Allow System Share */}
        <FormField
          control={form.control}
          name="config.allowSystemShare"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <FormLabel className="text-base">System Share</FormLabel>
                <FormDescription>
                  Use device&apos;s native share functionality
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

        {/* Allow Email */}
        <FormField
          control={form.control}
          name="config.allowEmail"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Email Share</FormLabel>
                <FormDescription>
                  User can email the result to themselves
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

        {/* Social Media Options */}
        <div className="space-y-3">
          <FormLabel>Social Media</FormLabel>
          <FormDescription className="text-xs">
            Select social platforms to enable direct sharing
          </FormDescription>
          <FormField
            control={form.control}
            name="config.socials"
            render={() => (
              <FormItem>
                <div className="grid grid-cols-2 gap-2">
                  {SOCIAL_OPTIONS.map((social) => (
                    <FormField
                      key={social.value}
                      control={form.control}
                      name="config.socials"
                      render={({ field }) => (
                        <FormItem
                          key={social.value}
                          className="flex items-center space-x-3 space-y-0 rounded-lg border p-3"
                        >
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(social.value)}
                              onCheckedChange={(checked) => {
                                const currentValue = field.value || [];
                                if (checked) {
                                  field.onChange([...currentValue, social.value]);
                                } else {
                                  field.onChange(
                                    currentValue.filter((v) => v !== social.value)
                                  );
                                }
                              }}
                            />
                          </FormControl>
                          <FormLabel className="font-normal cursor-pointer">
                            {social.label}
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                  ))}
                </div>
              </FormItem>
            )}
          />
          <p className="text-xs text-muted-foreground">
            {form.watch("config.socials")?.length || 0} of {STEP_CONSTANTS.AVAILABLE_SOCIALS.length} platforms selected
          </p>
        </div>
      </form>
    </Form>
  );
}
