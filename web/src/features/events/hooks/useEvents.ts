import { useEffect, useReducer } from "react";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { eventSchema } from "../schemas";
import type { Event } from "../types/event.types";

interface State {
  events: Event[];
  loading: boolean;
  error: Error | null;
}

type Action =
  | { type: "START_LOADING" }
  | { type: "SET_EVENTS"; events: Event[] }
  | { type: "SET_ERROR"; error: Error };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "START_LOADING":
      return { ...state, loading: true, error: null };
    case "SET_EVENTS":
      return { events: action.events, loading: false, error: null };
    case "SET_ERROR":
      return { events: [], loading: false, error: action.error };
    default:
      return state;
  }
}

/**
 * Hook to fetch all non-deleted events for a project with real-time subscription.
 *
 * @param projectId - The ID of the project to fetch events for
 * @returns Object containing events list, loading state, and error
 */
export function useEvents(projectId: string | null) {
  const [state, dispatch] = useReducer(reducer, {
    events: [],
    loading: Boolean(projectId),
    error: null,
  });

  useEffect(() => {
    // Early return without setting state if no projectId
    if (!projectId) {
      dispatch({ type: "SET_EVENTS", events: [] });
      return;
    }

    let mounted = true;
    dispatch({ type: "START_LOADING" });

    // Build query for events subcollection
    const eventsRef = collection(db, "projects", projectId, "events");

    // Query: non-deleted events, sorted by createdAt DESC
    const eventsQuery = query(
      eventsRef,
      where("deletedAt", "==", null),
      orderBy("createdAt", "desc")
    );

    // Real-time subscription
    const unsubscribe = onSnapshot(
      eventsQuery,
      (snapshot) => {
        if (!mounted) return;
        try {
          const eventsList: Event[] = [];

          for (const doc of snapshot.docs) {
            try {
              console.log("----doc.data()", doc.id);
              const parsed = eventSchema.parse({
                id: doc.id,
                ...doc.data(),
              });
              eventsList.push(parsed as Event);
            } catch (error) {
              console.log("----error", error);
              // Skip invalid documents
            }
          }

          dispatch({ type: "SET_EVENTS", events: eventsList });
        } catch (err) {
          dispatch({
            type: "SET_ERROR",
            error: err instanceof Error ? err : new Error("Validation error"),
          });
        }
      },
      (err) => {
        if (!mounted) return;
        dispatch({
          type: "SET_ERROR",
          error: err instanceof Error ? err : new Error("Failed to fetch events"),
        });
      }
    );

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [projectId]);

  return state;
}
