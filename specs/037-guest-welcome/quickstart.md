# Quickstart: Guest Access & Welcome

**Feature**: 037-guest-welcome
**Date**: 2026-01-20

## Prerequisites

Before implementing this feature, ensure:

1. **Development environment is set up**
   ```bash
   cd apps/clementine-app
   pnpm install
   pnpm dev  # Verify app runs at http://localhost:3000
   ```

2. **Firebase project is configured**
   - Anonymous authentication enabled in Firebase Console
   - Firestore rules allow guest access (see data-model.md)

3. **Test data exists**
   - At least one project with `activeEventId` set
   - At least one event with `publishedConfig` containing:
     - `welcome` configuration
     - `theme` configuration
     - `experiences.main` with at least one enabled experience
   - Experience documents in workspace collection

## Implementation Order

Follow this order to build incrementally:

### Phase 1: Route Structure (Est. 1-2 hours)

1. **Create join route layout**
   ```bash
   # Create route files
   touch src/app/join/route.tsx
   touch src/app/join/\$projectId.tsx
   mkdir -p src/app/join/\$projectId.experience
   touch src/app/join/\$projectId.experience/\$experienceId.tsx
   ```

2. **Implement basic layout** (`app/join/route.tsx`)
   - Copy pattern from `app/guest/route.tsx`
   - Render `<Outlet />` with no sidebar

3. **Verify routing works**
   - Visit `http://localhost:3000/join/test` - should render layout
   - Visit `http://localhost:3000/join/test/experience/exp1` - should render nested route

### Phase 2: Guest Domain Structure (Est. 1 hour)

1. **Create domain directories**
   ```bash
   mkdir -p src/domains/guest/components
   mkdir -p src/domains/guest/hooks
   mkdir -p src/domains/guest/schemas
   ```

2. **Create barrel exports**
   - `domains/guest/components/index.ts`
   - `domains/guest/hooks/index.ts`
   - `domains/guest/schemas/index.ts`

3. **Update domain index** (`domains/guest/index.ts`)
   - Export from new subdirectories

### Phase 3: Error Pages (Est. 1 hour)

1. **Create ErrorPage component** (`components/ErrorPage.tsx`)
   - Simple centered layout with 404 message
   - Accept optional title/message props

2. **Create ComingSoonPage component** (`components/ComingSoonPage.tsx`)
   - Centered layout with "Coming Soon" message
   - Accept optional title/message props

3. **Test standalone**
   - Temporarily render in route to verify styling

### Phase 4: Guest Record Schema (Est. 30 min)

1. **Create guest schema** (`schemas/guest.schema.ts`)
   ```typescript
   import { z } from 'zod'

   export const guestSchema = z.object({
     id: z.string().min(1),
     projectId: z.string().min(1),
     authUid: z.string().min(1),
     createdAt: z.number(),
   })

   export type Guest = z.infer<typeof guestSchema>
   ```

### Phase 5: Access Validation Hook (Est. 2-3 hours)

1. **Create useGuestAccess hook** (`hooks/useGuestAccess.ts`)
   - Use existing `useProject` hook
   - Use existing `useProjectEvent` hook
   - Return discriminated union state
   - See contracts/hooks.ts for interface

2. **Test hook**
   - Create temporary test component
   - Verify all states: loading, not-found, coming-soon, ready

### Phase 6: Guest Record Hook (Est. 1-2 hours)

1. **Create useGuestRecord hook** (`hooks/useGuestRecord.ts`)
   - Reuse anonymous auth pattern from `GuestExperiencePage.tsx`
   - Create guest record in Firestore on first visit
   - Return guest data when ready

2. **Test hook**
   - Verify guest record created in Firestore
   - Verify duplicate prevention works

### Phase 7: Experience Card Component (Est. 1-2 hours)

1. **Create ExperienceCard component** (`components/ExperienceCard.tsx`)
   - Display thumbnail and name
   - Minimum 44x44px touch target
   - Accept onSelect callback

2. **Create ExperienceCardList component** (`components/ExperienceCardList.tsx`)
   - Support list and grid layouts
   - Map experiences to cards

3. **Test with mock data**
   - Verify layout modes
   - Verify click handling

### Phase 8: Welcome Screen Container (Est. 2-3 hours)

