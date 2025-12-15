"use client";

import { useReducer, useTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { FrameCard } from "./FrameCard";
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
  | { type: "SET_FRAME"; ratio: OverlayAspectRatio; url: string }
  | { type: "REMOVE_FRAME"; ratio: OverlayAspectRatio }
  | { type: "ROLLBACK"; ratio: OverlayAspectRatio; previousState: { enabled: boolean; frameUrl: string | null } };

// Reducer function
function overlayReducer(state: EventOverlayConfig, action: OverlayAction): EventOverlayConfig {
  switch (action.type) {
    case "SET_FRAME":
      // When setting a frame, automatically enable it
      return {
        ...state,
        [action.ratio]: {
          enabled: true,
          frameUrl: action.url,
        },
      };
    case "REMOVE_FRAME":
      return {
        ...state,
        [action.ratio]: {
          enabled: false,
          frameUrl: null,
        },
      };
    case "ROLLBACK":
      // Rollback to previous state on error
      return {
        ...state,
        [action.ratio]: action.previousState,
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
  const router = useRouter();

  // Initialize overlay state with reducer
  const [overlay, dispatch] = useReducer(
    overlayReducer,
    event.overlay || { square: { enabled: false, frameUrl: null }, story: { enabled: false, frameUrl: null } }
  );

  /**
   * Handle frame upload - automatically enable and save to server
   */
  const handleFrameUpload = (ratio: OverlayAspectRatio, url: string) => {
    if (isPending) return;

    // Capture previous state for rollback
    const previousState = overlay[ratio] ?? { enabled: false, frameUrl: null };

    // Optimistic update
    dispatch({ type: "SET_FRAME", ratio, url });

    // Save to server
    startTransition(async () => {
      const result = await updateEventOverlayAction(projectId, event.id, {
        [ratio]: { frameUrl: url, enabled: true },
      });

      if (result.success) {
        toast.success(`${ratio === "square" ? "Square" : "Story"} frame uploaded`);
        router.refresh();
      } else {
        // Rollback on failure
        dispatch({ type: "ROLLBACK", ratio, previousState });
        toast.error(result.error?.message || "Failed to upload frame");
      }
    });
  };

  /**
   * Handle frame removal - save immediately to server
   */
  const handleRemove = (ratio: OverlayAspectRatio) => {
    if (isPending) return;

    // Capture previous state for rollback
    const previousState = overlay[ratio] ?? { enabled: false, frameUrl: null };

    // Optimistic update
    dispatch({ type: "REMOVE_FRAME", ratio });

    // Save to server
    startTransition(async () => {
      const result = await updateEventOverlayAction(projectId, event.id, {
        [ratio]: { frameUrl: null, enabled: false },
      });

      if (result.success) {
        toast.success("Frame removed");
        router.refresh();
      } else {
        // Rollback on failure
        dispatch({ type: "ROLLBACK", ratio, previousState });
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

      {/* Frame cards in a row with wrapping */}
      <div className="flex flex-wrap gap-6">
        <FrameCard
          ratio="square"
          frame={overlay.square ?? { enabled: false, frameUrl: null }}
          onFrameUpload={(url) => handleFrameUpload("square", url)}
          onRemove={() => handleRemove("square")}
          disabled={isPending}
        />
        <FrameCard
          ratio="story"
          frame={overlay.story ?? { enabled: false, frameUrl: null }}
          onFrameUpload={(url) => handleFrameUpload("story", url)}
          onRemove={() => handleRemove("story")}
          disabled={isPending}
        />
      </div>
    </div>
  );
}
