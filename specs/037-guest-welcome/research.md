# Research: Guest Access & Welcome

**Feature**: 037-guest-welcome
**Date**: 2026-01-20

## Overview

This document captures technology decisions and patterns for the Guest Access & Welcome feature based on codebase exploration and existing architectural patterns.

**IMPORTANT**: All data fetching and mutation implementations MUST follow:
- **Standard**: `standards/frontend/data-fetching.md`
- **Canonical Example**: `domains/session/shared/hooks/` (useCreateSession, useSubscribeSession)
- **Query Pattern**: `domains/session/shared/queries/session.query.ts` (query key factory)

---

## 1. Route Structure Decision

### Decision: Use `/join/$projectId` pattern with TanStack Router

**Rationale:**
- Epic E6 specification explicitly requires `/join/:projectId` route pattern
- Existing `/guest/$projectId` route uses same TanStack Router patterns
- File-based routing already established in `app/` directory

**Alternatives Considered:**
- Keep existing `/guest/$projectId` - Rejected: Epic explicitly specifies `/join/` prefix
- Server-side redirects - Rejected: Pre-production, no backward compatibility needed

**Implementation Pattern:**
```text
app/join/
├── route.tsx                 # Layout with Outlet (no sidebar)
├── $projectId.tsx            # Welcome screen
└── $projectId.experience/
    └── $experienceId.tsx     # Experience placeholder
```

**Reference:** Existing `app/guest/` structure at `src/app/guest/route.tsx:1-10`

---

## 2. Anonymous Authentication Pattern

### Decision: Reuse existing `signInAnonymously()` pattern from GuestExperiencePage

**Rationale:**
- Pattern already implemented and tested at `domains/guest/containers/GuestExperiencePage.tsx:16-42`
- Handles React Strict Mode duplicate calls with `signingInRef`
- Integrates with existing AuthProvider context

**Alternatives Considered:**
- Custom auth hook - Rejected: Existing pattern works well, no need to abstract
- Server-side auth - Rejected: Client-first architecture principle

**Implementation Pattern:**
```typescript
// Existing pattern from GuestExperiencePage.tsx:16-42
const signingInRef = useRef(false)

useEffect(() => {
  async function signInAnonymouslyIfNeeded() {
    if (signingInRef.current) return
    if (auth.user) return

    signingInRef.current = true
    try {
      await signInAnonymously(auth)
    } catch (error) {
      Sentry.captureException(error)
    }
  }
  signInAnonymouslyIfNeeded()
}, [auth.user, auth.isLoading])
```

---

## 3. Data Fetching Strategy

### Decision: TanStack Query + Firestore onSnapshot for real-time updates

**MUST FOLLOW**: `standards/frontend/data-fetching.md`

**Canonical Example**: `domains/session/shared/hooks/` demonstrates the correct pattern:
- `useSubscribeSession.ts` - Real-time query hook with onSnapshot
- `useCreateSession.ts` - Mutation hook with transaction
- `session.query.ts` - Query key factory pattern

**Rationale:**
- Established pattern throughout codebase
- Session hooks are the gold standard implementation
- Combines initial fetch with real-time subscription
- Query key factory enables consistent cache invalidation

**Alternatives Considered:**
- Pure onSnapshot without TanStack Query - Rejected: Loses caching benefits
- Pure TanStack Query without real-time - Rejected: Misses live updates for published events

**Implementation Pattern (following session hooks):**

