"use client";

import { useReducer, useTransition, useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { FrameCard } from "./FrameCard";
import { OverlayPreview } from "./OverlayPreview";
import type { EventOverlayConfig, OverlayAspectRatio, Event } from "../../types/event.types";
import { updateEventOverlayAction } from "../../actions/events.actions";

interface OverlaySectionProps {
  /** Event data with current overlay configuration */
  event: Event;
  /** Project ID for server action */
  projectId: string;
}

// Overlay reducer actions
type OverlayAction =
  | { type: "SET_FRAME_URL"; ratio: OverlayAspectRatio; url: string | null }
  | { type: "SET_ENABLED"; ratio: OverlayAspectRatio; enabled: boolean }
  | { type: "REMOVE_FRAME"; ratio: OverlayAspectRatio };

// Reducer function
function overlayReducer(state: EventOverlayConfig, action: OverlayAction): EventOverlayConfig {
  switch (action.type) {
    case "SET_FRAME_URL":
      return {
        ...state,
        frames: {
          ...state.frames,
          [action.ratio]: {
            ...state.frames[action.ratio],
            frameUrl: action.url,
          },
        },
      };
    case "SET_ENABLED":
      return {
        ...state,
        frames: {
          ...state.frames,
          [action.ratio]: {
            ...state.frames[action.ratio],
            enabled: action.enabled,
          },
        },
      };
    case "REMOVE_FRAME":
      return {
        ...state,
        frames: {
          ...state.frames,
          [action.ratio]: {
            enabled: false,
            frameUrl: null,
          },
        },
      };
    default:
      return state;
  }
}

/**
 * OverlaySection component - Main overlay configuration section
 *
 * Features:
 * - State management with useReducer for overlay configuration
 * - Auto-save on changes (upload, toggle, remove)
 * - Two-column layout: form on left, preview on right
 * - Mobile-first responsive (stacked on mobile)
 * - Error handling with toast notifications
 * - Loading states during saves
 */
export function OverlaySection({ event, projectId }: OverlaySectionProps) {
  const [isPending, startTransition] = useTransition();
  const [selectedRatio, setSelectedRatio] = useState<OverlayAspectRatio>("square");
  const router = useRouter();

  // Initialize overlay state with reducer
  const [overlay, dispatch] = useReducer(
    overlayReducer,
    event.overlay || { frames: { square: { enabled: false, frameUrl: null }, story: { enabled: false, frameUrl: null } } }
  );

  /**
   * Handle frame upload - save immediately to server
   */
  const handleFrameUpload = (ratio: OverlayAspectRatio, url: string) => {
    // Update local state
    dispatch({ type: "SET_FRAME_URL", ratio, url });

    // Save to server
    if (isPending) return;
    startTransition(async () => {
      const result = await updateEventOverlayAction(projectId, event.id, {
        [ratio]: { frameUrl: url },
      });

      if (result.success) {
        toast.success(`${ratio === "square" ? "Square" : "Story"} frame uploaded`);
        router.refresh();
      } else {
        toast.error(result.error?.message || "Failed to upload frame");
      }
    });
  };

  /**
   * Handle enabled toggle - save immediately to server
   */
  const handleEnabledChange = (ratio: OverlayAspectRatio, enabled: boolean) => {
    // Update local state
    dispatch({ type: "SET_ENABLED", ratio, enabled });

    // Save to server
    if (isPending) return;
    startTransition(async () => {
      const result = await updateEventOverlayAction(projectId, event.id, {
        [ratio]: { enabled },
      });

      if (result.success) {
        toast.success(`Frame ${enabled ? "enabled" : "disabled"}`);
        router.refresh();
      } else {
        toast.error(result.error?.message || "Failed to update frame");
      }
    });
  };

  /**
   * Handle frame removal - save immediately to server
   */
  const handleRemove = (ratio: OverlayAspectRatio) => {
    // Update local state
    dispatch({ type: "REMOVE_FRAME", ratio });

    // Save to server
    if (isPending) return;
    startTransition(async () => {
      const result = await updateEventOverlayAction(projectId, event.id, {
        [ratio]: { frameUrl: null, enabled: false },
      });

      if (result.success) {
        toast.success("Frame removed");
        router.refresh();
      } else {
        toast.error(result.error?.message || "Failed to remove frame");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Section header */}
      <div>
        <h2 className="text-2xl font-semibold">Frame Overlays</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Upload frame images that will be applied to generated outputs
        </p>
      </div>

      {/* Two-column layout: cards on left, preview on right */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_1fr] items-start">
        {/* Left: Frame configuration cards */}
        <div className="space-y-6">
          <FrameCard
            ratio="square"
            frame={overlay.frames.square}
            onFrameUpload={(url) => handleFrameUpload("square", url)}
            onEnabledChange={(enabled) => handleEnabledChange("square", enabled)}
            onRemove={() => handleRemove("square")}
            disabled={isPending}
          />
          <FrameCard
            ratio="story"
            frame={overlay.frames.story}
            onFrameUpload={(url) => handleFrameUpload("story", url)}
            onEnabledChange={(enabled) => handleEnabledChange("story", enabled)}
            onRemove={() => handleRemove("story")}
            disabled={isPending}
          />
        </div>

        {/* Right: Preview (hidden on mobile, sticky on desktop) */}
        <div className="hidden lg:block lg:sticky lg:top-4">
          <OverlayPreview
            overlay={overlay}
            selectedRatio={selectedRatio}
            onRatioChange={setSelectedRatio}
          />
        </div>
      </div>
    </div>
  );
}
