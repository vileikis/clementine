"use client";

/**
 * Component: RenameProjectDialog
 *
 * Dialog for renaming a project.
 * Uses form for Enter key submission.
 * Auto-focuses the input field when opened.
 */

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateProjectNameAction } from "../actions/projects.actions";
import type { Project } from "../types/project.types";

interface RenameProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project;
}

export function RenameProjectDialog({
  open,
  onOpenChange,
  project,
}: RenameProjectDialogProps) {
  const [name, setName] = useState(project.name);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when dialog opens or project changes
  useEffect(() => {
    if (open) {
      setName(project.name);
      setError(null);
    }
  }, [open, project.name]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      const trimmedName = name.trim();

      // Validation
      if (!trimmedName) {
        setError("Name is required");
        return;
      }
      if (trimmedName.length > 200) {
        setError("Name is too long");
        return;
      }

      // Don't submit if name hasn't changed
      if (trimmedName === project.name) {
        onOpenChange(false);
        return;
      }

      setIsSubmitting(true);
      setError(null);

      try {
        const result = await updateProjectNameAction(project.id, trimmedName);

        if (result.success) {
          toast.success("Project renamed");
          onOpenChange(false);
        } else {
          setError(result.error?.message ?? "Failed to rename project");
        }
      } catch {
        setError("Failed to rename project");
      } finally {
        setIsSubmitting(false);
      }
    },
    [name, project.id, project.name, onOpenChange]
  );

  const isDirty = name.trim() !== project.name;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Rename Project</DialogTitle>
            <DialogDescription>
              Enter a new name for this project.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Project name"
                disabled={isSubmitting}
                maxLength={200}
                autoFocus
                className={error ? "border-destructive" : ""}
              />
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !isDirty}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
