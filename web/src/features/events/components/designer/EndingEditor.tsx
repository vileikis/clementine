"use client";

import { useState, useTransition } from "react";
import { Event, ShareSocial } from "../../types/event.types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { PreviewPanel } from "./PreviewPanel";
import { updateEventEnding, updateEventShare } from "../../actions/events";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Instagram,
  Facebook,
  Twitter,
  MessageCircle,
  Share2,
  Mail,
  Download,
} from "lucide-react";

interface EndingEditorProps {
  event: Event;
}

const SOCIAL_PLATFORMS: { value: ShareSocial; label: string; icon: typeof Instagram }[] = [
  { value: "instagram", label: "Instagram", icon: Instagram },
  { value: "facebook", label: "Facebook", icon: Facebook },
  { value: "x", label: "X (Twitter)", icon: Twitter },
  { value: "tiktok", label: "TikTok", icon: MessageCircle },
  { value: "snapchat", label: "Snapchat", icon: MessageCircle },
  { value: "whatsapp", label: "WhatsApp", icon: MessageCircle },
  { value: "custom", label: "Custom Link", icon: Share2 },
];

/**
 * EndingEditor component for configuring ending screen and share options
 * Part of Phase 8 (User Story 5) - Configure Ending Screen
 *
 * Features:
 * - Ending screen content (headline, body, CTA)
 * - Share configuration toggles (download, email, system share, social platforms)
 * - Live preview panel
 * - Server Action integration
 */
