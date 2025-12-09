/**
 * Camera State Reducer
 *
 * Simple state machine for camera UI flow (after permission is granted):
 * camera-active ↔ photo-review
 *       ↓
 *     error
 *
 * Note: Permission states are handled by useCameraPermission hook.
 */

import type { CameraState, CameraAction } from "../types";

/**
 * Initial state - camera active (only used when permission granted)
 */
export const INITIAL_CAMERA_STATE: CameraState = { status: "camera-active" };

/**
 * State machine reducer for camera UI flow
 */
export function cameraReducer(
  state: CameraState,
  action: CameraAction
): CameraState {
  switch (action.type) {
    case "CAMERA_READY":
      return { status: "camera-active" };

    case "PHOTO_CAPTURED":
      return {
        status: "photo-review",
        photo: action.photo,
      };

    case "RETAKE":
      return { status: "camera-active" };

    case "ERROR":
      return {
        status: "error",
        error: action.error,
      };

    default:
      return state;
  }
}
