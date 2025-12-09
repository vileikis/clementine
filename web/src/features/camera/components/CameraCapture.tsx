"use client";

/**
 * CameraCapture Component
 *
 * Main container component for the camera capture flow.
 * Manages state machine for permission → camera → review flow.
 */

import { useReducer, useCallback, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import type {
  CameraState,
  CameraAction,
  CameraFacing,
  CameraFacingConfig,
  CapturedPhoto,
  CameraCaptureError,
  CameraCaptureLabels,
  AspectRatio,
} from "../types";

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
  /** Show camera capture option */
  enableCamera?: boolean;
  /** Show library selection option */
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
import { DEFAULT_LABELS } from "../constants";
import { checkCameraPermission } from "../lib";
import { useCamera } from "../hooks/useCamera";
import { usePhotoCapture } from "../hooks/usePhotoCapture";
import { PermissionPrompt } from "./PermissionPrompt";
import { CameraView } from "./CameraView";
import { CameraControls } from "./CameraControls";
import { PhotoReview } from "./PhotoReview";
import { ErrorState } from "./ErrorState";

/**
 * State machine reducer for camera flow
 */
function cameraReducer(state: CameraState, action: CameraAction): CameraState {
  switch (action.type) {
    case "SHOW_PERMISSION_PROMPT":
      return { status: "permission-prompt" };

    case "PERMISSION_GRANTED":
      return {
        status: "camera-active",
        stream: action.stream,
        facing: action.facing,
      };

    case "PERMISSION_DENIED":
      return {
        status: "error",
        error: action.error,
      };

    case "PHOTO_CAPTURED":
      return {
        status: "photo-review",
        photo: action.photo,
      };

    case "RETAKE":
      // Return to camera active - the handler will restart the camera
      // Since permission was already granted, we go directly to camera-active
      if (state.status === "photo-review") {
        return {
          status: "camera-active",
          stream: null, // Will be set by handleRetake
          facing: action.facing ?? "user",
        };
      }
      return state;

    case "FLIP_CAMERA":
      return {
        status: "camera-active",
        stream: action.stream,
        facing: action.facing,
      };

    case "ERROR":
      return {
        status: "error",
        error: action.error,
      };

    case "LIBRARY_ONLY":
      return { status: "library-only" };

    case "RESET":
      return { status: "permission-prompt" };

    default:
      return state;
  }
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
  enableCamera = true,
  enableLibrary = true,
  cameraFacing = "both",
  initialFacing = "user",
  aspectRatio,
  className,
  labels = {},
}: CameraCaptureProps) {
  const mergedLabels = { ...DEFAULT_LABELS, ...labels };

  // Determine initial state based on props
  const getInitialState = (): CameraState => {
    if (!enableCamera && enableLibrary) {
      return { status: "library-only" };
    }
    // Start in checking state - will transition after permission check
    return { status: "checking-permission" };
  };

  const [state, dispatch] = useReducer(cameraReducer, getInitialState());

  // Refs for maintaining state across renders
  const currentStreamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoElementRef = useRef<HTMLVideoElement | null>(null);

  // Camera hook
  const {
    videoRef: cameraVideoRef,
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

  // Combined video ref - stores element locally and passes to camera hook
  const videoRef = useCallback(
    (element: HTMLVideoElement | null) => {
      videoElementRef.current = element;
      cameraVideoRef(element);
    },
    [cameraVideoRef]
  );

  // Photo capture hook
  const { capturePhoto, processLibraryFile } = usePhotoCapture({
    onCapture: (photo) => {
      onPhoto?.(photo);
      dispatch({ type: "PHOTO_CAPTURED", photo });
    },
    onError: (error) => {
      onError?.(error);
    },
  });

  // Handle permission request
  const handleRequestPermission = useCallback(async () => {
    const targetFacing =
      cameraFacing === "both" ? initialFacing : (cameraFacing as CameraFacing);
    const stream = await startCamera(targetFacing);

    if (stream) {
      currentStreamRef.current = stream;
      dispatch({
        type: "PERMISSION_GRANTED",
        stream,
        facing: targetFacing,
      });
    }
  }, [startCamera, cameraFacing, initialFacing]);

  // Check permission on mount and auto-start camera if already granted
  useEffect(() => {
    if (!enableCamera) return;
    if (state.status !== "checking-permission") return;

    async function checkAndStartCamera() {
      const permissionStatus = await checkCameraPermission();

      // Permissions API not available or permission not granted
      if (permissionStatus !== "granted") {
        dispatch({ type: "SHOW_PERMISSION_PROMPT" });
        return;
      }

      // Permission granted, try to auto-start camera
      const targetFacing =
        cameraFacing === "both"
          ? initialFacing
          : (cameraFacing as CameraFacing);
      const stream = await startCamera(targetFacing);

      if (!stream) {
        dispatch({ type: "SHOW_PERMISSION_PROMPT" });
        return;
      }

      currentStreamRef.current = stream;
      dispatch({
        type: "PERMISSION_GRANTED",
        stream,
        facing: targetFacing,
      });
    }

    checkAndStartCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enableCamera, state.status]);

  // Handle photo capture
  const handleCapture = useCallback(async () => {
    if (!videoElementRef.current) return;
    await capturePhoto(videoElementRef.current, facing);
  }, [capturePhoto, facing]);

  // Handle camera flip
  const handleFlipCamera = useCallback(async () => {
    const stream = await switchCamera();
    if (stream) {
      currentStreamRef.current = stream;
      const newFacing = facing === "user" ? "environment" : "user";
      dispatch({ type: "FLIP_CAMERA", stream, facing: newFacing });
    }
  }, [switchCamera, facing]);

  // Handle retake
  const handleRetake = useCallback(async () => {
    onRetake?.();

    // Try to restart camera
    const targetFacing =
      cameraFacing === "both" ? facing : (cameraFacing as CameraFacing);
    const stream = await startCamera(targetFacing);

    if (stream) {
      currentStreamRef.current = stream;
      dispatch({
        type: "PERMISSION_GRANTED",
        stream,
        facing: targetFacing,
      });
    } else {
      dispatch({ type: "RESET" });
    }
  }, [onRetake, startCamera, cameraFacing, facing]);

  // Handle photo confirm
  const handleConfirm = useCallback(() => {
    if (state.status === "photo-review") {
      onSubmit(state.photo);
    }
  }, [state, onSubmit]);

  // Handle library file selection
  const handleOpenLibrary = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      await processLibraryFile(file);

      // Reset input so same file can be selected again
      event.target.value = "";
    },
    [processLibraryFile]
  );

  // Cleanup on unmount - use empty deps to only run on actual unmount
  // stopCamera uses streamRef internally so it will clean up the correct stream
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
          onOpenLibrary={enableLibrary ? handleOpenLibrary : undefined}
          showLibraryOption={enableLibrary}
        />
      )}

      {/* Camera active state */}
      {state.status === "camera-active" && (
        <div className="flex flex-col h-full">
          <div className="flex-1 relative">
            <CameraView
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
            onOpenLibrary={handleOpenLibrary}
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

      {/* Library only state - show library picker directly */}
      {state.status === "library-only" && (
        <PermissionPrompt
          labels={mergedLabels}
          onRequestPermission={handleOpenLibrary}
          showLibraryOption={false}
        />
      )}

      {/* Error state */}
      {state.status === "error" && (
        <ErrorState
          error={state.error}
          labels={mergedLabels}
          showRetry={enableCamera}
          showLibraryFallback={enableLibrary}
          onRetry={handleRequestPermission}
          onOpenLibrary={handleOpenLibrary}
        />
      )}
    </div>
  );
}
