"use client";

import { useState, useTransition } from "react";
import { Event } from "../../types/event.types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { PreviewPanel } from "./PreviewPanel";
import { ImageUploadField } from "@/components/shared/ImageUploadField";
import { updateEventTheme } from "../../actions/events";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";

interface ThemeEditorProps {
  event: Event;
}

/**
 * ThemeEditor component for configuring event-wide theme settings
 * Part of Phase 5 (User Story 3) - Configure Event Theme
 *
 * Features:
 * - Theme color configuration (button colors, background color)
 * - Background image upload
 * - Live preview panel
 * - Server Action integration
 */
export function ThemeEditor({ event }: ThemeEditorProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // Form state - using nested theme object with optional chaining
  const [buttonColor, setButtonColor] = useState(event.theme?.buttonColor ?? "#3B82F6");
  const [buttonTextColor, setButtonTextColor] = useState(event.theme?.buttonTextColor ?? "#FFFFFF");
  const [backgroundColor, setBackgroundColor] = useState(event.theme?.backgroundColor ?? "#F9FAFB");
  const [backgroundImage, setBackgroundImage] = useState(event.theme?.backgroundImage ?? "");

  const handleSave = () => {
    if (isPending) return; // Prevent multiple saves
    startTransition(async () => {
      const result = await updateEventTheme(event.id, {
        buttonColor: buttonColor || undefined,
        buttonTextColor: buttonTextColor || undefined,
        backgroundColor: backgroundColor || undefined,
        backgroundImage: backgroundImage || undefined,
      });

      if (result.success) {
        toast.success("Theme settings updated successfully");
        router.refresh();
      } else {
        toast.error(result.error.message || "Failed to update theme settings");
      }
    });
  };

  // Keyboard shortcuts: Cmd+S / Ctrl+S to save
  useKeyboardShortcuts({
    "Cmd+S": handleSave,
    "Ctrl+S": handleSave,
  });

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
      {/* Form Controls */}
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold">Event Theme</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Configure event-wide theme settings for visual customization
          </p>
        </div>

        <div className="space-y-4">
          {/* Button Color */}
          <div className="space-y-2">
            <Label htmlFor="button-color">Primary Button Color</Label>
            <div className="flex gap-2">
              <Input
                id="button-color"
                type="color"
                value={buttonColor}
                onChange={(e) => setButtonColor(e.target.value)}
                className="h-10 w-20"
              />
              <Input
                type="text"
                value={buttonColor}
                onChange={(e) => setButtonColor(e.target.value)}
                placeholder="#3B82F6"
                pattern="^#[0-9A-Fa-f]{6}$"
                className="flex-1"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Color for primary action buttons throughout the event
            </p>
          </div>

          {/* Button Text Color */}
          <div className="space-y-2">
            <Label htmlFor="button-text-color">Button Text Color</Label>
            <div className="flex gap-2">
              <Input
                id="button-text-color"
                type="color"
                value={buttonTextColor}
                onChange={(e) => setButtonTextColor(e.target.value)}
                className="h-10 w-20"
              />
              <Input
                type="text"
                value={buttonTextColor}
                onChange={(e) => setButtonTextColor(e.target.value)}
                placeholder="#FFFFFF"
                pattern="^#[0-9A-Fa-f]{6}$"
                className="flex-1"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Text color for primary action buttons
            </p>
          </div>

          {/* Background Color */}
          <div className="space-y-2">
            <Label htmlFor="bg-color">Background Color</Label>
            <div className="flex gap-2">
              <Input
                id="bg-color"
                type="color"
                value={backgroundColor}
                onChange={(e) => setBackgroundColor(e.target.value)}
                className="h-10 w-20"
              />
              <Input
                type="text"
                value={backgroundColor}
                onChange={(e) => setBackgroundColor(e.target.value)}
                placeholder="#F9FAFB"
                pattern="^#[0-9A-Fa-f]{6}$"
                className="flex-1"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Default background color for event screens
            </p>
          </div>

          {/* Background Image */}
          <ImageUploadField
            id="theme-bg-image"
            label="Background Image"
            value={backgroundImage}
            onChange={setBackgroundImage}
            destination="welcome"
            disabled={isPending}
            recommendedSize="Recommended: 1080x1920px (9:16 aspect ratio). Max 10MB."
          />

          {/* Save Button */}
          <Button
            onClick={handleSave}
            disabled={isPending}
            className="w-full"
          >
            {isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      {/* Live Preview */}
      <PreviewPanel>
        <div
          className="relative flex h-full w-full flex-col items-center justify-center p-8 text-center"
          style={{
            backgroundColor: backgroundColor,
            backgroundImage: backgroundImage
              ? `url(${backgroundImage})`
              : undefined,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          {/* Overlay for readability when image is present */}
          {backgroundImage && (
            <div className="absolute inset-0 bg-black/40" />
          )}

          {/* Content */}
          <div className="relative z-10 space-y-6">
            <h1
              className="text-3xl font-bold"
              style={{
                color: backgroundImage ? "#FFFFFF" : "#000000",
              }}
            >
              Event Preview
            </h1>

            <p
              className="text-lg"
              style={{
                color: backgroundImage ? "#FFFFFF" : "#666666",
              }}
            >
              This is how your theme will look
            </p>

            <Button
              size="lg"
              className="mt-4"
              style={{
                backgroundColor: buttonColor,
                color: buttonTextColor,
              }}
            >
              Primary Button
            </Button>
          </div>
        </div>
      </PreviewPanel>
    </div>
  );
}
