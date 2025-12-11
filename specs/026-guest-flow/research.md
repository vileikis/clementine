# Research: Guest Flow

**Feature**: 026-guest-flow
**Date**: 2024-12-11
**Status**: Complete

## Research Summary

This document consolidates findings from codebase exploration to resolve technical decisions for implementing the guest flow feature.

---

## Decision 1: Anonymous Authentication Pattern

**Decision**: Use Firebase Client SDK's `signInAnonymously()` with a custom React hook.

**Rationale**:
- Firebase Client SDK is already initialized at `web/src/lib/firebase/client.ts`
- Anonymous auth is built into Firebase and requires no additional configuration
- Authentication happens client-side (before Server Actions can be called)
- Guest identity persists via Firebase's automatic token refresh

**Alternatives Considered**:
- **Server-side auth in layout**: Rejected - layouts can't set auth state that persists client-side
- **No auth (stateless)**: Rejected - can't track returning guests or link sessions
- **Custom token auth**: Rejected - unnecessary complexity for anonymous guests

**Implementation Pattern**:
```typescript
// hooks/use-guest-auth.ts
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth"
import { app } from "@/lib/firebase/client"

export function useGuestAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const auth = getAuth(app)
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user)
        setLoading(false)
      } else {
        signInAnonymously(auth).catch(console.error)
      }
    })
    return unsubscribe
  }, [])

  return { user, loading, userId: user?.uid ?? null }
}
```

---

## Decision 2: Guest & Session Storage Location

**Decision**: Store in project subcollections: `/projects/{projectId}/guests/{guestId}` and `/projects/{projectId}/sessions/{sessionId}`.

**Rationale**:
- Matches PRD specification (FR-006, FR-008)
- Project-scoped isolation enables per-project analytics
- Aligns with existing patterns (events stored under projects)
- Enables future project-level security rules

**Alternatives Considered**:
- **Root collections** (`/guests`, `/sessions`): Rejected - requires complex queries to filter by project
- **Event subcollections** (`/events/{id}/sessions`): Rejected - sessions belong to projects (guests may access multiple events)
- **User subcollections** (`/users/{uid}/sessions`): Rejected - anonymous users have no persistent user doc

**Collection Paths**:
```
/projects/{projectId}/guests/{guestId}
/projects/{projectId}/sessions/{sessionId}
```

---

## Decision 3: Welcome Screen Component Reuse

**Decision**: Reuse existing `WelcomePreview`, `ExperienceCards`, and `ExperienceCard` components from `features/events/`.

**Rationale**:
- Components already render welcome content with theme support
- Ensures visual consistency between admin preview and guest flow (WYSIWYG)
- Reduces code duplication
- Components use `useEventTheme()` hook which works with `ThemeProvider`

**Alternatives Considered**:
- **Duplicate components in guest module**: Rejected - violates DRY, maintenance burden
- **Create abstraction layer**: Rejected - unnecessary complexity, components already work as-is

**Integration Pattern**:
```typescript
// features/guest/components/welcome-screen.tsx
import { WelcomePreview } from "@/features/events/components/welcome"
import { ThemeProvider } from "@/features/theming"

export function WelcomeScreen({ event, experiencesMap, onExperienceSelect }) {
  return (
    <ThemeProvider theme={event.theme}>
      <WelcomePreview
        welcome={event.welcome ?? DEFAULT_EVENT_WELCOME}
        event={event}
        experiencesMap={experiencesMap}
        onExperienceClick={onExperienceSelect}
      />
    </ThemeProvider>
  )
}
```

**Note**: May need to add `onExperienceClick` prop to `ExperienceCard` if not already present (for navigation).

---

## Decision 4: URL State Management Pattern

**Decision**: Use query parameters with `useSearchParams()` and `router.push()` for state management.

**Rationale**:
- Matches PRD specification (single route with query params)
- Enables shareable URLs for specific experiences
- Supports session resume on page refresh
- Next.js 16 provides native hooks for search params

**URL Structure**:
```
/join/[projectId]                           → Welcome screen
/join/[projectId]?exp={experienceId}        → Experience screen (new session)
/join/[projectId]?exp={id}&s={sessionId}    → Experience screen (resume)
```

**Implementation Pattern**:
```typescript
// In page component
const searchParams = useSearchParams()
const router = useRouter()

const experienceId = searchParams.get("exp")
const sessionId = searchParams.get("s")

// Navigate to experience
function selectExperience(expId: string) {
  router.push(`/join/${projectId}?exp=${expId}`)
}

// After session creation, update URL
function onSessionCreated(sessionId: string) {
  router.replace(`/join/${projectId}?exp=${experienceId}&s=${sessionId}`)
}
```

**Alternatives Considered**:
- **Nested routes** (`/join/[projectId]/[experienceId]`): Rejected - harder to manage session state
- **Client-side state only**: Rejected - breaks refresh/resume, not shareable
- **Cookie-based state**: Rejected - not visible in URL, harder to debug

---

## Decision 5: Data Fetching Strategy

**Decision**: Hybrid approach - Server Component for initial load, Client Components for auth and real-time updates.

