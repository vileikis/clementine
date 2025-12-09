"use client";

/**
 * CameraCapture Component
 *
 * Main container component for the camera capture flow.
 * Manages state machine for permission → camera → review flow.
 *
 * Architecture:
 * - CameraView: Self-contained camera (auto-starts on mount, stops on unmount)
 * - useLibraryPicker: Handles file input for library selection
 * - cameraReducer: Tracks UI state only
 */

import { useReducer, useCallback, useRef, useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import type {
  CameraFacing,
  CameraFacingConfig,
  CapturedPhoto,
  CameraCaptureError,
  CameraCaptureLabels,
  AspectRatio,
} from "../types";
import { DEFAULT_LABELS } from "../constants";
import { cameraReducer, INITIAL_CAMERA_STATE } from "../lib";
import { useLibraryPicker } from "../hooks/useLibraryPicker";
import { PermissionPrompt } from "./PermissionPrompt";
import { CameraView, type CameraViewRef } from "./CameraView";
import { CameraControls } from "./CameraControls";
import { PhotoReview } from "./PhotoReview";
import { ErrorState } from "./ErrorState";

export interface CameraCaptureProps {
  /** Called when photo taken/selected (enters review) */
  onPhoto?: (photo: CapturedPhoto) => void;
  /** Called when user confirms photo (required) */
  onSubmit: (photo: CapturedPhoto) => void;
  /** Called when user taps retake */
  onRetake?: () => void;
  /** Called when user wants to exit */
  onCancel?: () => void;
  /** Called on any error */
  onError?: (error: CameraCaptureError) => void;
  /** Show library selection option as secondary input method */
  enableLibrary?: boolean;
  /** Available camera(s) - "user", "environment", or "both" */
  cameraFacing?: CameraFacingConfig;
  /** Starting camera when cameraFacing="both" */
  initialFacing?: CameraFacing;
  /** Aspect ratio guide overlay */
  aspectRatio?: AspectRatio;
  /** Container CSS class */
  className?: string;
  /** Custom labels for i18n */
  labels?: CameraCaptureLabels;
}

/**
 * CameraCapture - Main camera capture component
 *
 * Provides complete photo capture flow with:
 * - Permission request UI
 * - Live camera preview
 * - Photo capture
 * - Photo review with confirm/retake
 *
 * @example
 * ```tsx
 * <CameraCapture
 *   onSubmit={async (photo) => {
 *     const url = await uploadToStorage(photo.file);
 *     URL.revokeObjectURL(photo.previewUrl);
 *     console.log('Uploaded:', url);
 *   }}
 *   enableLibrary={true}
 *   aspectRatio="3:4"
 * />
 * ```
 */
export function CameraCapture({
  onPhoto,
  onSubmit,
  onRetake,
  // onCancel is reserved for future use
  onError,
  enableLibrary = true,
  cameraFacing = "both",
  initialFacing = "user",
  aspectRatio,
  className,
  labels = {},
}: CameraCaptureProps) {
  const mergedLabels = { ...DEFAULT_LABELS, ...labels };

  const [state, dispatch] = useReducer(cameraReducer, INITIAL_CAMERA_STATE);

  // Ref for CameraView - used for takePhoto and switchCamera
  const cameraViewRef = useRef<CameraViewRef>(null);

  // Track hasMultipleCameras in state (updated via onReady callback)
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);

  // Library picker hook - manages file input
  const { fileInputRef, openPicker, handleFileChange } = useLibraryPicker({
    onSelect: (photo) => {
      onPhoto?.(photo);
      dispatch({ type: "PHOTO_CAPTURED", photo });
    },
    onError,
  });

  /**
   * Target camera facing based on configuration
   */
  const targetFacing = useMemo<CameraFacing>(
    () => (cameraFacing === "both" ? initialFacing : cameraFacing),
    [cameraFacing, initialFacing]
  );

  /**
   * Handle camera ready - transition to camera-active state
   * Called when CameraView successfully starts streaming
   */
  const handleCameraReady = useCallback(() => {
    // Update hasMultipleCameras from ref (safe in callback)
    setHasMultipleCameras(cameraViewRef.current?.hasMultipleCameras ?? false);

    // Only transition if we're in checking-permission (initial auto-start)
    // or permission-prompt (user clicked allow)
    if (state.status === "checking-permission" || state.status === "permission-prompt") {
      dispatch({ type: "PERMISSION_GRANTED" });
    }
  }, [state.status]);

  /**
   * Handle camera errors
   */
  const handleCameraError = useCallback(
    (error: CameraCaptureError) => {
      onError?.(error);
      dispatch({ type: "PERMISSION_DENIED", error });
    },
    [onError]
  );

  // Handle permission request - just transition state, CameraView auto-starts
  const handleRequestPermission = useCallback(() => {
    // Transition to a state where CameraView will be mounted
    // CameraView auto-starts on mount and calls onReady when successful
    dispatch({ type: "PERMISSION_GRANTED" });
  }, []);

  // Handle photo capture via CameraView ref
  const handleCapture = useCallback(async () => {
    const photo = await cameraViewRef.current?.takePhoto();
    if (photo) {
      onPhoto?.(photo);
      dispatch({ type: "PHOTO_CAPTURED", photo });
    } else {
      onError?.({
        code: "CAPTURE_FAILED",
        message: "Failed to capture photo",
      });
    }
  }, [onPhoto, onError]);

  // Handle camera flip via CameraView ref
  const handleFlipCamera = useCallback(async () => {
    await cameraViewRef.current?.switchCamera();
  }, []);

  // Handle retake - go back to camera-active (CameraView will remount and auto-start)
  const handleRetake = useCallback(() => {
    onRetake?.();
    dispatch({ type: "RETAKE" });
  }, [onRetake]);

  // Handle photo confirm
  const handleConfirm = useCallback(() => {
    if (state.status === "photo-review") {
      onSubmit(state.photo);
    }
  }, [state, onSubmit]);

  // Determine what controls to show
  const showFlipButton =
    cameraFacing === "both" &&
    hasMultipleCameras &&
    state.status === "camera-active";
  const showLibraryButton = enableLibrary;

  // Should CameraView be mounted?
  // Mount during: checking-permission (to auto-start), camera-active (to show)
  // Unmount during: permission-prompt (waiting for user), photo-review, error
  const shouldMountCamera =
    state.status === "checking-permission" || state.status === "camera-active";

  return (
    <div className={cn("relative w-full h-full overflow-hidden", className)}>
      {/* Hidden file input for library selection */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
        aria-hidden="true"
      />

      {/* CameraView - mounted during checking-permission and camera-active */}
      {shouldMountCamera && (
        <div
          className={cn(
            "absolute inset-0",
            state.status === "checking-permission" && "invisible"
          )}
        >
          <CameraView
            ref={cameraViewRef}
            facing={targetFacing}
            aspectRatio={aspectRatio}
            onReady={handleCameraReady}
            onError={handleCameraError}
          />
        </div>
      )}

      {/* Checking permission state - show loading overlay */}
      {state.status === "checking-permission" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black z-10">
          <div className="size-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          <p className="text-white/70 text-sm">Preparing camera...</p>
        </div>
      )}

      {/* Permission prompt state */}
      {state.status === "permission-prompt" && (
        <PermissionPrompt
          labels={mergedLabels}
          onRequestPermission={handleRequestPermission}
          onOpenLibrary={enableLibrary ? openPicker : undefined}
          showLibraryOption={enableLibrary}
        />
      )}

      {/* Camera active state - show controls */}
      {state.status === "camera-active" && (
        <div className="absolute inset-0 flex flex-col">
          <div className="flex-1" />
          <CameraControls
            labels={mergedLabels}
            showFlipButton={showFlipButton}
            showLibraryButton={showLibraryButton}
            onCapture={handleCapture}
            onFlipCamera={handleFlipCamera}
            onOpenLibrary={openPicker}
          />
        </div>
      )}

      {/* Photo review state */}
      {state.status === "photo-review" && (
        <PhotoReview
          photo={state.photo}
          labels={mergedLabels}
          onConfirm={handleConfirm}
          onRetake={handleRetake}
        />
      )}

      {/* Error state */}
      {state.status === "error" && (
        <ErrorState
          error={state.error}
          labels={mergedLabels}
          showRetry
          showLibraryFallback={enableLibrary}
          onRetry={handleRequestPermission}
          onOpenLibrary={openPicker}
        />
      )}
    </div>
  );
}
