"use client";

/**
 * PermissionPrompt Component
 *
 * Displays explanation and button to request camera permission.
 * Follows best practice of user-initiated permission requests.
 */

import { Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CameraCaptureLabels } from "../types";
import { DEFAULT_LABELS } from "../constants";

interface PermissionPromptProps {
  /** Custom labels for i18n */
  labels?: CameraCaptureLabels;
  /** Whether permission is being requested */
  isLoading?: boolean;
  /** Called when user taps Allow Camera button */
  onRequestPermission: () => void;
  /** Called when user taps Choose from Library button */
  onOpenLibrary?: () => void;
  /** Whether to show library option */
  showLibraryOption?: boolean;
}

/**
 * Permission prompt UI with explanation and action button
 */
export function PermissionPrompt({
  labels = {},
  isLoading = false,
  onRequestPermission,
  onOpenLibrary,
  showLibraryOption = true,
}: PermissionPromptProps) {
  const mergedLabels = { ...DEFAULT_LABELS, ...labels };

  return (
    <div className="flex flex-col items-center justify-center h-full p-6 text-center">
      {/* Camera icon */}
      <div className="mb-6 p-4 rounded-full bg-muted">
        <Camera className="size-12 text-muted-foreground" aria-hidden="true" />
      </div>

      {/* Title */}
      <h2 className="text-xl font-semibold mb-2">
        {mergedLabels.permissionTitle}
      </h2>

      {/* Description */}
      <p className="text-muted-foreground mb-8 max-w-xs">
        {mergedLabels.permissionDescription}
      </p>

      {/* Action buttons */}
      <div className="flex flex-col gap-3 w-full max-w-xs">
        <Button
          onClick={onRequestPermission}
          disabled={isLoading}
          className="w-full min-h-[44px]"
          aria-label={mergedLabels.allowCamera}
        >
          {isLoading ? "Requesting..." : mergedLabels.allowCamera}
        </Button>

        {showLibraryOption && onOpenLibrary && (
          <Button
            variant="outline"
            onClick={onOpenLibrary}
            disabled={isLoading}
            className="w-full min-h-[44px]"
            aria-label={mergedLabels.openLibrary}
          >
            {mergedLabels.openLibrary}
          </Button>
        )}
      </div>
    </div>
  );
}
