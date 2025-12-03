"use client";

/**
 * Component: CreateProjectButton
 *
 * Button that creates a new project with default name "Untitled"
 * and redirects to the project details page.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { createProjectAction } from "../actions/projects.actions";
import { DEFAULT_PROJECT_NAME, THEME_DEFAULTS } from "../constants";

interface CreateProjectButtonProps {
  companyId: string;
  companySlug: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export function CreateProjectButton({
  companyId,
  companySlug,
  variant = "default",
  size = "default",
  className,
}: CreateProjectButtonProps) {
  const [isCreating, setIsCreating] = useState(false);
  const router = useRouter();

  const handleCreate = async () => {
    if (isCreating) return;

    setIsCreating(true);
    try {
      const result = await createProjectAction({
        companyId,
        name: DEFAULT_PROJECT_NAME,
        primaryColor: THEME_DEFAULTS.primaryColor,
      });

      if (result.success && result.projectId) {
        toast.success("Project created");
        // Redirect to the project details page
        router.push(`/${companySlug}/projects/${result.projectId}`);
      } else {
        toast.error(result.error?.message || "Failed to create project");
      }
    } catch (error) {
      toast.error("Failed to create project");
      console.error("Create project error:", error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Button
      onClick={handleCreate}
      disabled={isCreating}
      variant={variant}
      size={size}
      className={className}
    >
      {isCreating ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Plus className="h-4 w-4" />
      )}
      <span className="ml-2">New Project</span>
    </Button>
  );
}
