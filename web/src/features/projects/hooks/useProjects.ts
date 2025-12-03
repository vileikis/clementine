import { useEffect, useReducer } from "react";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { projectSchema } from "../schemas";
import type { Project } from "../types/project.types";

interface UseProjectsOptions {
  companyId?: string | null;
}

interface State {
  projects: Project[];
  loading: boolean;
  error: Error | null;
}

type Action =
  | { type: "START_LOADING" }
  | { type: "SET_PROJECTS"; projects: Project[] }
  | { type: "SET_ERROR"; error: Error };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "START_LOADING":
      return { ...state, loading: true, error: null };
    case "SET_PROJECTS":
      return { projects: action.projects, loading: false, error: null };
    case "SET_ERROR":
      return { projects: [], loading: false, error: action.error };
    default:
      return state;
  }
}

/**
 * Hook to fetch all projects for a company with real-time subscription.
 * Automatically filters out deleted projects (deletedAt == null).
 *
 * @param options - Filter options (companyId)
 * @returns Object containing projects list, loading state, and error
 */
export function useProjects(options: UseProjectsOptions = {}) {
  const [state, dispatch] = useReducer(reducer, {
    projects: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    let mounted = true;
    dispatch({ type: "START_LOADING" });

    // Build query
    const projectsRef = collection(db, "projects");

    // Filter out deleted projects - use "in" clause for non-deleted statuses
    let projectsQuery = query(
      projectsRef,
      where("status", "in", ["draft", "live", "archived"]),
      orderBy("updatedAt", "desc")
    );

    // Add company filter if provided
    if (options.companyId) {
      projectsQuery = query(
        projectsRef,
        where("companyId", "==", options.companyId),
        where("status", "in", ["draft", "live", "archived"]),
        orderBy("updatedAt", "desc")
      );
    }

    // Real-time subscription
    const unsubscribe = onSnapshot(
      projectsQuery,
      (snapshot) => {
        if (!mounted) return;
        try {
          const projectsList = snapshot.docs.map((doc) => {
            return projectSchema.parse({
              id: doc.id,
              ...doc.data(),
            });
          });
          dispatch({ type: "SET_PROJECTS", projects: projectsList });
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
          error: err instanceof Error ? err : new Error("Failed to fetch projects"),
        });
      }
    );

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [options.companyId]);

  return state;
}