**Rationale**:
- Project and event data can be fetched server-side (faster initial render)
- Authentication must happen client-side (Firebase Client SDK)
- Session creation/updates use Server Actions (Admin SDK for writes)
- Follows existing patterns in the codebase

**Data Flow**:
```
1. Layout (Server) → Fetch project, validate exists/live
2. Page (Server) → Fetch active event + experiences
3. Page (Client) → Initialize auth, create guest record
4. User Interaction → Server Action to create session
5. URL Update → Client-side navigation with session ID
```

**Alternatives Considered**:
- **All client-side**: Rejected - slower initial load, SEO concerns
- **All server-side with cookies**: Rejected - Firebase auth doesn't work that way
- **ISR/Static generation**: Rejected - events change frequently, needs fresh data

---

## Decision 6: Empty State Handling

**Decision**: Handle all empty states in the page component with dedicated UI.

**Rationale**:
- PRD specifies three distinct empty states
- Layout already handles project validation (404 for non-existent)
- Page handles event-level empty states

**Empty States**:
| Scenario | Source | UI |
|----------|--------|-----|
| Project not found | Layout | Next.js `notFound()` → 404 page |
| Project not live | Layout | "Event not found" (treat as 404) |
| No active event | Page | "Event has not been launched yet" |
| No enabled experiences | Page | "Event is empty" |

**Implementation Pattern**:
```typescript
// page.tsx
if (!event) {
  return <EmptyState message="Event has not been launched yet" />
}

const enabledExperiences = event.experiences.filter(e => e.enabled)
if (enabledExperiences.length === 0) {
  return <EmptyState message="Event is empty" />
}
```

---

## Decision 7: Session Validation on Resume

**Decision**: Validate session ownership by checking `guestId` matches current auth user.

**Rationale**:
- Prevents session hijacking via URL manipulation
- Simple comparison, no additional queries needed
- If mismatch, create new session transparently

**Validation Flow**:
```
1. Parse sessionId from URL (?s=xxx)
2. Fetch session from Firestore
3. Compare session.guestId with current auth user.uid
4. If match → resume session
5. If mismatch → create new session, update URL
```

**Alternatives Considered**:
- **Trust URL blindly**: Rejected - security concern
- **Require re-auth**: Rejected - friction for legitimate users
- **Session tokens**: Rejected - unnecessary complexity

---

## Decision 8: Experience Card Click Handling

**Decision**: Add `onExperienceClick` prop to `ExperienceCard` component (modification needed).

**Rationale**:
- Admin preview currently shows cards as static (no click handling)
- Guest flow needs click to navigate and create session
- Prop makes component reusable for both contexts

**Current vs Modified**:
```typescript
// Current (admin preview) - no click handler
<ExperienceCard experience={exp} />

// Modified - with optional click handler
<ExperienceCard
  experience={exp}
  onClick={() => onExperienceSelect(exp.experienceId)}
/>
```

**Alternatives Considered**:
- **Wrap in Link**: Rejected - need to create session first, then navigate
- **Separate component for guest**: Rejected - code duplication
- **Event delegation**: Rejected - harder to manage with grid/list layouts

---

## Existing Code References

### Key Files to Reuse

| File | Purpose | Location |
|------|---------|----------|
| ThemeProvider | Theme context | `features/theming/context/ThemeContext.tsx` |
| ThemedBackground | Background styling | `features/theming/components/ThemedBackground.tsx` |
| useEventTheme | Theme values hook | `features/theming/hooks/use-event-theme.ts` |
| WelcomePreview | Welcome layout | `features/events/components/welcome/WelcomePreview.tsx` |
| ExperienceCards | Card container | `features/events/components/welcome/ExperienceCards.tsx` |
| ExperienceCard | Individual card | `features/events/components/welcome/ExperienceCard.tsx` |
| getProject | Project fetch | `features/projects/repositories/projects.repository.ts` |
| getEvent | Event fetch | `features/events/repositories/events.repository.ts` |
| Firebase Client | Auth init | `lib/firebase/client.ts` |
| Firebase Admin | DB writes | `lib/firebase/admin.ts` |

### Key Types to Reference

| Type | Location |
|------|----------|
| Project | `features/projects/types/project.types.ts` |
| Event | `features/events/types/event.types.ts` |
| EventWelcome | `features/events/types/event.types.ts` |
| EventExperienceLink | `features/events/types/event.types.ts` |
| Theme | `features/theming/types/theme.types.ts` |
| Experience | `features/experiences/types/experiences.types.ts` |

### Existing Patterns to Follow

| Pattern | Example Location |
|---------|------------------|
| Server Action format | `features/events/actions/events.actions.ts` |
| Repository pattern | `features/projects/repositories/projects.repository.ts` |
| Zod schema definition | `features/events/schemas/event.schemas.ts` |
| Feature module exports | `features/events/index.ts` |
| Client hook pattern | `features/theming/hooks/use-event-theme.ts` |

---

## Open Questions (Resolved)

All technical questions have been resolved through codebase research. No outstanding clarifications needed.

---

## Next Steps

1. Create data-model.md with Guest and Session entity definitions
2. Define Server Action contracts in contracts/
3. Create quickstart.md with implementation guide
4. Proceed to task generation (/speckit.tasks)
