"use client";

/**
 * PermissionPrompt Component
 *
 * Displays explanation and button to request camera permission.
 * Follows best practice of user-initiated permission requests.
 */

import { Camera, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CameraCaptureLabels, CameraCaptureError } from "../types";
import { DEFAULT_LABELS } from "../constants";

interface PermissionPromptProps {
  /** Custom labels for i18n */
  labels?: CameraCaptureLabels;
  /** Whether permission is being requested */
  isRequesting?: boolean;
  /** Called when user taps Allow Camera button */
  onRequestPermission: () => void;
  /** Called when user taps Choose from Library button */
  onOpenLibrary?: () => void;
  /** Whether to show library option */
  showLibraryOption?: boolean;
  /** Error from previous permission attempt */
  error?: CameraCaptureError | null;
}

/**
 * Permission prompt UI with explanation and action button
 */
export function PermissionPrompt({
  labels = {},
  isRequesting = false,
  onRequestPermission,
  onOpenLibrary,
  showLibraryOption = true,
  error,
}: PermissionPromptProps) {
  const mergedLabels = { ...DEFAULT_LABELS, ...labels };

  const hasError = error && error.code === "PERMISSION_DENIED";

  return (
    <div className="flex flex-col items-center justify-center h-full p-6 text-center">
      {/* Camera icon */}
      <div className="mb-6 p-4 rounded-full bg-muted">
        <Camera className="size-12 text-muted-foreground" aria-hidden="true" />
      </div>

      {/* Title */}
      <h2 className="text-xl font-semibold mb-2">
        {hasError ? mergedLabels.permissionDenied : mergedLabels.permissionTitle}
      </h2>

      {/* Description */}
      <p className="text-muted-foreground mb-4 max-w-xs">
        {hasError
          ? mergedLabels.permissionDeniedHint
          : mergedLabels.permissionDescription}
      </p>

      {/* Error message */}
      {hasError && (
        <div className="flex items-center gap-2 text-destructive text-sm mb-4">
          <AlertCircle className="size-4" />
          <span>{error.message}</span>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-col gap-3 w-full max-w-xs mt-4">
        <Button
          onClick={onRequestPermission}
          disabled={isRequesting}
          className="w-full min-h-[44px]"
          aria-label={mergedLabels.allowCamera}
        >
          {isRequesting ? "Requesting..." : hasError ? "Try Again" : mergedLabels.allowCamera}
        </Button>

        {showLibraryOption && onOpenLibrary && (
          <Button
            variant="outline"
            onClick={onOpenLibrary}
            disabled={isRequesting}
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
