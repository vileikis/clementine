import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { MOCK_SESSIONS } from '../../types/session'

export const Route = createFileRoute('/api/sessions/$sessionId')({
  server: {
    handlers: {
      GET: ({ params }) => {
        const session = MOCK_SESSIONS.find((s) => s.id === params.sessionId)

        if (!session) {
          return json({ error: 'Session not found' }, { status: 404 })
        }

        return json({ session })
      },
    },
  },
})