export function EndingEditor({ event }: EndingEditorProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // Form state - ending screen (using nested event.ending object)
  // Note: null from DB should display as empty string in form
  const [endTitle, setEndTitle] = useState(event.ending?.title ?? "");
  const [endBody, setEndBody] = useState(event.ending?.body ?? "");
  const [endCtaLabel, setEndCtaLabel] = useState(event.ending?.ctaLabel ?? "");
  const [endCtaUrl, setEndCtaUrl] = useState(event.ending?.ctaUrl ?? "");

  // Form state - share configuration (using nested event.share object)
  const [shareAllowDownload, setShareAllowDownload] = useState(event.share?.allowDownload ?? true);
  const [shareAllowSystemShare, setShareAllowSystemShare] = useState(event.share?.allowSystemShare ?? true);
  const [shareAllowEmail, setShareAllowEmail] = useState(event.share?.allowEmail ?? false);
  const [shareSocials, setShareSocials] = useState<ShareSocial[]>(event.share?.socials || []);

  // URL validation state
  const [ctaUrlError, setCtaUrlError] = useState<string | null>(null);

  // Helper function to validate URL
  const isValidUrl = (urlString: string): boolean => {
    if (!urlString) return true; // Empty is valid (will be set to null)
    try {
      const url = new URL(urlString);
      return url.protocol === "http:" || url.protocol === "https:";
    } catch {
      return false;
    }
  };

  // Validate ctaUrl
  const handleCtaUrlChange = (value: string) => {
    setEndCtaUrl(value);
    if (value && !isValidUrl(value)) {
      setCtaUrlError("Please enter a valid URL (starting with http:// or https://)");
    } else {
      setCtaUrlError(null);
    }
  };

  const handleSave = () => {
    if (isPending) return; // Prevent multiple saves

    // Check for validation errors before saving
    if (ctaUrlError) {
      toast.error("Please fix validation errors before saving");
      return;
    }

    startTransition(async () => {
      // Call both Server Actions in parallel
      const [endingResult, shareResult] = await Promise.all([
        updateEventEnding(event.id, {
          title: endTitle || null,
          body: endBody || null,
          ctaLabel: endCtaLabel || null,
          ctaUrl: endCtaUrl || null,
        }),
        updateEventShare(event.id, {
          allowDownload: shareAllowDownload,
          allowSystemShare: shareAllowSystemShare,
          allowEmail: shareAllowEmail,
          socials: shareSocials,
        }),
      ]);

      // Check both results
      if (endingResult.success && shareResult.success) {
        toast.success("Ending screen and share settings updated successfully");
        router.refresh();
      } else {
        // Show error from whichever failed
        if (!endingResult.success) {
          toast.error(endingResult.error.message || "Failed to update ending screen");
        } else if (!shareResult.success) {
          toast.error(shareResult.error.message || "Failed to update share settings");
        }
      }
    });
  };

  // Keyboard shortcuts: Cmd+S / Ctrl+S to save
  useKeyboardShortcuts({
    "Cmd+S": handleSave,
    "Ctrl+S": handleSave,
  });

  const toggleSocialPlatform = (platform: ShareSocial) => {
    setShareSocials((prev) =>
      prev.includes(platform)
        ? prev.filter((p) => p !== platform)
        : [...prev, platform]
    );
  };

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
      {/* Form Controls */}
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold">Ending Screen</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Configure the final screen guests see after completing their experience
          </p>
        </div>

        <div className="space-y-6">
          {/* Ending Screen Content */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Content</h3>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="end-title">Title</Label>
              <Input
                id="end-title"
                placeholder="Thanks for participating!"
                value={endTitle}
                onChange={(e) => setEndTitle(e.target.value)}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground">
                {endTitle.length}/500 characters
              </p>
            </div>

            {/* Body */}
            <div className="space-y-2">
              <Label htmlFor="end-body">Body Text</Label>
              <Textarea
                id="end-body"
                placeholder="Share your amazing result with friends!"
                value={endBody}
                onChange={(e) => setEndBody(e.target.value)}
                maxLength={500}
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                {endBody.length}/500 characters
              </p>
            </div>

            {/* CTA Label */}
            <div className="space-y-2">
              <Label htmlFor="end-cta-label">Button Label</Label>
              <Input
                id="end-cta-label"
                placeholder="Share Now"
                value={endCtaLabel}
                onChange={(e) => setEndCtaLabel(e.target.value)}
                maxLength={50}
              />
              <p className="text-xs text-muted-foreground">
                {endCtaLabel.length}/50 characters
              </p>
            </div>

            {/* CTA URL */}
            <div className="space-y-2">
              <Label htmlFor="end-cta-url">Button URL (optional)</Label>
              <Input
                id="end-cta-url"
                type="url"
                placeholder="https://example.com"
                value={endCtaUrl}
                onChange={(e) => handleCtaUrlChange(e.target.value)}
              />
              {ctaUrlError ? (
                <p className="text-sm text-destructive">{ctaUrlError}</p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  External link for the button (leave empty for share action)
                </p>
              )}
            </div>
          </div>

          {/* Share Configuration */}
          <div className="space-y-4 pt-6 border-t">
            <h3 className="text-lg font-medium">Share Options</h3>

            {/* Download Toggle */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="share-download"
                checked={shareAllowDownload}
                onCheckedChange={(checked: boolean) => setShareAllowDownload(checked === true)}
              />
              <Label
                htmlFor="share-download"
                className="flex items-center gap-2 text-sm font-normal cursor-pointer"
              >
                <Download className="h-4 w-4" />
                Allow Download
              </Label>
            </div>

            {/* System Share Toggle */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="share-system"
                checked={shareAllowSystemShare}
                onCheckedChange={(checked: boolean) => setShareAllowSystemShare(checked === true)}
              />
              <Label
                htmlFor="share-system"
                className="flex items-center gap-2 text-sm font-normal cursor-pointer"
              >
                <Share2 className="h-4 w-4" />
                Allow System Share (native share sheet)
              </Label>
            </div>

            {/* Email Toggle */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="share-email"
                checked={shareAllowEmail}
                onCheckedChange={(checked: boolean) => setShareAllowEmail(checked === true)}
              />
              <Label
                htmlFor="share-email"
                className="flex items-center gap-2 text-sm font-normal cursor-pointer"
              >
                <Mail className="h-4 w-4" />
                Allow Email Share
              </Label>
            </div>

            {/* Social Platforms */}
            <div className="space-y-3 pt-4">
              <Label className="text-sm font-medium">Social Platforms</Label>
              <div className="grid grid-cols-2 gap-3">
                {SOCIAL_PLATFORMS.map((platform) => {
                  const Icon = platform.icon;
                  return (
                    <div key={platform.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`social-${platform.value}`}
                        checked={shareSocials.includes(platform.value)}
                        onCheckedChange={() => toggleSocialPlatform(platform.value)}
                      />
                      <Label
                        htmlFor={`social-${platform.value}`}
                        className="flex items-center gap-2 text-sm font-normal cursor-pointer"
                      >
                        <Icon className="h-4 w-4" />
                        {platform.label}
                      </Label>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Save Button */}
          <Button
            onClick={handleSave}
            disabled={isPending || !!ctaUrlError}
            className="w-full"
          >
            {isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      {/* Live Preview */}
      <PreviewPanel>
        <div className="relative flex h-full w-full flex-col items-center justify-center p-8 text-center bg-background">
          {/* Content */}
          <div className="space-y-6 max-w-md">
            {/* Result Placeholder */}
            <div className="w-full aspect-square bg-muted rounded-lg flex items-center justify-center mb-6">
              <p className="text-sm text-muted-foreground">Generated Result</p>
            </div>

            {endTitle && (
              <h1 className="text-3xl font-bold text-foreground">
                {endTitle}
              </h1>
            )}

            {endBody && (
              <p className="text-lg text-muted-foreground">
                {endBody}
              </p>
            )}

            {/* Share Options */}
            <div className="space-y-3 pt-4">
              {endCtaLabel && (
                <Button size="lg" className="w-full">
                  {endCtaLabel}
                </Button>
              )}

              {/* Share Action Buttons */}
              <div className="flex flex-wrap gap-2 justify-center">
                {shareAllowDownload && (
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                )}
                {shareAllowSystemShare && (
                  <Button variant="outline" size="sm">
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                )}
                {shareAllowEmail && (
                  <Button variant="outline" size="sm">
                    <Mail className="h-4 w-4 mr-2" />
                    Email
                  </Button>
                )}
              </div>

              {/* Social Platform Buttons */}
              {shareSocials.length > 0 && (
                <div className="flex flex-wrap gap-2 justify-center pt-2">
                  {shareSocials.map((social) => {
                    const platform = SOCIAL_PLATFORMS.find((p) => p.value === social);
                    if (!platform) return null;
                    const Icon = platform.icon;
                    return (
                      <Button key={social} variant="outline" size="sm">
                        <Icon className="h-4 w-4 mr-2" />
                        {platform.label}
                      </Button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </PreviewPanel>
    </div>
  );
}
