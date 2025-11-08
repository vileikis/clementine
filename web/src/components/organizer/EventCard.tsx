import Link from "next/link"
import type { Event } from "@/lib/types/firestore"

interface EventCardProps {
  event: Event
}

const statusStyles = {
  draft: "bg-yellow-100 text-yellow-800 border-yellow-200",
  live: "bg-green-100 text-green-800 border-green-200",
  archived: "bg-gray-100 text-gray-800 border-gray-200",
}

const statusLabels = {
  draft: "Draft",
  live: "Live",
  archived: "Archived",
}

export function EventCard({ event }: EventCardProps) {
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
        <h3 className="text-lg font-semibold">{event.title}</h3>
        <span
          className={`px-2 py-1 text-xs font-medium rounded-full border ${statusStyles[event.status]}`}
        >
          {statusLabels[event.status]}
        </span>
      </div>

      <div className="space-y-2 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <div
            className="w-4 h-4 rounded border"
            style={{ backgroundColor: event.brandColor }}
          />
          <span>{event.brandColor}</span>
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
