export interface Session {
  id: string
  guestName: string
  photoUrl: string
  eventName: string
  createdAt: string
}

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
