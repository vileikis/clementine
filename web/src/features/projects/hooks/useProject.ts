import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { projectSchema } from "../schemas";
import type { Project } from "../types/project.types";

interface UseProjectOptions {
  subscribe?: boolean;
}

/**
 * Hook to fetch a single project by ID with real-time subscription.
 *
 * @param projectId - The ID of the project to fetch
 * @param options - Options for the hook (subscribe for real-time updates)
 * @returns Object containing the project data, loading state, and error
 */
export function useProject(
  projectId: string | null,
  options: UseProjectOptions = { subscribe: true }
) {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!projectId) {
      setProject(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Real-time subscription using Client SDK
    const projectRef = doc(db, "projects", projectId);
    const unsubscribe = onSnapshot(
      projectRef,
      (snapshot) => {
        if (snapshot.exists()) {
          try {
            const projectData = projectSchema.parse({
              id: snapshot.id,
              ...snapshot.data(),
            });
            setProject(projectData);
            setError(null);
          } catch (err) {
            setError(err instanceof Error ? err : new Error("Validation error"));
            setProject(null);
          }
        } else {
          setProject(null);
          setError(new Error("Project not found"));
        }
        setLoading(false);
      },
      (err) => {
        setError(err instanceof Error ? err : new Error("Failed to fetch project"));
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [projectId]);

  return { project, loading, error };
}
