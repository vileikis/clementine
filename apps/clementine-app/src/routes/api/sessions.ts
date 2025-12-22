import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { MOCK_SESSIONS } from '../../types/session'

export const Route = createFileRoute('/api/sessions')({
  server: {
    handlers: {
      GET: () => json({ sessions: MOCK_SESSIONS }),
    },
  },
})
