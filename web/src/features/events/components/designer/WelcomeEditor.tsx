"use client";

import { useState, useTransition } from "react";
import { Event } from "../../types/event.types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { PreviewPanel } from "./PreviewPanel";
import { ImageUploadField } from "@/components/shared/ImageUploadField";
import { updateEventWelcome } from "../../actions/events";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";

interface WelcomeEditorProps {
  event: Event;
}

export function WelcomeEditor({ event }: WelcomeEditorProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // Form state - using nested welcome object with optional chaining
  // Note: null from DB should display as empty string in form
  const [title, setTitle] = useState(event.welcome?.title ?? "");
  const [body, setBody] = useState(event.welcome?.body ?? "");
  const [ctaLabel, setCtaLabel] = useState(event.welcome?.ctaLabel ?? "");
  const [backgroundColor, setBackgroundColor] = useState(
    event.welcome?.backgroundColor ?? ""
  );
  const [backgroundImage, setBackgroundImage] = useState(
    event.welcome?.backgroundImage ?? ""
  );

  const handleSave = () => {
    if (isPending) return; // Prevent multiple saves
    startTransition(async () => {
      const result = await updateEventWelcome(event.id, {
        title: title || null,
        body: body || null,
        ctaLabel: ctaLabel || null,
        backgroundColor: backgroundColor || null,
        backgroundImage: backgroundImage || null,
      });

      if (result.success) {
        toast.success("Welcome screen updated successfully");
        router.refresh();
      } else {
        toast.error(result.error.message || "Failed to update welcome screen");
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
          <h2 className="text-2xl font-semibold">Welcome Screen</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Configure the first screen your guests will see
          </p>
        </div>

        <div className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="welcome-title">Title</Label>
            <Input
              id="welcome-title"
              placeholder="Welcome to the event!"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground">
              {title.length}/500 characters
            </p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="welcome-description">Description</Label>
            <Textarea
              id="welcome-description"
              placeholder="Take a photo and share it with your friends!"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              maxLength={500}
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              {body.length}/500 characters
            </p>
          </div>

          {/* CTA Label */}
          <div className="space-y-2">
            <Label htmlFor="welcome-cta">Button Label</Label>
            <Input
              id="welcome-cta"
              placeholder="Get Started"
              value={ctaLabel}
              onChange={(e) => setCtaLabel(e.target.value)}
              maxLength={50}
            />
            <p className="text-xs text-muted-foreground">
              {ctaLabel.length}/50 characters
            </p>
          </div>

          {/* Background Color */}
          <div className="space-y-2">
            <Label htmlFor="welcome-bg-color">Background Color</Label>
            <div className="flex gap-2">
              <Input
                id="welcome-bg-color"
                type="color"
                value={backgroundColor}
                onChange={(e) => setBackgroundColor(e.target.value)}
                className="h-10 w-20"
              />
              <Input
                type="text"
                value={backgroundColor}
                onChange={(e) => setBackgroundColor(e.target.value)}
                placeholder="#FFFFFF"
                pattern="^#[0-9A-Fa-f]{6}$"
                className="flex-1"
              />
            </div>
          </div>

          {/* Background Image */}
          <ImageUploadField
            id="welcome-bg-image"
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
            {title && (
              <h1
                className="text-3xl font-bold"
                style={{
                  color: backgroundImage ? "#FFFFFF" : "#000000",
                }}
              >
                {title}
              </h1>
            )}

            {body && (
              <p
                className="text-lg"
                style={{
                  color: backgroundImage ? "#FFFFFF" : "#666666",
                }}
              >
                {body}
              </p>
            )}

            {ctaLabel && (
              <Button size="lg" className="mt-4">
                {ctaLabel}
              </Button>
            )}
          </div>
        </div>
      </PreviewPanel>
    </div>
  );
}
