import { useEffect, useReducer } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { projectSchema } from "../schemas";
import type { Project } from "../types/project.types";

interface State {
  project: Project | null;
  loading: boolean;
  error: Error | null;
}

type Action =
  | { type: "START_LOADING" }
  | { type: "SET_PROJECT"; project: Project }
  | { type: "SET_ERROR"; error: Error }
  | { type: "RESET" };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "START_LOADING":
      return { ...state, loading: true, error: null };
    case "SET_PROJECT":
      return { project: action.project, loading: false, error: null };
    case "SET_ERROR":
      return { project: null, loading: false, error: action.error };
    case "RESET":
      return { project: null, loading: false, error: null };
    default:
      return state;
  }
}

/**
 * Hook to fetch a single project by ID with real-time subscription.
 *
 * @param projectId - The ID of the project to fetch
 * @returns Object containing the project data, loading state, and error
 */
export function useProject(projectId: string | null) {
  const [state, dispatch] = useReducer(reducer, {
    project: null,
    loading: Boolean(projectId),
    error: null,
  });

  useEffect(() => {
    // Early return without setting state if no projectId
    if (!projectId) {
      dispatch({ type: "RESET" });
      return;
    }

    let mounted = true;
    dispatch({ type: "START_LOADING" });

    // Real-time subscription using Client SDK
    const projectRef = doc(db, "projects", projectId);
    const unsubscribe = onSnapshot(
      projectRef,
      (snapshot) => {
        if (!mounted) return;
        if (snapshot.exists()) {
          try {
            const projectData = projectSchema.parse({
              id: snapshot.id,
              ...snapshot.data(),
            });
            dispatch({ type: "SET_PROJECT", project: projectData });
          } catch (err) {
            dispatch({
              type: "SET_ERROR",
              error: err instanceof Error ? err : new Error("Validation error"),
            });
          }
        } else {
          dispatch({ type: "SET_ERROR", error: new Error("Project not found") });
        }
      },
      (err) => {
        if (!mounted) return;
        dispatch({
          type: "SET_ERROR",
          error: err instanceof Error ? err : new Error("Failed to fetch project"),
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
