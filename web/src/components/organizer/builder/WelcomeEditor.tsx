"use client";

import { useState, useTransition } from "react";
import { Event } from "@/lib/types/firestore";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { PreviewPanel } from "./PreviewPanel";
import { updateEventWelcome } from "@/lib/actions/events";
import { uploadImage } from "@/lib/actions/storage";
import { useRouter } from "next/navigation";
import { Upload, CheckCircle2, XCircle } from "lucide-react";

interface WelcomeEditorProps {
  event: Event;
}

export function WelcomeEditor({ event }: WelcomeEditorProps) {
  const [isPending, startTransition] = useTransition();
  const [isUploading, setIsUploading] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const router = useRouter();

  // Form state
  const [welcomeTitle, setWelcomeTitle] = useState(event.welcomeTitle || "");
  const [welcomeDescription, setWelcomeDescription] = useState(event.welcomeDescription || "");
  const [welcomeCtaLabel, setWelcomeCtaLabel] = useState(event.welcomeCtaLabel || "Get Started");
  const [welcomeBackgroundColorHex, setWelcomeBackgroundColorHex] = useState(
    event.welcomeBackgroundColorHex || "#FFFFFF"
  );
  // Store the URL directly in the database for easier display
  const [welcomeBackgroundImagePath, setWelcomeBackgroundImagePath] = useState(
    event.welcomeBackgroundImagePath || ""
  );

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setSaveMessage(null);

    try {
      const result = await uploadImage(file, "welcome");

      if (result.success) {
        // Store the URL directly for easy display
        setWelcomeBackgroundImagePath(result.data.url);
        setSaveMessage({ type: "success", text: "Background image uploaded successfully" });
        setTimeout(() => setSaveMessage(null), 3000);
      } else {
        setSaveMessage({ type: "error", text: result.error.message });
        setTimeout(() => setSaveMessage(null), 5000);
      }
    } catch {
      setSaveMessage({ type: "error", text: "An unexpected error occurred during upload" });
      setTimeout(() => setSaveMessage(null), 5000);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setWelcomeBackgroundImagePath("");
  };

  const handleSave = () => {
    setSaveMessage(null);
    startTransition(async () => {
      const result = await updateEventWelcome(event.id, {
        welcomeTitle,
        welcomeDescription,
        welcomeCtaLabel,
        welcomeBackgroundColorHex,
        welcomeBackgroundImagePath,
      });

      if (result.success) {
        setSaveMessage({ type: "success", text: "Welcome screen updated successfully" });
        setTimeout(() => setSaveMessage(null), 3000);
        // Refresh the page data
        router.refresh();
      } else {
        setSaveMessage({ type: "error", text: result.error.message });
        setTimeout(() => setSaveMessage(null), 5000);
      }
    });
  };

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

        {/* Save Message */}
        {saveMessage && (
          <div
            className={`flex items-center gap-2 rounded-lg p-3 text-sm ${
              saveMessage.type === "success"
                ? "bg-green-50 text-green-800 border border-green-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}
          >
            {saveMessage.type === "success" ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <XCircle className="h-4 w-4" />
            )}
            <span>{saveMessage.text}</span>
          </div>
        )}

        <div className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="welcome-title">Title</Label>
            <Input
              id="welcome-title"
              placeholder="Welcome to the event!"
              value={welcomeTitle}
              onChange={(e) => setWelcomeTitle(e.target.value)}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground">
              {welcomeTitle.length}/500 characters
            </p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="welcome-description">Description</Label>
            <Textarea
              id="welcome-description"
              placeholder="Take a photo and share it with your friends!"
              value={welcomeDescription}
              onChange={(e) => setWelcomeDescription(e.target.value)}
              maxLength={500}
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              {welcomeDescription.length}/500 characters
            </p>
          </div>

          {/* CTA Label */}
          <div className="space-y-2">
            <Label htmlFor="welcome-cta">Button Label</Label>
            <Input
              id="welcome-cta"
              placeholder="Get Started"
              value={welcomeCtaLabel}
              onChange={(e) => setWelcomeCtaLabel(e.target.value)}
              maxLength={50}
            />
            <p className="text-xs text-muted-foreground">
              {welcomeCtaLabel.length}/50 characters
            </p>
          </div>

          {/* Background Color */}
          <div className="space-y-2">
            <Label htmlFor="welcome-bg-color">Background Color</Label>
            <div className="flex gap-2">
              <Input
                id="welcome-bg-color"
                type="color"
                value={welcomeBackgroundColorHex}
                onChange={(e) => setWelcomeBackgroundColorHex(e.target.value)}
                className="h-10 w-20"
              />
              <Input
                type="text"
                value={welcomeBackgroundColorHex}
                onChange={(e) => setWelcomeBackgroundColorHex(e.target.value)}
                placeholder="#FFFFFF"
                pattern="^#[0-9A-Fa-f]{6}$"
                className="flex-1"
              />
            </div>
          </div>

          {/* Background Image */}
          <div className="space-y-2">
            <Label htmlFor="welcome-bg-image">Background Image</Label>
            <div className="space-y-2">
              {welcomeBackgroundImagePath && (
                <div className="relative aspect-video w-full overflow-hidden rounded-lg border">
                  <img
                    src={welcomeBackgroundImagePath}
                    alt="Welcome background"
                    className="h-full w-full object-cover"
                  />
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={handleRemoveImage}
                    disabled={isUploading || isPending}
                  >
                    Remove
                  </Button>
                </div>
              )}
              <div className="relative">
                <input
                  id="welcome-bg-image"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleImageUpload}
                  disabled={isUploading || isPending}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  className="w-full"
                  disabled={isUploading || isPending}
                  onClick={() => document.getElementById("welcome-bg-image")?.click()}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {isUploading ? "Uploading..." : "Upload Image"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Recommended: 1080x1920px (9:16 aspect ratio). Max 10MB.
              </p>
            </div>
          </div>

          {/* Save Button */}
          <Button
            onClick={handleSave}
            disabled={isPending || isUploading}
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
            backgroundColor: welcomeBackgroundColorHex,
            backgroundImage: welcomeBackgroundImagePath
              ? `url(${welcomeBackgroundImagePath})`
              : undefined,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          {/* Overlay for readability when image is present */}
          {welcomeBackgroundImagePath && (
            <div className="absolute inset-0 bg-black/40" />
          )}

          {/* Content */}
          <div className="relative z-10 space-y-6">
            {welcomeTitle && (
              <h1
                className="text-3xl font-bold"
                style={{
                  color: welcomeBackgroundImagePath ? "#FFFFFF" : "#000000",
                }}
              >
                {welcomeTitle}
              </h1>
            )}

            {welcomeDescription && (
              <p
                className="text-lg"
                style={{
                  color: welcomeBackgroundImagePath ? "#FFFFFF" : "#666666",
                }}
              >
                {welcomeDescription}
              </p>
            )}

            {welcomeCtaLabel && (
              <Button size="lg" className="mt-4">
                {welcomeCtaLabel}
              </Button>
            )}
          </div>
        </div>
      </PreviewPanel>
    </div>
  );
}