```typescript
// 1. Query key factory (domains/guest/queries/guest-access.query.ts)
export const guestAccessKeys = {
  all: ['guest-access'] as const,
  details: () => [...guestAccessKeys.all, 'detail'] as const,
  detail: (projectId: string) => [...guestAccessKeys.details(), projectId] as const,
}

export function guestAccessQuery(projectId: string) {
  return queryOptions<GuestAccessData | null>({
    queryKey: guestAccessKeys.detail(projectId),
    queryFn: async () => {
      // Fetch and validate project + event
      const projectRef = doc(firestore, 'projects', projectId)
      const snapshot = await getDoc(projectRef)
      if (!snapshot.exists()) return null
      return convertFirestoreDoc(snapshot, projectSchema)
    },
    staleTime: Infinity, // Never stale (real-time via onSnapshot)
    refetchOnWindowFocus: false, // Disable refetch (real-time handles it)
  })
}

// 2. Real-time subscription hook (domains/guest/hooks/useGuestAccess.ts)
export function useGuestAccess(projectId: string) {
  const queryClient = useQueryClient()

  useEffect(() => {
    const projectRef = doc(firestore, 'projects', projectId)

    const unsubscribe = onSnapshot(
      projectRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          queryClient.setQueryData(guestAccessKeys.detail(projectId), null)
          return
        }
        const project = convertFirestoreDoc(snapshot, projectSchema)
        queryClient.setQueryData(guestAccessKeys.detail(projectId), project)
      },
      (error) => {
        Sentry.captureException(error, {
          tags: { domain: 'guest', action: 'subscribe-access' },
        })
      },
    )

    return () => unsubscribe()
  }, [projectId, queryClient])

  return useQuery(guestAccessQuery(projectId))
}
```

**Reference Files:**
- `domains/session/shared/queries/session.query.ts:23-39` - Query key factory
- `domains/session/shared/hooks/useSubscribeSession.ts:51-103` - Real-time hook
- `standards/frontend/data-fetching.md` - Complete standard

---

## 4. Guest Record Storage

### Decision: Store guest records at `/projects/{projectId}/guests/{guestId}`

**Rationale:**
- Matches epic E6 specification exactly (Section 2.3)
- Project-scoped guests allow per-project guest management
- Guest ID can be derived from anonymous auth UID for simplicity

**Alternatives Considered:**
- Global `/guests/{guestId}` collection - Rejected: Epic specifies project-scoped
- Use auth UID as guestId directly - Selected: Simplifies lookup, one guest per auth UID per project

**Schema (Zod):**
```typescript
export const guestSchema = z.object({
  id: z.string(),           // Same as document ID and authUid
  projectId: z.string(),
  authUid: z.string(),      // Anonymous auth UID
  createdAt: z.number(),    // Unix timestamp (ms)
})
```

---

## 5. Session Creation Pattern

### Decision: Reuse existing `useCreateSession` hook

**MUST FOLLOW**: `standards/frontend/data-fetching.md` - Mutation Hooks Pattern

**Canonical Example**: `domains/session/shared/hooks/useCreateSession.ts`

**Rationale:**
- Hook already exists at `domains/session/shared/hooks/useCreateSession.ts:62-125`
- Uses Firestore transactions for atomic creation (REQUIRED with serverTimestamp)
- Supports `mode: 'guest'` and `configSource: 'published'` required by this feature
- Captures errors to Sentry with proper domain/action tags

**Key Patterns from useCreateSession:**
1. **ALWAYS use transactions** with `serverTimestamp()` to prevent null timestamp race conditions
2. **Validate input** with Zod schema before mutation
3. **Return client-side copy** with estimated timestamps (real timestamps come from subscription)
4. **Capture errors** to Sentry with domain/action tags

**Alternatives Considered:**
- New session hook - Rejected: Existing hook fully supports requirements
- Server function - Rejected: Client-side creation is secure via Firestore rules

**Usage Pattern:**
```typescript
const createSession = useCreateSession()

const handleSelectExperience = async (experienceId: string) => {
  createSession.mutate(
    {
      projectId,
      workspaceId,
      eventId,
      experienceId,
      mode: 'guest',
      configSource: 'published',
    },
    {
      onSuccess: ({ sessionId }) => {
        navigate(`/join/${projectId}/experience/${experienceId}?session=${sessionId}`)
      },
      onError: () => {
        toast.error('Failed to start experience')
      },
    },
  )
}
```

**Reference:** `domains/session/shared/hooks/useCreateSession.ts:62-125`

---

