"use client";

/**
 * PermissionPrompt Component
 *
 * Displays explanation and button to request camera permission.
 * Shows different UI for undetermined vs denied permission states.
 */

import { Camera, CameraOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CameraCaptureLabels, PermissionState } from "../types";
import { DEFAULT_LABELS } from "../constants";

interface PermissionPromptProps {
  /** Custom labels for i18n */
  labels?: CameraCaptureLabels;
  /** Current permission status */
  permissionStatus: PermissionState;
  /** Called when user taps Allow Camera button */
  onRequestPermission: () => void;
}

/**
 * Detect if running in a mobile browser
 */
function isMobileBrowser(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

/**
 * Get instructions for enabling camera based on platform
 */
function getDeniedInstructions(): string {
  if (isMobileBrowser()) {
    return "To use the camera, please go to your device settings, find your browser app, and enable camera access. Then return here and refresh the page.";
  }
  return "To use the camera, click the camera icon in your browser's address bar or go to site settings and allow camera access. Then refresh this page.";
}

/**
 * Permission prompt for undetermined state - user hasn't been asked yet
 */
function UndeterminedPrompt({
  labels,
  onRequestPermission,
}: {
  labels: Required<CameraCaptureLabels>;
  onRequestPermission: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center h-full p-6 text-center bg-black">
      {/* Camera icon */}
      <div className="mb-6 p-4 rounded-full bg-white/10">
        <Camera className="size-12 text-white" aria-hidden="true" />
      </div>

      {/* Header */}
      <h2 className="text-xl font-semibold mb-2 text-white">
        Allow camera access
      </h2>

      {/* Description */}
      <p className="text-white/70 mb-6 max-w-xs">
        {labels.permissionDescription}
      </p>

      {/* Action button - white bg, black text like PhotoReview */}
      <div className="w-full max-w-xs">
        <Button
          onClick={onRequestPermission}
          className="w-full min-h-[44px] bg-white text-black hover:bg-white/90"
          aria-label={labels.allowCamera}
        >
          {labels.allowCamera}
        </Button>
      </div>
    </div>
  );
}

/**
 * Permission prompt for denied state - user has blocked camera access
 */
function DeniedPrompt({
  labels,
}: {
  labels: Required<CameraCaptureLabels>;
}) {
  const instructions = getDeniedInstructions();

  return (
    <div className="flex flex-col items-center justify-center h-full p-6 text-center bg-black">
      {/* Camera off icon */}
      <div className="mb-6 p-4 rounded-full bg-white/10">
        <CameraOff className="size-12 text-white" aria-hidden="true" />
      </div>

      {/* Header */}
      <h2 className="text-xl font-semibold mb-2 text-white">
        Could not access camera
      </h2>

      {/* Description */}
      <p className="text-white/70 max-w-xs">
        {instructions}
      </p>
    </div>
  );
}

/**
 * Permission prompt UI - shows different content based on permission state
 */
export function PermissionPrompt({
  labels = {},
  permissionStatus,
  onRequestPermission,
}: PermissionPromptProps) {
  const mergedLabels = { ...DEFAULT_LABELS, ...labels };

  if (permissionStatus === "denied") {
    return <DeniedPrompt labels={mergedLabels} />;
  }

  return (
    <UndeterminedPrompt
      labels={mergedLabels}
      onRequestPermission={onRequestPermission}
    />
  );
}
