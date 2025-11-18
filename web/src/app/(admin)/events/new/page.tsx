import Link from "next/link"
import { EventForm } from "@/features/events"

export default function NewEventPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link
          href="/events"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to Events
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Create Event</h1>
        <p className="text-muted-foreground">
          Set up your AI photobooth experience with custom branding
        </p>
      </div>

      <div className="border rounded-lg p-6 bg-card">
        <EventForm />
      </div>
    </div>
  )
}
