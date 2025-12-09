"use client";

/**
 * CameraCapture Component
 *
 * Main container component for the camera capture flow.
 * Manages state machine for permission → camera → review flow.
 *
 * Architecture:
 * - CameraView: Owns video element, exposes takePhoto() via ref
 * - useCamera: Manages MediaStream lifecycle
 * - useLibraryPicker: Handles file input for library selection
 * - cameraReducer: Tracks UI state only (no camera hardware state)
 */

import { useReducer, useCallback, useRef, useEffect } from "react";
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
import { checkCameraPermission, cameraReducer, INITIAL_CAMERA_STATE } from "../lib";
import { useCamera } from "../hooks/useCamera";
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

  // Ref for CameraView to call takePhoto()
  const cameraViewRef = useRef<CameraViewRef>(null);

  // Camera hook - manages stream lifecycle
  const {
    videoRef,
    facing,
    startCamera,
    stopCamera,
    switchCamera,
    hasMultipleCameras,
  } = useCamera({
    initialFacing,
    onError: (error) => {
      onError?.(error);
      dispatch({ type: "PERMISSION_DENIED", error });
    },
  });

  // Library picker hook - manages file input
  const { fileInputRef, openPicker, handleFileChange } = useLibraryPicker({
    onSelect: (photo) => {
      onPhoto?.(photo);
      dispatch({ type: "PHOTO_CAPTURED", photo });
    },
    onError,
  });

  /**
   * Get target camera facing based on configuration
   * Consolidates the repeated logic from before
   */
  const getTargetFacing = useCallback(
    (override?: CameraFacing): CameraFacing =>
      cameraFacing === "both"
        ? (override ?? initialFacing)
        : (cameraFacing as CameraFacing),
    [cameraFacing, initialFacing]
  );

  /**
   * Unified camera initialization
   * Used by permission request, auto-start, and retake
   */
  const initializeCamera = useCallback(
    async (targetFacing: CameraFacing): Promise<boolean> => {
      const stream = await startCamera(targetFacing);
      if (stream) {
        dispatch({ type: "PERMISSION_GRANTED" });
        return true;
      }
      return false;
    },
    [startCamera]
  );

  // Handle permission request
  const handleRequestPermission = useCallback(async () => {
    await initializeCamera(getTargetFacing());
  }, [initializeCamera, getTargetFacing]);

  // Check permission on mount and auto-start camera if already granted
  useEffect(() => {
    if (state.status !== "checking-permission") return;

    async function checkAndStartCamera() {
      const permissionStatus = await checkCameraPermission();

      // Permissions API not available or permission not granted
      if (permissionStatus !== "granted") {
        dispatch({ type: "SHOW_PERMISSION_PROMPT" });
        return;
      }

      // Permission granted, try to auto-start camera
      const success = await initializeCamera(getTargetFacing());
      if (!success) {
        dispatch({ type: "SHOW_PERMISSION_PROMPT" });
      }
    }

    checkAndStartCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.status]);

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

  // Handle camera flip
  const handleFlipCamera = useCallback(async () => {
    await switchCamera();
    // No dispatch needed - useCamera hook manages facing state internally
    // UI re-renders via the `facing` value from useCamera
  }, [switchCamera]);

  // Handle retake
  const handleRetake = useCallback(async () => {
    onRetake?.();

    // Try to restart camera with current facing (or config-determined facing)
    const targetFacing = getTargetFacing(facing);
    const success = await initializeCamera(targetFacing);

    if (!success) {
      dispatch({ type: "RESET" });
    }
  }, [onRetake, initializeCamera, getTargetFacing, facing]);

  // Handle photo confirm
  const handleConfirm = useCallback(() => {
    if (state.status === "photo-review") {
      onSubmit(state.photo);
    }
  }, [state, onSubmit]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Determine what controls to show
  const showFlipButton =
    cameraFacing === "both" &&
    hasMultipleCameras &&
    state.status === "camera-active";
  const showLibraryButton = enableLibrary;

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

      {/* Checking permission state - show loading */}
      {state.status === "checking-permission" && (
        <div className="flex flex-col items-center justify-center gap-4 h-full bg-black">
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

      {/* Camera active state */}
      {state.status === "camera-active" && (
        <div className="flex flex-col h-full">
          <div className="flex-1 relative">
            <CameraView
              ref={cameraViewRef}
              videoRef={videoRef}
              facing={facing}
              aspectRatio={aspectRatio}
            />
          </div>
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