1. **Create WelcomeScreenPage container** (`containers/WelcomeScreenPage.tsx`)
   - Use `useGuestAccess` for validation
   - Use `useGuestRecord` for guest management
   - Render ErrorPage/ComingSoonPage for error states
   - Wrap content with ThemeProvider
   - Use ThemedBackground, ThemedText from shared/theming
   - Render ExperienceCardList

2. **Wire to route** (`app/join/$projectId.tsx`)
   ```typescript
   import { WelcomeScreenPage } from '@/domains/guest'

   export const Route = createFileRoute('/join/$projectId')({
     component: JoinProjectPage,
   })

   function JoinProjectPage() {
     const { projectId } = Route.useParams()
     return <WelcomeScreenPage projectId={projectId} />
   }
   ```

### Phase 9: Experience Selection (Est. 2 hours)

1. **Add selection handler to WelcomeScreenPage**
   - Use existing `useCreateSession` hook
   - Create session on experience click
   - Navigate with session ID in URL

2. **Test full flow**
   - Click experience card
   - Verify session created in Firestore
   - Verify navigation to experience route

### Phase 10: Experience Placeholder (Est. 1 hour)

1. **Create ExperiencePlaceholder container** (`containers/ExperiencePlaceholder.tsx`)
   - Display "Experience loading..." message
   - Show session ID from URL param
   - Handle missing session ID (create new)

2. **Wire to route** (`app/join/$projectId.experience/$experienceId.tsx`)

### Phase 11: Cleanup & Migration (Est. 1 hour)

1. **Remove old guest routes**
   - Delete `app/guest/` directory
   - Update `domains/guest/containers/GuestExperiencePage.tsx` or remove

2. **Update domain exports**
   - Ensure all new components exported from `domains/guest/index.ts`

3. **Run validation**
   ```bash
   pnpm app:check  # Format + lint
   pnpm app:type-check  # TypeScript
   ```

## Verification Checklist

After implementation, verify each acceptance criteria:

- [ ] `/join/{projectId}` route displays welcome screen
- [ ] 404 shown for invalid project ID
- [ ] "Coming Soon" shown for unpublished event
- [ ] Guest record created on first visit
- [ ] Welcome screen shows event title/description
- [ ] Experience cards display thumbnail and name
- [ ] Clicking experience navigates with session ID
- [ ] Experience placeholder shows session ID

## Debugging Tips

### Guest record not created?
- Check Firebase Console > Authentication > Anonymous users
- Verify Firestore rules allow write to guests collection

### Event not loading?
- Check `project.activeEventId` is set
- Check event has `publishedConfig` (not just `draftConfig`)

### Experiences not showing?
- Check `publishedConfig.experiences.main` has entries
- Check entries have `enabled: true`
- Check experience documents exist in workspace collection

### Theme not applying?
- Verify ThemeProvider wraps themed components
- Check `publishedConfig.theme` is not null

## Quick Reference

### Critical Standard
**MUST READ BEFORE IMPLEMENTING**: `standards/frontend/data-fetching.md`

### Canonical Implementation Examples
The session domain has the best examples of correctly implemented hooks:
- `domains/session/shared/hooks/useSubscribeSession.ts` - Real-time query hook
- `domains/session/shared/hooks/useCreateSession.ts` - Mutation hook with transaction
- `domains/session/shared/queries/session.query.ts` - Query key factory pattern

### Existing Hooks to Reuse
- `useProject(projectId)` - Project with real-time updates
- `useProjectEvent(projectId, eventId)` - Event with real-time updates
- `useCreateSession()` - Session creation mutation
- `useAuth()` - Auth context (user, isLoading, isAnonymous)

### Existing Components to Reuse
- `ThemeProvider` - Theme context provider
- `ThemedBackground` - Themed container
- `ThemedText` - Themed text (heading, body, small)
- `ThemedButton` - Themed button

### Key File Paths
- **Data fetching standard**: `standards/frontend/data-fetching.md`
- Session hooks (canonical): `src/domains/session/shared/hooks/`
- Route layout pattern: `src/app/guest/route.tsx`
- Auth pattern: `src/domains/guest/containers/GuestExperiencePage.tsx:16-42`
- Real-time hook pattern: `src/domains/project/shared/hooks/useProject.ts`
- Session creation: `src/domains/session/shared/hooks/useCreateSession.ts`
- Welcome preview: `src/domains/event/welcome/components/WelcomePreview.tsx`
