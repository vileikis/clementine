# Quickstart Guide: Guest Flow

**Feature**: 026-guest-flow
**Date**: 2024-12-11

## Overview

This guide provides a step-by-step implementation path for the guest flow feature. Follow these sections in order.

---

## Prerequisites

Before implementing, ensure:

1. **Theming module** is complete (`features/theming/`)
2. **Project/Event modules** have working repositories and actions
3. **Firebase Client SDK** is configured (`lib/firebase/client.ts`)
4. **Welcome screen components** exist in events module (will be migrated to guest)

---

## Implementation Order

### Phase 1: Types & Schemas

1. **Create guest types** (`features/guest/types/guest.types.ts`)
   - Define `Guest` interface
   - Define `Session` interface
   - Define `SessionState` union type
   - Define `GuestAuthState` for hook return

2. **Create Zod schemas** (`features/guest/schemas/guest.schemas.ts`)
   - `guestSchema` - Full guest validation
   - `createGuestSchema` - Input validation
   - `sessionSchema` - Full session validation
   - `createSessionSchema` - Input validation
   - `sessionStateSchema` - State enum

3. **Export types** - Update barrel exports in `types/index.ts` and `schemas/index.ts`

### Phase 2: Repository Layer

4. **Create guest repository** (`features/guest/repositories/guests.repository.ts`)
   - `getGuest(projectId, guestId)` - Fetch guest by ID
   - `createGuest(projectId, data)` - Create guest record
   - `updateGuestLastSeen(projectId, guestId)` - Touch timestamp

5. **Create session repository** (same file or separate)
   - `getSession(projectId, sessionId)` - Fetch session by ID
   - `createSession(projectId, data)` - Create session record
   - `getSessionsByGuest(projectId, guestId)` - Query guest's sessions

6. **Export repositories** - Update `repositories/index.ts`

### Phase 3: Server Actions

7. **Create guest actions** (`features/guest/actions/guests.actions.ts`)
   - `createGuestAction` - Create or get existing guest
   - `createSessionAction` - Create new session
   - `getSessionAction` - Fetch session by ID
   - `validateSessionOwnershipAction` - Verify session belongs to guest

8. **Follow patterns from** `features/events/actions/events.actions.ts`:
   - Add `"use server"` directive
   - Use `ActionResponse<T>` return type
   - Catch errors and return structured error responses
   - Validate inputs with Zod schemas

### Phase 4: Client Hooks

9. **Create auth hook** (`features/guest/hooks/useGuestAuth.ts`)
   ```typescript
   export function useGuestAuth() {
     // State: user, loading, error
     // Effect: onAuthStateChanged listener
     // On no user: signInAnonymously()
     // Return: { user, userId, loading, error }
   }
   ```

10. **Create session hook** (`features/guest/hooks/useSession.ts`)
    ```typescript
    export function useSession(projectId, experienceId, sessionId) {
      // State: session, loading
      // Effect: validate session on mount (if sessionId)
      // Handle: ownership validation, create if needed
      // Return: { session, loading, createSession }
    }
    ```

### Phase 5: Context & Components

11. **Create guest context** (`features/guest/contexts/GuestContext.tsx`)
    - Define `GuestContextValue` type
    - Create context with `createContext`
    - Export `GuestProvider` component (wraps children with auth)
    - Export `useGuestContext` hook
    - Manages guest record creation on auth

12. **Migrate welcome components** (`features/guest/components/welcome/`)
    - Move `WelcomeContent.tsx` from events (rename from WelcomePreview if needed)
    - Move `ExperienceCards.tsx` from events
    - Move `ExperienceCard.tsx` from events
    - Add `onClick` prop to `ExperienceCard` for navigation
    - Update barrel exports in `welcome/index.ts`

13. **Update admin preview** (`features/events/components/welcome/WelcomePreview.tsx`)
    - Make thin wrapper that imports from guest module
    - Wrap in PreviewShell infrastructure
    - Pass `onClick={undefined}` to disable interaction in preview

14. **Create loading screen** (`features/guest/components/LoadingScreen.tsx`)
    - Full-screen loading indicator
    - Optionally accepts theme for branded loading

15. **Create empty states** (`features/guest/components/EmptyStates.tsx`)
    - `NoActiveEvent` - "Event has not been launched yet"
    - `EmptyEvent` - "Event is empty"
    - Apply theme if available

16. **Create experience screen** (`features/guest/components/ExperienceScreen.tsx`)
    - Placeholder for MVP
    - Shows experience name, guest ID, session ID
    - Home button to return to welcome

### Phase 6: Page Integration

17. **Update join page** (`app/(public)/join/[projectId]/page.tsx`)
    - Fetch event using `activeEventId` from project (layout provides project)
    - Render `GuestProvider` wrapper
    - Conditionally render:
      - `LoadingScreen` while auth/data loading
      - `NoActiveEvent` if no event
      - `EmptyEvent` if no enabled experiences
      - `WelcomeContent` if no `exp` param
      - `ExperienceScreen` if `exp` param present

18. **Handle URL state**
    - Read `exp` and `s` from `useSearchParams()`
    - Update URL after session creation
    - Clear params on home navigation

---

## Key Patterns

