import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import type { Session } from '../../types/session'

export const Route = createFileRoute('/share/$sessionId')({
  loader: async ({ params }) => {
    // Fetch session from API
    const response = await fetch(`/api/sessions/${params.sessionId}`)

    if (!response.ok) {
      throw new Error('Session not found')
    }

    const data = (await response.json()) as { session: Session }
    return data
  },

  // Dynamic head metadata based on session data
  head: ({ loaderData }) => {
    const { session } = loaderData!
    const title = `${session.guestName}'s Photo - ${session.eventName}`
    const description = `Check out ${session.guestName}'s AI-transformed photo from ${session.eventName} on Clementine!`
    const url = `https://yourapp.com/share/${session.id}`

    return {
      meta: [
        {
          title,
        },
        {
          name: 'description',
          content: description,
        },
        // Open Graph tags
        {
          property: 'og:type',
          content: 'website',
        },
        {
          property: 'og:title',
          content: title,
        },
        {
          property: 'og:description',
          content: description,
        },
        {
          property: 'og:image',
          content: session.photoUrl,
        },
        {
          property: 'og:image:width',
          content: '800',
        },
        {
          property: 'og:image:height',
          content: '600',
        },
        {
          property: 'og:url',
          content: url,
        },
        // Twitter Card tags
        {
          name: 'twitter:card',
          content: 'summary_large_image',
        },
        {
          name: 'twitter:title',
          content: title,
        },
        {
          name: 'twitter:description',
          content: description,
        },
        {
          name: 'twitter:image',
          content: session.photoUrl,
        },
      ],
    }
  },

  component: SessionDetail,
})

function SessionDetail() {
  const { session } = Route.useLoaderData()

  return (
    <div className="min-h-screen bg-linear-to-b from-slate-900 to-slate-800 py-12 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Back button */}
        <Link
          to="/share"
          className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to all photos
        </Link>

        {/* Session content */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg overflow-hidden">
          {/* Photo */}
          <div className="aspect-4/3 bg-slate-700">
            <img
              src={session.photoUrl}
              alt={`Photo by ${session.guestName}`}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Details */}
          <div className="p-8">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-white mb-2">
                {session.guestName}'s Photo
              </h1>
              <p className="text-xl text-gray-400">{session.eventName}</p>
            </div>

            <div className="flex items-center gap-8 text-sm text-gray-400 mb-8">
              <div>
                <span className="text-gray-500">Created:</span>{' '}
                {new Date(session.createdAt).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </div>
              <div>
                <span className="text-gray-500">Session ID:</span> {session.id}
              </div>
            </div>

            {/* Metadata preview (for debugging) */}
            <div className="border-t border-slate-700 pt-6">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">
                Metadata Preview
              </h2>
              <div className="bg-slate-900/50 rounded-lg p-4 font-mono text-xs text-gray-400">
                <div className="mb-2">
                  <span className="text-gray-500">Title:</span>{' '}
                  <span className="text-cyan-400">
                    {session.guestName}'s Photo - {session.eventName}
                  </span>
                </div>
                <div className="mb-2">
                  <span className="text-gray-500">og:image:</span>{' '}
                  <span className="text-cyan-400">{session.photoUrl}</span>
                </div>
                <div>
                  <span className="text-gray-500">Description:</span>{' '}
                  <span className="text-cyan-400">
                    Check out {session.guestName}'s AI-transformed photo from{' '}
                    {session.eventName} on Clementine!
                  </span>
                </div>
              </div>
            </div>

            {/* Share buttons (placeholder) */}
            <div className="mt-8 flex gap-4">
              <button className="px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-lg transition-colors">
                Download Photo
              </button>
              <button className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-colors">
                Share Link
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