## 6. Theming Strategy

### Decision: Reuse ThemeProvider and themed components from shared/theming

**Rationale:**
- Complete theming system exists at `shared/theming/`
- `WelcomePreview` component at `domains/event/welcome/components/WelcomePreview.tsx` demonstrates usage
- `ThemedBackground`, `ThemedText`, `ThemedButton` components available

**Alternatives Considered:**
- Custom theme handling - Rejected: Existing system is comprehensive
- CSS variables only - Rejected: Context-based approach provides better DX

**Implementation Pattern:**
```tsx
// Wrap welcome screen with ThemeProvider
<ThemeProvider theme={event.publishedConfig.theme}>
  <ThemedBackground className="min-h-screen">
    <ThemedText variant="heading">{welcome.title}</ThemedText>
    <ExperienceCardList experiences={experiences} />
  </ThemedBackground>
</ThemeProvider>
```

**Reference:** `shared/theming/providers/ThemeProvider.tsx:30-41`

---

## 7. Welcome Screen Component (WYSIWYG Approach)

### Decision: Refactor WelcomePreview → WelcomeRenderer for both edit and run modes

**Rationale:**
- `WelcomePreview` at `domains/event/welcome/components/WelcomePreview.tsx` already renders the complete welcome screen
- `ExperienceCard` at `domains/event/experiences/components/ExperienceCard.tsx` already supports `mode: 'edit' | 'run'`
- **WYSIWYG Principle**: What creators see in preview should be identical to what guests see
- This follows the same pattern as step renderers (used in both preview and ExperienceRuntime)

**Alternatives Considered:**
- Create duplicate components in guest domain - **Rejected**: Violates DRY, risks visual divergence
- Keep components separate for edit/run - **Rejected**: Requires maintaining two implementations in sync

