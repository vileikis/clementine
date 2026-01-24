# Quickstart: Guest Experience Runtime

**Feature**: 039-guest-experience-runtime
**Date**: 2026-01-23

## Prerequisites

- Node.js 20+
- pnpm 10.18.1+
- Firebase project with Firestore enabled
- Existing codebase with ExperienceRuntime infrastructure

## Setup

```bash
# From monorepo root
cd /Users/iggyvileikis/Projects/@attempt-n2/guest-experience-runtime

# Install dependencies
pnpm install

# Start development server
pnpm app:dev
```

## Implementation Order

### Phase 1: Schema Extensions

#### 1.1 Session Schema (packages/shared)

```typescript
// packages/shared/src/schemas/session/session.schema.ts
// Add mainSessionId field

export const sessionSchema = z.looseObject({
  // ... existing fields ...

  /** For pregate/preshare sessions: link to main session */
  mainSessionId: z.string().nullable().default(null),

  // ... rest of fields ...
})
```

Rebuild shared package:
```bash
pnpm --filter @clementine/shared build
```

#### 1.2 Guest Schema (app domain)

```typescript
// apps/clementine-app/src/domains/guest/schemas/guest.schema.ts

export const completedExperienceSchema = z.object({
  experienceId: z.string().min(1),
  completedAt: z.number(),
  sessionId: z.string().min(1),
})

export const guestSchema = z.object({
  id: z.string().min(1, 'Guest ID is required'),
  projectId: z.string().min(1, 'Project ID is required'),
  authUid: z.string().min(1, 'Auth UID is required'),
  createdAt: z.number(),
  completedExperiences: z.array(completedExperienceSchema).default([]),
})
```

### Phase 2: Guest Domain Hooks

#### 2.1 Completion Tracking Hook

```typescript
// apps/clementine-app/src/domains/guest/hooks/useUpdateGuestCompletedExperiences.ts

import { doc, updateDoc, arrayUnion } from 'firebase/firestore'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { firestore } from '@/integrations/firebase/client'

export function useUpdateGuestCompletedExperiences() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      projectId,
      guestId,
      experienceId,
      sessionId,
    }: {
      projectId: string
      guestId: string
      experienceId: string
      sessionId: string
    }) => {
      const guestRef = doc(firestore, 'projects', projectId, 'guests', guestId)
      await updateDoc(guestRef, {
        completedExperiences: arrayUnion({
          experienceId,
          completedAt: Date.now(),
          sessionId,
        }),
      })
    },
    onSuccess: (_, { projectId, guestId }) => {
      queryClient.invalidateQueries({ queryKey: ['guest', projectId, guestId] })
    },
  })
}
```

#### 2.2 Pregate Check Hook

```typescript
// apps/clementine-app/src/domains/guest/hooks/usePregate.ts

import type { Guest } from '../schemas/guest.schema'
import type { ExperiencesConfig } from '@clementine/shared'

export function usePregate(guest: Guest, config: ExperiencesConfig | null) {
  const needsPregate = (selectedExperienceId: string): boolean => {
    const pregate = config?.pregate
    if (!pregate?.enabled) return false

    return !guest.completedExperiences.some(
      e => e.experienceId === pregate.experienceId
    )
  }

  const pregateExperienceId = config?.pregate?.experienceId ?? null

  return { needsPregate, pregateExperienceId }
}
```

#### 2.3 Preshare Check Hook

```typescript
// apps/clementine-app/src/domains/guest/hooks/usePreshare.ts

import type { Guest } from '../schemas/guest.schema'
import type { ExperiencesConfig } from '@clementine/shared'

export function usePreshare(guest: Guest, config: ExperiencesConfig | null) {
  const needsPreshare = (): boolean => {
    const preshare = config?.preshare
    if (!preshare?.enabled) return false

    return !guest.completedExperiences.some(
      e => e.experienceId === preshare.experienceId
    )
  }

  const preshareExperienceId = config?.preshare?.experienceId ?? null

  return { needsPreshare, preshareExperienceId }
}
```

### Phase 3: Session Domain Hook

```typescript
// apps/clementine-app/src/domains/session/shared/hooks/useUpdateSessionMainSessionId.ts

import { doc, updateDoc } from 'firebase/firestore'
import { useMutation } from '@tanstack/react-query'
import { firestore } from '@/integrations/firebase/client'

export function useUpdateSessionMainSessionId() {
  return useMutation({
    mutationFn: async ({
      projectId,
      sessionId,
      mainSessionId,
    }: {
      projectId: string
      sessionId: string
      mainSessionId: string
    }) => {
      const sessionRef = doc(firestore, 'projects', projectId, 'sessions', sessionId)
      await updateDoc(sessionRef, {
        mainSessionId,
        updatedAt: Date.now(),
      })
    },
  })
}
```

