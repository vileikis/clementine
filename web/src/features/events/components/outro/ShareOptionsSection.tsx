"use client";

import type { UseFormReturn } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import type { EventShareOptions } from "../../types/event.types";
import type { ShareSocial } from "@/features/steps/types/step.types";

interface ShareOptionsSectionProps {
  /** React Hook Form instance for share options fields */
  form: UseFormReturn<EventShareOptions>;
  /** Blur handler for autosave */
  onBlur?: () => void;
}

// Social platform metadata
const SOCIAL_PLATFORMS: Array<{
  id: ShareSocial;
  label: string;
  description: string;
}> = [
  { id: "instagram", label: "Instagram", description: "Share to Instagram Stories" },
  { id: "facebook", label: "Facebook", description: "Share to Facebook" },
  { id: "twitter", label: "Twitter", description: "Share to Twitter/X" },
  { id: "linkedin", label: "LinkedIn", description: "Share to LinkedIn" },
  { id: "tiktok", label: "TikTok", description: "Share to TikTok" },
  { id: "whatsapp", label: "WhatsApp", description: "Share via WhatsApp" },
];

/**
 * Share options section form fields for event configuration.
 * Allows control of which sharing methods are available to guests.
 *
 * Form state is managed by parent (outro page) and passed via form prop.
 */
export function ShareOptionsSection({ form, onBlur }: ShareOptionsSectionProps) {
  const { watch, setValue } = form;

  const allowDownload = watch("allowDownload") ?? true;
  const allowSystemShare = watch("allowSystemShare") ?? true;
  const allowEmail = watch("allowEmail") ?? false;
  const socials = watch("socials") ?? [];

  const handleSocialToggle = (platformId: ShareSocial, checked: boolean) => {
    const currentSocials = socials || [];
    const updatedSocials = checked
      ? [...currentSocials, platformId]
      : currentSocials.filter((id) => id !== platformId);

    setValue("socials", updatedSocials, { shouldDirty: true });
    onBlur?.();
  };

  return (
    <section className="space-y-4">
      {/* Section header */}
      <div>
        <h2 className="text-lg font-semibold">Share Options</h2>
        <p className="text-sm text-muted-foreground">
          Control which sharing methods are available to guests after they complete an experience.
        </p>
      </div>

      {/* Form fields */}
      <div className="space-y-6" onBlur={onBlur}>
        {/* Download toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="allow-download">Allow Download</Label>
            <p className="text-xs text-muted-foreground">
              Let guests download their result image
            </p>
          </div>
          <Switch
            id="allow-download"
            checked={allowDownload}
            onCheckedChange={(checked) => {
              setValue("allowDownload", checked, { shouldDirty: true });
              onBlur?.();
            }}
          />
        </div>

        {/* System share toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="allow-system-share">Allow System Share</Label>
            <p className="text-xs text-muted-foreground">
              Show native share button (Web Share API)
            </p>
          </div>
          <Switch
            id="allow-system-share"
            checked={allowSystemShare}
            onCheckedChange={(checked) => {
              setValue("allowSystemShare", checked, { shouldDirty: true });
              onBlur?.();
            }}
          />
        </div>

        {/* Email toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="allow-email">Allow Email Share</Label>
            <p className="text-xs text-muted-foreground">
              Show email share option
            </p>
          </div>
          <Switch
            id="allow-email"
            checked={allowEmail}
            onCheckedChange={(checked) => {
              setValue("allowEmail", checked, { shouldDirty: true });
              onBlur?.();
            }}
          />
        </div>

        {/* Social platforms multi-select */}
        <div className="space-y-3">
          <div>
            <Label>Social Platforms</Label>
            <p className="text-xs text-muted-foreground">
              Select which social platforms to show
            </p>
          </div>

          <div className="space-y-3 border rounded-md p-4">
            {SOCIAL_PLATFORMS.map((platform) => (
              <div key={platform.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`social-${platform.id}`}
                  checked={socials.includes(platform.id)}
                  onCheckedChange={(checked) =>
                    handleSocialToggle(platform.id, checked === true)
                  }
                />
                <div className="flex-1">
                  <label
                    htmlFor={`social-${platform.id}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {platform.label}
                  </label>
                  <p className="text-xs text-muted-foreground">
                    {platform.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
