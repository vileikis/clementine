import { Link, createFileRoute } from '@tanstack/react-router'
import { getSessions } from '../../data/sessions'

export const Route = createFileRoute('/share/')({
  loader: async () => {
    const sessions = await getSessions()
    return { sessions }
  },
  component: ShareIndex,
})

function ShareIndex() {
  const { sessions } = Route.useLoaderData()

  return (
    <div className="min-h-screen bg-linear-to-b from-slate-900 to-slate-800 py-12 px-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-2">Shared Photos</h1>
        <p className="text-gray-400 mb-8">
          Browse recent AI-transformed photos from Clementine events
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sessions.map((session) => (
            <Link
              key={session.id}
              to="/share/$sessionId"
              params={{ sessionId: session.id }}
              className="group block bg-slate-800/50 border border-slate-700 rounded-lg overflow-hidden hover:border-cyan-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/10"
            >
              <div className="aspect-4/3 overflow-hidden bg-slate-700">
                <img
                  src={session.photoUrl}
                  alt={`Photo by ${session.guestName}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-4">
                <h3 className="text-lg font-semibold text-white mb-1">
                  {session.guestName}
                </h3>
                <p className="text-sm text-gray-400 mb-2">
                  {session.eventName}
                </p>
                <p className="text-xs text-gray-500">
                  {new Date(session.createdAt).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
