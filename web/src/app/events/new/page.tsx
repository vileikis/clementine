import Link from "next/link"

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
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
        </div>

        <h1 className="text-2xl font-bold mb-2">Create Event</h1>
        <p className="text-muted-foreground mb-6">
          Event creation form - Work in Progress
        </p>

        <div className="bg-muted/50 rounded-lg p-6 text-left">
          <h3 className="font-semibold mb-3">Coming Soon:</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Event title and branding configuration</li>
            <li>• Brand color picker</li>
            <li>• Title overlay toggle</li>
            <li>• Automatic join URL generation</li>
            <li>• QR code creation</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
