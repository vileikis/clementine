"use client";

/**
 * Component: CreateExperienceButton
 *
 * Button that creates a new experience with default name "Untitled"
 * and redirects to the experience editor page.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { createExperienceAction } from "../actions";
import { DEFAULT_EXPERIENCE_NAME } from "../constants";

interface CreateExperienceButtonProps {
  companyId: string;
  companySlug: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export function CreateExperienceButton({
  companyId,
  companySlug,
  variant = "default",
  size = "default",
  className,
}: CreateExperienceButtonProps) {
  const [isCreating, setIsCreating] = useState(false);
  const router = useRouter();

  const handleCreate = async () => {
    if (isCreating) return;

    setIsCreating(true);
    try {
      const result = await createExperienceAction({
        companyId,
        name: DEFAULT_EXPERIENCE_NAME,
      });

      if (result.success) {
        toast.success("Experience created");
        // Redirect to the experience editor
        router.push(`/${companySlug}/exps/${result.data.experienceId}`);
      } else {
        toast.error(result.error.message);
      }
    } catch (error) {
      toast.error("Failed to create experience");
      console.error("Create experience error:", error);
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
      <span className="ml-2">New Experience</span>
    </Button>
  );
}
