/**
 * Camera State Reducer
 *
 * State machine for camera capture flow:
 * checking-permission → permission-prompt → camera-active ↔ photo-review
 *                                              ↓
 *                                            error
 */

import type { CameraState, CameraAction } from "../types";

/**
 * Initial state - always starts in checking-permission,
 * then transitions based on permission status
 */
export const INITIAL_CAMERA_STATE: CameraState = { status: "checking-permission" };

/**
 * State machine reducer for camera flow
 */
export function cameraReducer(
  state: CameraState,
  action: CameraAction
): CameraState {
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

    case "RESET":
      return { status: "permission-prompt" };

    default:
      return state;
  }
}
