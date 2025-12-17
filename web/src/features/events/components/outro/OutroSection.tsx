"use client";

import type { UseFormReturn } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { EventOutro } from "../../types/event.types";

interface OutroSectionProps {
  /** React Hook Form instance for outro fields */
  form: UseFormReturn<EventOutro>;
  /** Blur handler for autosave */
  onBlur?: () => void;
}

/**
 * Outro section form fields for event configuration.
 * Allows customization of end-of-experience message (title, description, CTA).
 *
 * Form state is managed by parent (outro page) and passed via form prop.
 */
export function OutroSection({ form, onBlur }: OutroSectionProps) {
  const { register, watch } = form;

  const titleValue = watch("title") ?? "";
  const descriptionValue = watch("description") ?? "";
  const ctaLabelValue = watch("ctaLabel") ?? "";

  return (
    <section className="space-y-4">
      {/* Section header */}
      <div>
        <h2 className="text-lg font-semibold">Outro Message</h2>
        <p className="text-sm text-muted-foreground">
          Customize the message guests see after completing an experience.
        </p>
      </div>

      {/* Form fields */}
      <div className="space-y-4" onBlur={onBlur}>
        {/* Title field */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="outro-title">Title</Label>
            <span className="text-xs text-muted-foreground">
              {titleValue.length}/100
            </span>
          </div>
          <Input
            id="outro-title"
            placeholder="Thanks for participating!"
            maxLength={100}
            {...register("title")}
          />
          <p className="text-xs text-muted-foreground">
            Optional heading for the outro screen
          </p>
        </div>

        {/* Description field */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="outro-description">Description</Label>
            <span className="text-xs text-muted-foreground">
              {descriptionValue.length}/500
            </span>
          </div>
          <Textarea
            id="outro-description"
            placeholder="Share your result with friends and check out more experiences!"
            maxLength={500}
            rows={3}
            {...register("description")}
          />
          <p className="text-xs text-muted-foreground">
            Optional message below the title
          </p>
        </div>

        {/* CTA Label field */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="outro-cta-label">Call-to-Action Button Text</Label>
            <span className="text-xs text-muted-foreground">
              {ctaLabelValue.length}/50
            </span>
          </div>
          <Input
            id="outro-cta-label"
            placeholder="Visit Our Website"
            maxLength={50}
            {...register("ctaLabel")}
          />
          <p className="text-xs text-muted-foreground">
            Button text (requires URL below)
          </p>
        </div>

        {/* CTA URL field */}
        <div className="space-y-2">
          <Label htmlFor="outro-cta-url">Call-to-Action URL</Label>
          <Input
            id="outro-cta-url"
            type="url"
            placeholder="https://example.com"
            {...register("ctaUrl")}
          />
          <p className="text-xs text-muted-foreground">
            Button destination (requires text above)
          </p>
        </div>
      </div>
    </section>
  );
}
