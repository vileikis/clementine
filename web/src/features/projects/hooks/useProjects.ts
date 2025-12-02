import { useEffect, useState } from "react";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { projectSchema } from "../schemas";
import type { Project } from "../types/project.types";

interface UseProjectsOptions {
  companyId?: string | null;
}

/**
 * Hook to fetch all projects for a company with real-time subscription.
 * Automatically filters out deleted projects (deletedAt == null).
 *
 * @param options - Filter options (companyId)
 * @returns Object containing projects list, loading state, and error
 */
export function useProjects(options: UseProjectsOptions = {}) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

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
        try {
          const projectsList = snapshot.docs.map((doc) => {
            return projectSchema.parse({
              id: doc.id,
              ...doc.data(),
            });
          });
          setProjects(projectsList);
          setError(null);
          setLoading(false);
        } catch (err) {
          setError(err instanceof Error ? err : new Error("Validation error"));
          setProjects([]);
          setLoading(false);
        }
      },
      (err) => {
        setError(err instanceof Error ? err : new Error("Failed to fetch projects"));
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [options.companyId]);

  return { projects, loading, error };
}
