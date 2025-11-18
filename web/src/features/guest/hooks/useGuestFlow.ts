"use client";

import { useReducer, useEffect, useRef } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { Session } from "@/lib/types/firestore";
import {
  startSessionAction,
  saveCaptureAction,
  triggerTransformAction,
} from "@/lib/actions/sessions";

type GuestState =
  | { step: "greeting" }
  | { step: "camera_permission_error" }
  | { step: "ready_to_capture"; stream: MediaStream }
  | { step: "countdown"; stream: MediaStream }
  | { step: "captured"; blob: Blob; sessionId: string }
  | { step: "uploading"; sessionId: string }
  | { step: "transforming"; sessionId: string }
  | { step: "review_ready"; session: Session }
  | { step: "error"; message: string }
  | { step: "share"; session: Session };

type GuestAction =
  | { type: "PERMISSION_GRANTED"; stream: MediaStream }
  | { type: "PERMISSION_DENIED" }
  | { type: "START_CAPTURE" }
  | { type: "SNAP"; blob: Blob }
  | { type: "UPLOAD_STARTED"; sessionId: string }
  | { type: "UPLOAD_COMPLETE"; sessionId: string }
  | { type: "TRANSFORM_COMPLETE"; session: Session }
  | { type: "TRANSFORM_ERROR"; message: string }
  | { type: "RETAKE" }
  | { type: "NEXT" }
  | { type: "CLOSE" };

function reducer(state: GuestState, action: GuestAction): GuestState {
  switch (action.type) {
    case "PERMISSION_GRANTED":
      return { step: "ready_to_capture", stream: action.stream };

    case "PERMISSION_DENIED":
      return { step: "camera_permission_error" };

    case "START_CAPTURE":
      if (state.step === "ready_to_capture") {
        return { step: "countdown", stream: state.stream };
      }
      return state;

    case "SNAP":
      if (state.step === "countdown") {
        // Stop the stream after capturing
        state.stream.getTracks().forEach((track) => track.stop());
      }
      // Need to create session first, then upload
      return state; // Handled by side effect

    case "UPLOAD_STARTED":
      return { step: "uploading", sessionId: action.sessionId };

    case "UPLOAD_COMPLETE":
      return { step: "transforming", sessionId: action.sessionId };

    case "TRANSFORM_COMPLETE":
      return { step: "review_ready", session: action.session };

    case "TRANSFORM_ERROR":
      return { step: "error", message: action.message };

    case "RETAKE":
      // Go back to greeting so user can re-request camera
      // (camera access requires user gesture)
      return { step: "greeting" };

    case "NEXT":
      if (state.step === "review_ready") {
        return { step: "share", session: state.session };
      }
      return state;

    case "CLOSE":
      return { step: "greeting" };

    default:
      return state;
  }
}

export function useGuestFlow(eventId: string) {
  const [state, dispatch] = useReducer(reducer, { step: "greeting" });
  const captureRef = useRef<Blob | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const isProcessingRef = useRef<boolean>(false);

  // Request camera - exposed as a function to be called on user action
  const requestCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });
      dispatch({ type: "PERMISSION_GRANTED", stream: mediaStream });
    } catch (err) {
      dispatch({ type: "PERMISSION_DENIED" });
    }
  };

  // Handle photo upload after capture
  const handleCapture = async (blob: Blob) => {
    // Guard: Prevent duplicate captures
    if (isProcessingRef.current) {
      console.log("[GuestFlow] Skipping duplicate capture - already processing");
      return;
    }

    isProcessingRef.current = true;
    captureRef.current = blob;

    try {
      // Start session
      const { sessionId } = await startSessionAction(eventId);
      dispatch({ type: "UPLOAD_STARTED", sessionId });

      // Upload photo
      const formData = new FormData();
      formData.append("eventId", eventId);
      formData.append("sessionId", sessionId);
      formData.append("photo", blob, "photo.jpg");

      await saveCaptureAction(formData);
      dispatch({ type: "UPLOAD_COMPLETE", sessionId });

      // Trigger AI transform
      // Note: We don't await here - the real-time subscription will notify us when done
      triggerTransformAction(eventId, sessionId).catch((error) => {
        console.error("Transform trigger failed:", error);
        // Error state will be handled by the real-time subscription
      });

      // Reset processing flag after upload completes
      // (Transform will continue in background via real-time subscription)
      isProcessingRef.current = false;
    } catch (error) {
      isProcessingRef.current = false;
      dispatch({
        type: "TRANSFORM_ERROR",
        message: error instanceof Error ? error.message : "Upload failed",
      });
    }
  };

  // Subscribe to session updates for real-time transform status
  useEffect(() => {
    // Clean up previous subscription
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }

    if (state.step === "transforming") {
      const sessionId = state.sessionId;
      const sessionRef = doc(db, `events/${eventId}/sessions/${sessionId}`);

      const unsubscribe = onSnapshot(
        sessionRef,
        (snapshot) => {
          if (!snapshot.exists()) return;

          const session = {
            id: snapshot.id,
            ...snapshot.data(),
          } as Session;

          if (session.state === "ready") {
            dispatch({ type: "TRANSFORM_COMPLETE", session });
          } else if (session.state === "error") {
            dispatch({
              type: "TRANSFORM_ERROR",
              message: session.error || "Transform failed",
            });
          }
        },
        (error) => {
          console.error("Session subscription error:", error);
          dispatch({
            type: "TRANSFORM_ERROR",
            message: "Failed to monitor transform status",
          });
        }
      );

      unsubscribeRef.current = unsubscribe;
    }

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.step, eventId]);

  // Clean up streams on unmount
  useEffect(() => {
    return () => {
      if (
        state.step === "ready_to_capture" ||
        state.step === "countdown"
      ) {
        state.stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [state]);

  return { state, dispatch, handleCapture, requestCamera };
}
