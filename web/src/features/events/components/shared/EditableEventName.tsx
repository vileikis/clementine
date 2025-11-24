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
import { updateEventTitleAction } from "../../actions/events"
import { useRouter } from "next/navigation"

interface EditableEventNameProps {
  eventId: string
  currentTitle: string
}

export function EditableEventName({
  eventId,
  currentTitle,
}: EditableEventNameProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [title, setTitle] = useState(currentTitle)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleSave = () => {
    setError(null)
    startTransition(async () => {
      const result = await updateEventTitleAction(eventId, title)
      if (result.success) {
        setIsOpen(false)
        router.refresh()
      } else {
        setError(result.error?.message || "Failed to update event name")
      }
    })
  }

  const handleCancel = () => {
    setTitle(currentTitle)
    setError(null)
    setIsOpen(false)
  }

  return (
    <>
      <h1
        className="text-3xl font-bold cursor-pointer hover:underline"
        onClick={() => setIsOpen(true)}
      >
        {currentTitle}
      </h1>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename this event</DialogTitle>
          </DialogHeader>

          <div className="py-4">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Event name"
              maxLength={100}
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
