// useProjectEvents hook  
// Real-time subscription to project events list

import { useQuery } from '@tanstack/react-query'
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  type Firestore,
} from 'firebase/firestore'
import { projectEventSchema } from '../schemas/project-event.schema'
import type { ProjectEvent } from '../types/project-event.types'

export function useProjectEvents(firestore: Firestore, projectId: string) {
  return useQuery({
    queryKey: ['projectEvents', projectId],
    queryFn: () => {
      return new Promise<ProjectEvent[]>((resolve, reject) => {
        const eventsRef = collection(firestore, `projects/${projectId}/events`)
        const q = query(
          eventsRef,
          where('status', '==', 'draft'),
          orderBy('createdAt', 'desc')
        )

        const unsubscribe = onSnapshot(
          q,
          (snapshot) => {
            try {
              const events = snapshot.docs.map((doc) => {
                const data = doc.data()
                return projectEventSchema.parse({
                  id: doc.id,
                  ...data,
                })
              })
              resolve(events)
            } catch (error) {
              reject(error)
            }
          },
          (error) => {
            reject(error)
          }
        )

        return () => unsubscribe()
      })
    },
    staleTime: Infinity,
  })
}