### Phase 4: Routes

#### 4.1 Pregate Route

```typescript
// apps/clementine-app/src/app/join/$projectId/pregate.tsx

import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { PregatePage } from '@/domains/guest'

const searchSchema = z.object({
  experience: z.string().min(1, 'Experience ID required'),
})

export const Route = createFileRoute('/join/$projectId/pregate')({
  validateSearch: searchSchema,
  component: JoinPregatePage,
})

function JoinPregatePage() {
  const { projectId } = Route.useParams()
  const { experience } = Route.useSearch()

  return <PregatePage projectId={projectId} selectedExperienceId={experience} />
}
```

#### 4.2 Preshare Route

```typescript
// apps/clementine-app/src/app/join/$projectId/preshare.tsx

import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { PresharePage } from '@/domains/guest'

const searchSchema = z.object({
  session: z.string().min(1, 'Session ID required'),
})

export const Route = createFileRoute('/join/$projectId/preshare')({
  validateSearch: searchSchema,
  component: JoinPresharePage,
})

function JoinPresharePage() {
  const { projectId } = Route.useParams()
  const { session } = Route.useSearch()

  return <PresharePage projectId={projectId} mainSessionId={session} />
}
```

#### 4.3 Share Route

```typescript
// apps/clementine-app/src/app/join/$projectId/share.tsx

import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { SharePage } from '@/domains/guest'

const searchSchema = z.object({
  session: z.string().min(1, 'Session ID required'),
})

export const Route = createFileRoute('/join/$projectId/share')({
  validateSearch: searchSchema,
  component: JoinSharePage,
})

function JoinSharePage() {
  const { projectId } = Route.useParams()
  const { session } = Route.useSearch()

  return <SharePage projectId={projectId} mainSessionId={session} />
}
```

### Phase 5: Page Containers

#### 5.1 PregatePage

```typescript
// apps/clementine-app/src/domains/guest/containers/PregatePage.tsx

export function PregatePage({
  projectId,
  selectedExperienceId,
}: {
  projectId: string
  selectedExperienceId: string
}) {
  const navigate = useNavigate()
  const { guest, event } = useGuestContext()
  const updateCompletion = useUpdateGuestCompletedExperiences()

  const pregateExperienceId = event.publishedConfig?.experiences?.pregate?.experienceId
  if (!pregateExperienceId) {
    // Misconfigured - skip to main
    navigate({
      to: '/join/$projectId/experience/$experienceId',
      params: { projectId, experienceId: selectedExperienceId },
    })
    return null
  }

  const handleComplete = async (sessionId: string) => {
    // Record completion
    await updateCompletion.mutateAsync({
      projectId,
      guestId: guest.id,
      experienceId: pregateExperienceId,
      sessionId,
    })

    // Navigate to main experience (replace to hide pregate from history)
    navigate({
      to: '/join/$projectId/experience/$experienceId',
      params: { projectId, experienceId: selectedExperienceId },
      search: { pregate: sessionId },
      replace: true,
    })
  }

  return (
    <ExperiencePageInner
      experienceId={pregateExperienceId}
      onComplete={handleComplete}
    />
  )
}
```

### Phase 6: Testing

Run tests:
```bash
pnpm app:test
```

Run validation:
```bash
pnpm app:check && pnpm app:type-check
```

## Verification Checklist

- [ ] Guest can complete main experience from welcome to share
- [ ] Guest is routed through pregate when configured and not completed
- [ ] Completed pregate is skipped on subsequent visits
- [ ] Guest is routed through preshare when configured and not completed
- [ ] Completed preshare is skipped on subsequent visits
- [ ] Browser back from any phase returns to welcome
- [ ] Sessions are linked via mainSessionId
- [ ] Guest completedExperiences array is updated correctly
- [ ] Transform pipeline is triggered at main experience completion

## Common Issues

### Pregate Not Showing

1. Check `publishedConfig.experiences.pregate.enabled` is true
2. Check experience ID exists
3. Check guest hasn't already completed it

### History Not Replaced

Verify navigation uses `replace: true`:
```typescript
navigate({ ..., replace: true })
```

### Session Not Linked

Ensure pregate session ID is passed via URL param and update is called after main session creation.