**Refactoring Plan:**
1. **Move ExperienceCard** from `domains/event/experiences/` to `domains/event/welcome/` (semantic organization)
2. **Rename WelcomePreview → WelcomeRenderer** (clarifies it's used for both edit and run)
3. **Add mode prop** to WelcomeRenderer interface
4. **Add onSelectExperience prop** for run mode interaction

**Implementation Pattern:**
```tsx
// WelcomeRenderer (refactored from WelcomePreview)
interface WelcomeRendererProps {
  welcome: WelcomeConfig
  mainExperiences?: MainExperienceReference[]
  experienceDetails?: Experience[]
  mode: 'edit' | 'run'  // NEW
  onSelectExperience?: (experienceId: string) => void  // NEW (required when mode='run')
}

// ExperienceCard already supports mode
<ExperienceCard
  experience={experience}
  layout={welcome.layout}
  mode={mode}  // 'edit' or 'run'
  onClick={mode === 'run' ? () => onSelectExperience?.(experience.id) : undefined}
/>
```

**Usage in Guest Domain:**
```tsx
// WelcomeScreenPage.tsx - trivially simple
import { WelcomeRenderer } from '@/domains/event/welcome'

<ThemeProvider theme={theme}>
  <WelcomeRenderer
    welcome={welcome}
    mainExperiences={enabledExperiences}
    experienceDetails={experienceDetails}
    mode="run"
    onSelectExperience={handleSelectExperience}
  />
</ThemeProvider>
```

**Reference Files:**
- `domains/event/welcome/components/WelcomePreview.tsx` - Current implementation
- `domains/event/experiences/components/ExperienceCard.tsx` - Already supports mode prop
- `domains/experience/runtime/containers/ExperienceRuntime.tsx` - Pattern for reusing renderers

---

## 8. Error Pages Strategy

### Decision: Create simple ErrorPage and ComingSoonPage components

**Rationale:**
- Epic E6 Section 6 specifies distinct error states: 404, Coming Soon, No Experiences
- Simple presentational components, no complex logic needed
- Guest domain-specific to keep code organized

**Alternatives Considered:**
- Global error boundary - Rejected: These are expected states, not errors
- Shared components - Rejected: Guest-specific styling and messaging

**Implementation Pattern:**
```tsx
// ErrorPage (404)
export function ErrorPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-6xl font-bold">404</h1>
      <p>This page doesn't exist</p>
    </div>
  )
}

// ComingSoonPage
export function ComingSoonPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl font-bold">Coming Soon</h1>
      <p>This experience isn't ready yet. Check back soon!</p>
    </div>
  )
}
```

---

## 9. Access Validation Logic

### Decision: Create `useGuestAccess` hook combining project + event validation

**Rationale:**
- Single hook simplifies container logic
- Returns discriminated union for clear state handling
- Follows epic E6 Section 2.2 validation requirements

**Alternatives Considered:**
- Separate hooks per validation step - Rejected: Would require complex coordination
- Loader-based validation - Rejected: Client-first architecture, validation in hooks

**Implementation Pattern:**
```typescript
type GuestAccessState =
  | { status: 'loading' }
  | { status: 'not-found' }       // Project or event doesn't exist
  | { status: 'coming-soon' }     // No active event or not published
  | { status: 'ready'; project: Project; event: ProjectEventFull; experiences: Experience[] }

export function useGuestAccess(projectId: string): GuestAccessState {
  const { data: project, isLoading: projectLoading } = useProject(projectId)
  const { data: event, isLoading: eventLoading } = useProjectEvent(
    projectId,
    project?.activeEventId ?? ''
  )
  // ... validation logic
}
```

---

## 10. Experience Data Loading

### Decision: Fetch experiences from workspace collection using experienceIds from event config

**Rationale:**
- Event config has `publishedConfig.experiences.main[]` with experienceId references
- Experiences stored at `/workspaces/{workspaceId}/experiences/{experienceId}`
- Need to load only enabled experiences for display

**Alternatives Considered:**
- Embed experience data in event config - Rejected: Data duplication, staleness issues
- Load all workspace experiences - Rejected: Wasteful, may include disabled ones

**Implementation Pattern:**
```typescript
// Extract enabled experience IDs from event config
const enabledExperienceIds = event.publishedConfig.experiences.main
  .filter(ref => ref.enabled)
  .map(ref => ref.experienceId)

// Fetch each experience (can use Promise.all for parallel)
const experiences = await Promise.all(
  enabledExperienceIds.map(id =>
    getDoc(doc(firestore, `workspaces/${workspaceId}/experiences/${id}`))
  )
)
```

---

## Summary

All technical decisions leverage existing patterns and components from the codebase.

### Critical Standards to Follow

| Standard | Path | Applies To |
|----------|------|------------|
| **Data Fetching** | `standards/frontend/data-fetching.md` | All hooks, queries, mutations |
| Design System | `standards/frontend/design-system.md` | Themed components |
| Project Structure | `standards/global/project-structure.md` | Domain organization |

### Implementation References

| Component | Approach | Canonical Reference |
|-----------|----------|---------------------|
| Query Hooks | TanStack Query + onSnapshot | `domains/session/shared/hooks/useSubscribeSession.ts` |
| Mutation Hooks | useMutation + runTransaction | `domains/session/shared/hooks/useCreateSession.ts` |
| Query Keys | Factory pattern | `domains/session/shared/queries/session.query.ts` |
| Routes | TanStack Router file-based | `app/guest/` existing structure |
| Auth | Anonymous auth with duplicate prevention | `GuestExperiencePage.tsx:16-42` |
| Theming | ThemeProvider + themed components | `shared/theming/` |

### Key Rules from Data Fetching Standard

1. **ALWAYS use transactions** with `serverTimestamp()` (prevents Zod parse errors)
2. **Use query key factories** for consistent cache invalidation
3. **Set `staleTime: Infinity`** for real-time queries (onSnapshot handles freshness)
4. **Use `convertFirestoreDoc`** for type-safe Firestore → plain object conversion
5. **Capture errors to Sentry** with domain/action tags

No new external dependencies required. All patterns follow the client-first architecture principle.
