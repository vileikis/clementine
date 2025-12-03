import { useEffect, useReducer } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { eventSchema } from "../schemas";
import type { Event } from "../types/event.types";

interface State {
  event: Event | null;
  loading: boolean;
  error: Error | null;
}

type Action =
  | { type: "START_LOADING" }
  | { type: "SET_EVENT"; event: Event }
  | { type: "SET_ERROR"; error: Error }
  | { type: "RESET" };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "START_LOADING":
      return { ...state, loading: true, error: null };
    case "SET_EVENT":
      return { event: action.event, loading: false, error: null };
    case "SET_ERROR":
      return { event: null, loading: false, error: action.error };
    case "RESET":
      return { event: null, loading: false, error: null };
    default:
      return state;
  }
}

/**
 * Hook to fetch a single event by ID with real-time subscription.
 *
 * @param projectId - The ID of the parent project
 * @param eventId - The ID of the event to fetch
 * @returns Object containing the event data, loading state, and error
 */
export function useEvent(projectId: string | null, eventId: string | null) {
  const [state, dispatch] = useReducer(reducer, {
    event: null,
    loading: Boolean(projectId && eventId),
    error: null,
  });

  useEffect(() => {
    // Early return without setting state if no IDs
    if (!projectId || !eventId) {
      dispatch({ type: "RESET" });
      return;
    }

    let mounted = true;
    dispatch({ type: "START_LOADING" });

    // Real-time subscription using Client SDK
    const eventRef = doc(db, "projects", projectId, "events", eventId);
    const unsubscribe = onSnapshot(
      eventRef,
      (snapshot) => {
        if (!mounted) return;
        if (snapshot.exists()) {
          try {
            const data = snapshot.data();

            // Check for soft delete
            if (data.deletedAt) {
              dispatch({
                type: "SET_ERROR",
                error: new Error("Event has been deleted"),
              });
              return;
            }

            const eventData = eventSchema.parse({
              id: snapshot.id,
              ...data,
            });
            dispatch({ type: "SET_EVENT", event: eventData });
          } catch (err) {
            dispatch({
              type: "SET_ERROR",
              error: err instanceof Error ? err : new Error("Validation error"),
            });
          }
        } else {
          dispatch({
            type: "SET_ERROR",
            error: new Error("Event not found"),
          });
        }
      },
      (err) => {
        if (!mounted) return;
        dispatch({
          type: "SET_ERROR",
          error: err instanceof Error ? err : new Error("Failed to fetch event"),
        });
      }
    );

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [projectId, eventId]);

  return state;
}