### Firebase Auth in Hooks

```typescript
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth"
import { app } from "@/lib/firebase/client"

useEffect(() => {
  const auth = getAuth(app)
  const unsubscribe = onAuthStateChanged(auth, async (user) => {
    if (user) {
      setUser(user)
    } else {
      await signInAnonymously(auth)
    }
  })
  return unsubscribe
}, [])
```

### Server Action Pattern

```typescript
"use server"

import { createGuestSchema } from "../schemas"
import { createGuest, getGuest } from "../repositories"

export async function createGuestAction(
  projectId: string,
  authUid: string
): Promise<ActionResponse<Guest>> {
  try {
    const validated = createGuestSchema.parse({ projectId, authUid, ... })

    // Check existing
    const existing = await getGuest(projectId, authUid)
    if (existing) {
      await updateGuestLastSeen(projectId, authUid)
      return { success: true, data: existing }
    }

    // Create new
    const guest = await createGuest(projectId, validated)
    return { success: true, data: guest }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: { code: "VALIDATION_ERROR", message: error.message } }
    }
    return { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to create guest" } }
  }
}
```

### URL Navigation

```typescript
const router = useRouter()
const searchParams = useSearchParams()

// Navigate to experience
function selectExperience(expId: string) {
  router.push(`/join/${projectId}?exp=${expId}`)
}

// Update URL with session (no history entry)
function updateSessionUrl(sessionId: string) {
  const expId = searchParams.get("exp")
  router.replace(`/join/${projectId}?exp=${expId}&s=${sessionId}`)
}

// Return to welcome
function goHome() {
  router.push(`/join/${projectId}`)
}
```

### Theme Integration

```typescript
import { ThemeProvider, ThemedBackground } from "@/features/theming"
import { WelcomeContent } from "@/features/guest/components/welcome"

function JoinPage({ event, experiencesMap, ... }) {
  return (
    <ThemeProvider theme={event.theme}>
      <ThemedBackground
        background={event.theme.background}
        fontFamily={event.theme.fontFamily}
      >
        <WelcomeContent
          welcome={event.welcome}
          event={event}
          experiencesMap={experiencesMap}
          onExperienceClick={handleSelect}  // Interactive in guest flow
        />
      </ThemedBackground>
    </ThemeProvider>
  )
}
```

---

## Testing Strategy

### Unit Tests (Critical Path)

1. **useGuestAuth hook**
   - Test: Returns user after signInAnonymously
   - Test: Returns loading=true initially
   - Test: Handles auth errors gracefully

2. **createGuestAction**
   - Test: Creates guest on first visit
   - Test: Returns existing guest on repeat visit
   - Test: Validates input with Zod

3. **createSessionAction**
   - Test: Creates session with correct fields
   - Test: Validates experience is enabled
   - Test: Returns error for invalid guest

4. **validateSessionOwnershipAction**
   - Test: Returns valid=true for matching guest
   - Test: Returns valid=false for different guest
   - Test: Returns valid=false for non-existent session

### Integration Tests (Manual)

1. Visit `/join/{projectId}` → Welcome screen displays
2. Click experience → URL updates, experience screen shows
3. Refresh page → Session persists
4. Clear cookies → New session created

---

## Validation Checklist

Before marking complete:

- [ ] `pnpm lint` passes
- [ ] `pnpm type-check` passes
- [ ] `pnpm test` passes (new tests)
- [ ] Manual test on mobile viewport (320px)
- [ ] All empty states display correctly
- [ ] Theme applies to all screens
- [ ] URL state works (exp param, s param)
- [ ] Session persists on refresh

---

## File Checklist

```
features/guest/
├── index.ts                    # Public exports
├── types/
│   ├── index.ts
│   └── guest.types.ts          # Guest, Session, GuestAuthState
├── schemas/
│   ├── index.ts
│   └── guest.schemas.ts        # Zod schemas
├── repositories/
│   ├── index.ts
│   └── guests.repository.ts    # Firestore CRUD
├── actions/
│   ├── index.ts
│   └── guests.actions.ts       # Server Actions
├── contexts/
│   ├── index.ts
│   └── GuestContext.tsx        # Auth + guest state context
├── hooks/
│   ├── index.ts
│   ├── useGuestAuth.ts         # Anonymous auth
│   └── useSession.ts           # Session management
└── components/
    ├── index.ts
    ├── ExperienceScreen.tsx    # Placeholder experience view
    ├── LoadingScreen.tsx       # Loading state
    ├── EmptyStates.tsx         # Error states
    └── welcome/
        ├── index.ts
        ├── WelcomeContent.tsx  # Main welcome layout (migrated)
        ├── ExperienceCards.tsx # Card container (migrated)
        └── ExperienceCard.tsx  # Individual card (migrated)
```

---

## Common Pitfalls

1. **Don't import Server Actions in Client Components directly** - use them via event handlers
2. **Don't forget "use client" directive** on hooks and components using Firebase Client SDK
3. **Don't store `User` object in state** - store only what you need (uid, etc.)
4. **Don't call signInAnonymously multiple times** - use onAuthStateChanged to detect auth state
5. **Don't forget to validate sessionId from URL** - it could be manipulated
