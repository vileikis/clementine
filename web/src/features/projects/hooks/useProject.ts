import { useEffect, useState } from "react";
import { getProject } from "../repositories/projects.repository";
import type { Project } from "../types/project.types";

interface UseProjectOptions {
  subscribe?: boolean;
}

/**
 * Hook to fetch a single project by ID with optional real-time subscription.
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

    if (options.subscribe) {
      // Real-time subscription
      const unsubscribe = getProject(
        projectId,
        { subscribe: true },
        (updatedProject) => {
          setProject(updatedProject);
          setLoading(false);
        },
        (err) => {
          setError(err);
          setLoading(false);
        }
      );

      return () => {
        if (unsubscribe) unsubscribe();
      };
    } else {
      // One-time fetch
      getProject(projectId, { subscribe: false })
        .then((fetchedProject) => {
          setProject(fetchedProject);
          setLoading(false);
        })
        .catch((err) => {
          setError(err);
          setLoading(false);
        });
    }
  }, [projectId, options.subscribe]);

  return { project, loading, error };
}
