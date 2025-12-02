"use client"

import { useState, useTransition } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { updateProjectNameAction } from "../../actions/projects.actions"
import { useRouter } from "next/navigation"

interface EditableProjectNameProps {
  projectId: string
  currentName: string
}

export function EditableProjectName({
  projectId,
  currentName,
}: EditableProjectNameProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [name, setName] = useState(currentName)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleSave = () => {
    setError(null)
    startTransition(async () => {
      const result = await updateProjectNameAction(projectId, name)
      if (result.success) {
        setIsOpen(false)
        router.refresh()
      } else {
        setError(result.error?.message || "Failed to update project name")
      }
    })
  }

  const handleCancel = () => {
    setName(currentName)
    setError(null)
    setIsOpen(false)
  }

  return (
    <>
      <h1
        className="text-3xl font-bold cursor-pointer hover:underline"
        onClick={() => setIsOpen(true)}
      >
        {currentName}
      </h1>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename this project</DialogTitle>
          </DialogHeader>

          <div className="py-4">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Project name"
              maxLength={200}
              disabled={isPending}
            />
            {error && (
              <p className="text-sm text-destructive mt-2">{error}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isPending}>
              {isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
