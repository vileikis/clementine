"use client";

import type { UseFormReturn } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ImageUploadField } from "@/components/shared/ImageUploadField";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { LayoutList, LayoutGrid } from "lucide-react";
import type { EventWelcome, Event } from "../../types/event.types";

interface WelcomeSectionProps {
  /** React Hook Form instance for welcome fields */
  form: UseFormReturn<EventWelcome>;
  /** Event data for context */
  event: Event;
  /** Blur handler for autosave */
  onBlur?: () => void;
}

/**
 * Welcome section form fields for event configuration.
 * Allows customization of title, description, hero media, and experience layout.
 *
 * Form state is managed by parent (EventGeneralTab) and passed via form prop.
 */
export function WelcomeSection({ form, event, onBlur }: WelcomeSectionProps) {
  const { register, watch, setValue } = form;

  const titleValue = watch("title") ?? "";
  const descriptionValue = watch("description") ?? "";
  const mediaUrl = watch("mediaUrl") ?? "";
  const mediaType = watch("mediaType") ?? null;
  const layout = watch("layout") ?? "list";

  /**
   * Handle media upload - sets both URL and auto-detects type
   */
  const handleMediaChange = (url: string) => {
    setValue("mediaUrl", url || null, { shouldDirty: true });

    // Auto-detect media type based on URL or clear it
    if (!url) {
      setValue("mediaType", null, { shouldDirty: true });
    }
    // Note: The actual media type detection should happen in ImageUploadField
    // or we can infer from file extension if needed
  };

  /**
   * Handle layout change
   */
  const handleLayoutChange = (newLayout: string) => {
    if (newLayout === "list" || newLayout === "grid") {
      setValue("layout", newLayout, { shouldDirty: true });
      // Trigger autosave
      onBlur?.();
    }
  };

  return (
    <section className="space-y-4">
      {/* Section header */}
      <div>
        <h2 className="text-lg font-semibold">Welcome Screen</h2>
        <p className="text-sm text-muted-foreground">
          Customize the welcome screen that guests see when they join your event.
        </p>
      </div>

      {/* Form fields */}
      <div className="space-y-4" onBlur={onBlur}>
        {/* Title field */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="welcome-title">Title</Label>
            <span className="text-xs text-muted-foreground">
              {titleValue.length}/100
            </span>
          </div>
          <Input
            id="welcome-title"
            placeholder={event.name}
            maxLength={100}
            {...register("title")}
          />
          <p className="text-xs text-muted-foreground">
            Falls back to event name if empty
          </p>
        </div>

        {/* Description field */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="welcome-description">Description</Label>
            <span className="text-xs text-muted-foreground">
              {descriptionValue.length}/500
            </span>
          </div>
          <Textarea
            id="welcome-description"
            placeholder="Welcome to our experience! Choose one below to get started."
            maxLength={500}
            rows={3}
            {...register("description")}
          />
        </div>

        {/* Hero media upload */}
        <ImageUploadField
          id="welcome-media"
          label="Hero Media"
          value={mediaUrl}
          onChange={handleMediaChange}
          destination="welcome"
          recommendedSize="Recommended: 1080×1920px (9:16 aspect ratio)"
          accept="image/png,image/jpeg,image/webp,video/mp4,video/webm"
          previewType={mediaType === "video" ? "video" : "image"}
        />

        {/* Layout toggle */}
        <div className="space-y-2">
          <Label>Experience Layout</Label>
          <ToggleGroup
            type="single"
            value={layout}
            onValueChange={handleLayoutChange}
            className="justify-start"
          >
            <ToggleGroupItem
              value="list"
              aria-label="List layout"
              className="min-h-[44px] min-w-[44px] gap-2"
            >
              <LayoutList className="h-4 w-4" />
              <span>List</span>
            </ToggleGroupItem>
            <ToggleGroupItem
              value="grid"
              aria-label="Grid layout"
              className="min-h-[44px] min-w-[44px] gap-2"
            >
              <LayoutGrid className="h-4 w-4" />
              <span>Grid</span>
            </ToggleGroupItem>
          </ToggleGroup>
          <p className="text-xs text-muted-foreground">
            {layout === "list"
              ? "Single column, full-width cards"
              : "Two-column grid of cards"}
          </p>
        </div>
      </div>
    </section>
  );
}
