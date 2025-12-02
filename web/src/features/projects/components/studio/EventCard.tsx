import Link from "next/link"
import type { Project } from "../../types/project.types"
import { DeleteEventButton } from "./DeleteEventButton"

interface EventCardProps {
  event: Event
  companyName?: string | null
}

const statusStyles: Record<Event["status"], string> = {
  draft: "bg-yellow-100 text-yellow-800 border-yellow-200",
  live: "bg-green-100 text-green-800 border-green-200",
  archived: "bg-gray-100 text-gray-800 border-gray-200",
  deleted: "bg-red-100 text-red-800 border-red-200",
}

const statusLabels: Record<Event["status"], string> = {
  draft: "Draft",
  live: "Live",
  archived: "Archived",
  deleted: "Deleted",
}

export function EventCard({ event, companyName }: EventCardProps) {
  const formattedDate = new Date(event.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })

  return (
    <Link
      href={`/events/${event.id}`}
      className="block border rounded-lg p-6 hover:border-primary transition-colors"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold">{event.name}</h3>
          {companyName && (
            <p className="text-sm text-muted-foreground mt-1">
              {companyName}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`px-2 py-1 text-xs font-medium rounded-full border flex-shrink-0 ${statusStyles[event.status]}`}
          >
            {statusLabels[event.status]}
          </span>
          <DeleteEventButton eventId={event.id} eventName={event.name} />
        </div>
      </div>

      <div className="space-y-2 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <div
            className="w-4 h-4 rounded border"
            style={{ backgroundColor: event.theme.primaryColor }}
          />
          <span>{event.theme.primaryColor}</span>
        </div>

        <div>
          <span className="font-medium">Join URL:</span>{" "}
          <span className="truncate block">{event.joinPath}</span>
        </div>

        <div className="text-xs">Created {formattedDate}</div>
      </div>
    </Link>
  )
}
