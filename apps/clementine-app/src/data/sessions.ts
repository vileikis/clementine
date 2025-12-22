import { createServerFn } from '@tanstack/react-start'
import { type Session } from '../types/session'


// Mock session data - centralized source of truth
export const MOCK_SESSIONS: Session[] = [
  {
    id: 'session-1',
    guestName: 'Alice Johnson',
    photoUrl: 'https://picsum.photos/seed/session1/800/600',
    eventName: 'Summer Festival 2024',
    createdAt: '2024-12-20T14:30:00Z',
  },
  {
    id: 'session-2',
    guestName: 'Bob Smith',
    photoUrl: 'https://picsum.photos/seed/session2/800/600',
    eventName: 'Corporate Gala',
    createdAt: '2024-12-21T18:45:00Z',
  },
  {
    id: 'session-3',
    guestName: 'Carol Williams',
    photoUrl: 'https://picsum.photos/seed/session3/800/600',
    eventName: 'Wedding Reception',
    createdAt: '2024-12-22T12:15:00Z',
  },
]


/**
 * Server function to get all sessions
 */
export const getSessions = createServerFn({
  method: 'GET',
}).handler(async () => {
  return MOCK_SESSIONS
})

/**
 * Server function to get a single session by ID
 */
export const getSessionById = createServerFn({
  method: 'GET',
})
.inputValidator((sessionId: string) => sessionId)
  .handler(async ({ data: sessionId }) => {
    const session = MOCK_SESSIONS.find((s) => s.id === sessionId)

    if (!session) {
      throw new Error('Session not found')
    }

    return session
  })
