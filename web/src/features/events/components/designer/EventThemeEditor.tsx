"use client";

import { useReducer, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { PreviewShell } from "@/features/preview-shell";
import { ImageUploadField } from "@/components/shared/ImageUploadField";
import { updateEventThemeAction } from "../../actions/events.actions";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { ThemedBackground, BUTTON_RADIUS_MAP, type Theme } from "@/features/theming";
import type { Event } from "../../types/event.types";

interface EventThemeEditorProps {
  event: Event;
  projectId: string;
}

// Theme reducer actions
type ThemeAction =
  | { type: "UPDATE_PRIMARY_COLOR"; payload: string }
  | { type: "UPDATE_FONT_FAMILY"; payload: string }
  | { type: "UPDATE_TEXT_COLOR"; payload: string }
  | { type: "UPDATE_TEXT_ALIGNMENT"; payload: "left" | "center" | "right" }
  | { type: "UPDATE_BUTTON_BG_COLOR"; payload: string | null }
  | { type: "UPDATE_BUTTON_TEXT_COLOR"; payload: string }
  | { type: "UPDATE_BUTTON_RADIUS"; payload: "none" | "sm" | "md" | "full" }
  | { type: "UPDATE_BG_COLOR"; payload: string }
  | { type: "UPDATE_BG_IMAGE"; payload: string | null }
  | { type: "UPDATE_BG_OVERLAY_OPACITY"; payload: number };

// Reducer function
function themeReducer(state: Theme, action: ThemeAction): Theme {
  switch (action.type) {
    case "UPDATE_PRIMARY_COLOR":
      return { ...state, primaryColor: action.payload };
    case "UPDATE_FONT_FAMILY":
      return { ...state, fontFamily: action.payload || null };
    case "UPDATE_TEXT_COLOR":
      return {
        ...state,
        text: { ...state.text, color: action.payload },
      };
    case "UPDATE_TEXT_ALIGNMENT":
      return {
        ...state,
        text: { ...state.text, alignment: action.payload },
      };
    case "UPDATE_BUTTON_BG_COLOR":
      return {
        ...state,
        button: { ...state.button, backgroundColor: action.payload },
      };
    case "UPDATE_BUTTON_TEXT_COLOR":
      return {
        ...state,
        button: { ...state.button, textColor: action.payload },
      };
    case "UPDATE_BUTTON_RADIUS":
      return {
        ...state,
        button: { ...state.button, radius: action.payload },
      };
    case "UPDATE_BG_COLOR":
      return {
        ...state,
        background: { ...state.background, color: action.payload },
      };
    case "UPDATE_BG_IMAGE":
      return {
        ...state,
        background: { ...state.background, image: action.payload },
      };
    case "UPDATE_BG_OVERLAY_OPACITY":
      return {
        ...state,
        background: { ...state.background, overlayOpacity: action.payload },
      };
    default:
      return state;
  }
}

/**
 * EventThemeEditor component for configuring event-wide theme settings
 * Adapted from ThemeEditor for Event entities
 *
 * Features:
 * - 7 configuration sections: Identity, Primary Color, Text, Button, Background, Logo, Font
 * - useReducer for complex state management
 * - Live preview panel
 * - Keyboard shortcuts (Cmd+S/Ctrl+S)
 * - Server Action integration
 */
export function EventThemeEditor({ event, projectId }: EventThemeEditorProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // Initialize theme state with reducer
  const [theme, dispatch] = useReducer(themeReducer, event.theme);

  const handleSave = () => {
    if (isPending) return; // Prevent multiple saves
    startTransition(async () => {
      const result = await updateEventThemeAction(projectId, event.id, {
        primaryColor: theme.primaryColor,
        fontFamily: theme.fontFamily,
        text: {
          color: theme.text.color,
          alignment: theme.text.alignment,
        },
        button: {
          backgroundColor: theme.button.backgroundColor,
          textColor: theme.button.textColor,
          radius: theme.button.radius,
        },
        background: {
          color: theme.background.color,
          image: theme.background.image,
          overlayOpacity: theme.background.overlayOpacity,
        },
      });

      if (result.success) {
        toast.success("Theme settings updated successfully");
        router.refresh();
      } else {
        if (!result.error) {
          console.warn("updateEventThemeAction returned failure without error details");
        }
        toast.error(result.error?.message || "Failed to update theme settings");
      }
    });
  };

  // Keyboard shortcuts: Cmd+S / Ctrl+S to save
  useKeyboardShortcuts({
    "Cmd+S": handleSave,
    "Ctrl+S": handleSave,
  });

  // Helper for button styles
  const buttonBgColor = theme.button.backgroundColor || theme.primaryColor;

  return (    
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_1fr] items-start">
      {/* Form Controls */}
      <div className="space-y-8">
      {/* Header - Full Width */}
      <div>
        <h2 className="text-2xl font-semibold">Event Theme</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Configure theme settings for visual customization of this event
        </p>
      </div>

        {/* 1. Font Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Typography</h3>

          {/* Font Family */}
          <div className="space-y-2">
            <Label htmlFor="font-family">Font Family</Label>
            <Input
              id="font-family"
              type="text"
              value={theme.fontFamily || ""}
              onChange={(e) =>
                dispatch({ type: "UPDATE_FONT_FAMILY", payload: e.target.value })
              }
              placeholder="Inter, sans-serif"
            />
            <p className="text-xs text-muted-foreground">
              Custom font family (e.g., &quot;Roboto, sans-serif&quot;). Leave empty for default.
            </p>
          </div>
        </div>

        {/* 2. Primary Color Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Primary Color</h3>
          <div className="space-y-2">
            <Label htmlFor="primary-color">Primary Color</Label>
            <div className="flex gap-2">
              <Input
                id="primary-color"
                type="color"
                value={theme.primaryColor}
                onChange={(e) =>
                  dispatch({ type: "UPDATE_PRIMARY_COLOR", payload: e.target.value })
                }
                className="h-10 w-20"
              />
              <Input
                type="text"
                value={theme.primaryColor}
                onChange={(e) =>
                  dispatch({ type: "UPDATE_PRIMARY_COLOR", payload: e.target.value })
                }
                placeholder="#6366F1"
                pattern="^#[0-9A-Fa-f]{6}$"
                className="flex-1"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Anchor color for the event. Buttons inherit this if no custom color is set.
            </p>
          </div>
        </div>

        {/* 3. Text Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Text</h3>

          {/* Text Color */}
          <div className="space-y-2">
            <Label htmlFor="text-color">Text Color</Label>
            <div className="flex gap-2">
              <Input
                id="text-color"
                type="color"
                value={theme.text.color}
                onChange={(e) =>
                  dispatch({ type: "UPDATE_TEXT_COLOR", payload: e.target.value })
                }
                className="h-10 w-20"
              />
              <Input
                type="text"
                value={theme.text.color}
                onChange={(e) =>
                  dispatch({ type: "UPDATE_TEXT_COLOR", payload: e.target.value })
                }
                placeholder="#1F2937"
                pattern="^#[0-9A-Fa-f]{6}$"
                className="flex-1"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Default text color for content
            </p>
          </div>

          {/* Text Alignment */}
          <div className="space-y-2">
            <Label htmlFor="text-alignment">Text Alignment</Label>
            <select
              id="text-alignment"
              value={theme.text.alignment}
              onChange={(e) =>
                dispatch({
                  type: "UPDATE_TEXT_ALIGNMENT",
                  payload: e.target.value as "left" | "center" | "right",
                })
              }
              className="w-full px-3 py-2 border border-input rounded-md bg-background"
            >
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
            </select>
            <p className="text-xs text-muted-foreground">
              Default text alignment for content
            </p>
          </div>
        </div>

        {/* 4. Button Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Button</h3>

          {/* Button Background Color */}
          <div className="space-y-2">
            <Label htmlFor="button-bg-color">Button Background Color</Label>
            <div className="flex gap-2">
              <Input
                id="button-bg-color"
                type="color"
                value={buttonBgColor}
                onChange={(e) =>
                  dispatch({
                    type: "UPDATE_BUTTON_BG_COLOR",
                    payload: e.target.value,
                  })
                }
                className="h-10 w-20"
              />
              <Input
                type="text"
                value={buttonBgColor}
                onChange={(e) =>
                  dispatch({
                    type: "UPDATE_BUTTON_BG_COLOR",
                    payload: e.target.value || null,
                  })
                }
                placeholder={theme.primaryColor}
                pattern="^#[0-9A-Fa-f]{6}$"
                className="flex-1"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Leave empty to inherit primary color
            </p>
          </div>

          {/* Button Text Color */}
          <div className="space-y-2">
            <Label htmlFor="button-text-color">Button Text Color</Label>
            <div className="flex gap-2">
              <Input
                id="button-text-color"
                type="color"
                value={theme.button.textColor}
                onChange={(e) =>
                  dispatch({
                    type: "UPDATE_BUTTON_TEXT_COLOR",
                    payload: e.target.value,
                  })
                }
                className="h-10 w-20"
              />
              <Input
                type="text"
                value={theme.button.textColor}
                onChange={(e) =>
                  dispatch({
                    type: "UPDATE_BUTTON_TEXT_COLOR",
                    payload: e.target.value,
                  })
                }
                placeholder="#FFFFFF"
                pattern="^#[0-9A-Fa-f]{6}$"
                className="flex-1"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Text color for buttons
            </p>
          </div>

          {/* Button Radius */}
          <div className="space-y-2">
            <Label htmlFor="button-radius">Button Radius</Label>
            <select
              id="button-radius"
              value={theme.button.radius}
              onChange={(e) =>
                dispatch({
                  type: "UPDATE_BUTTON_RADIUS",
                  payload: e.target.value as "none" | "sm" | "md" | "full",
                })
              }
              className="w-full px-3 py-2 border border-input rounded-md bg-background"
            >
              <option value="none">None (Square)</option>
              <option value="sm">Small</option>
              <option value="md">Medium</option>
              <option value="full">Full (Pill)</option>
            </select>
            <p className="text-xs text-muted-foreground">
              Border radius for buttons
            </p>
          </div>
        </div>

        {/* 5. Background Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Background</h3>

          {/* Background Color */}
          <div className="space-y-2">
            <Label htmlFor="bg-color">Background Color</Label>
            <div className="flex gap-2">
              <Input
                id="bg-color"
                type="color"
                value={theme.background.color}
                onChange={(e) =>
                  dispatch({ type: "UPDATE_BG_COLOR", payload: e.target.value })
                }
                className="h-10 w-20"
              />
              <Input
                type="text"
                value={theme.background.color}
                onChange={(e) =>
                  dispatch({ type: "UPDATE_BG_COLOR", payload: e.target.value })
                }
                placeholder="#FFFFFF"
                pattern="^#[0-9A-Fa-f]{6}$"
                className="flex-1"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Default background color for screens
            </p>
          </div>

          {/* Background Image */}
          <ImageUploadField
            id="theme-bg-image"
            label="Background Image"
            value={theme.background.image || ""}
            onChange={(value) =>
              dispatch({ type: "UPDATE_BG_IMAGE", payload: value || null })
            }
            destination="backgrounds"
            disabled={isPending}
            recommendedSize="Recommended: 1080x1920px (9:16 aspect ratio). Max 10MB."
          />

          {/* Overlay Opacity */}
          <div className="space-y-2">
            <Label htmlFor="overlay-opacity">
              Overlay Opacity: {Math.round(theme.background.overlayOpacity * 100)}%
            </Label>
            <Input
              id="overlay-opacity"
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={theme.background.overlayOpacity}
              onChange={(e) =>
                dispatch({
                  type: "UPDATE_BG_OVERLAY_OPACITY",
                  payload: parseFloat(e.target.value),
                })
              }
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Dark overlay opacity when background image is present (improves text readability)
            </p>
          </div>
        </div>

        {/* Save Button */}
        <Button onClick={handleSave} disabled={isPending} className="w-full">
          {isPending ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      {/* Live Preview - Sticky */}
      <div className="lg:sticky lg:top-4">
        <PreviewShell enableViewportSwitcher enableFullscreen>
          <ThemedBackground
            background={theme.background}
            fontFamily={theme.fontFamily}
            className="flex h-full w-full flex-col items-center justify-center p-8"
            contentClassName="relative z-10 h-full overflow-auto space-y-6"
            style={{ textAlign: theme.text.alignment }}
          >
            <h1 className="text-3xl font-bold" style={{ color: theme.text.color }}>
              Event Preview
            </h1>

            <p className="text-lg" style={{ color: theme.text.color }}>
              This is how your theme will look
            </p>

            <Button
              size="lg"
              className="mt-4"
              style={{
                backgroundColor: buttonBgColor,
                color: theme.button.textColor,
                borderRadius: BUTTON_RADIUS_MAP[theme.button.radius],
              }}
            >
              Primary Button
            </Button>
          </ThemedBackground>
        </PreviewShell>
      </div>
    </div>
  );
}
