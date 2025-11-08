import Link from "next/link"
import { getEventAction } from "@/app/actions/events"
import { notFound } from "next/navigation"

interface EventDetailPageProps {
  params: { eventId: string }
}

export default async function EventDetailPage({
  params,
}: EventDetailPageProps) {
  const result = await getEventAction(params.eventId)

  if (!result.success || !result.event) {
    notFound()
  }

  const event = result.event

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Link
          href="/events"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to Events
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{event.title}</h1>
        <p className="text-muted-foreground">Event ID: {event.id}</p>
      </div>

      <div className="border rounded-lg p-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-100 text-yellow-600 mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
            />
          </svg>
        </div>

        <h2 className="text-2xl font-bold mb-2">Event Configuration</h2>
        <p className="text-muted-foreground mb-6">
          Event detail page - Work in Progress
        </p>

        <div className="bg-muted/50 rounded-lg p-6 text-left">
          <h3 className="font-semibold mb-3">Coming Soon:</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Scene configuration (effects, prompts, reference images)</li>
            <li>• Branding settings (colors, title overlay)</li>
            <li>• Distribution tools (join URL, QR codes)</li>
            <li>• Event analytics and media gallery</li>
            <li>• Live preview of guest experience</li>
          </ul>
        </div>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-left">
          <h4 className="font-semibold text-blue-900 mb-2">Current Event:</h4>
          <dl className="space-y-1 text-sm">
            <div className="flex gap-2">
              <dt className="font-medium text-blue-900">Status:</dt>
              <dd className="text-blue-700">{event.status}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="font-medium text-blue-900">Brand Color:</dt>
              <dd className="flex items-center gap-2 text-blue-700">
                <span
                  className="inline-block w-4 h-4 rounded border"
                  style={{ backgroundColor: event.brandColor }}
                />
                {event.brandColor}
              </dd>
            </div>
            <div className="flex gap-2">
              <dt className="font-medium text-blue-900">Join Path:</dt>
              <dd className="text-blue-700">{event.joinPath}</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  )
}
