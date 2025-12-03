# Quickstart: Nested Events

**Feature**: 017-nested-events
**Date**: 2025-12-03

## Prerequisites

- Node.js 18+ and pnpm installed
- Firebase project configured (Firestore, Storage)
- Environment variables set in `web/.env.local`
- Phase 4 (Projects) complete and stable

## Development Setup

```bash
# Navigate to repo root
cd clementine

# Install dependencies
pnpm install

# Start development server
pnpm dev

# Open http://localhost:3000
```

## Feature Module Location

All new code goes in `web/src/features/events/`:

```
features/events/
├── actions/          # Server Actions (Admin SDK)
├── components/       # React components
├── hooks/            # Real-time hooks (Client SDK)
├── repositories/     # Firestore operations
├── schemas/          # Zod validation schemas
├── types/            # TypeScript types
├── constants.ts      # Default values, constants
└── index.ts          # Public exports
```

## Implementation Order

### Phase 1: Foundation (Types, Schemas, Constants)

1. Create `types/event.types.ts` - Event, EventTheme, EventExperienceLink
2. Create `schemas/events.schemas.ts` - Zod schemas
3. Create `constants.ts` - DEFAULT_EVENT_THEME, NAME_LENGTH
4. Create barrel exports (`index.ts` files)

### Phase 2: Data Layer (Repository, Actions)

1. Create `repositories/events.repository.ts` - CRUD operations
2. Create `actions/events.actions.ts` - Server Actions
3. Add `setActiveEventAction` to update Project.activeEventId

### Phase 3: Hooks (Real-time)

1. Create `hooks/useEvent.ts` - Single event subscription
2. Create `hooks/useEvents.ts` - Events list subscription

### Phase 4: Components

1. Create `components/EventCard.tsx` - List item card
2. Create `components/EventList.tsx` - List with empty state
3. Create `components/EventExperiencesTab.tsx` - WIP placeholder
4. Create `components/designer/EventThemeEditor.tsx` - Adapted from ThemeEditor

### Phase 5: Pages (Update Existing Placeholders)

Routes already exist at `web/src/app/(workspace)/[companySlug]/[projectId]/`:

1. Update `features/projects/components/ProjectEventsTab.tsx` - Replace placeholder with EventList
2. Update `[eventId]/experiences/page.tsx` - Use EventExperiencesTab component
3. Update `[eventId]/theme/page.tsx` - Use EventThemeEditor component

## Validation Loop

Before marking tasks complete:

```bash
# Run all checks
pnpm lint
pnpm type-check
pnpm test

# Test in browser
pnpm dev
# Navigate to /{companySlug}/{projectId}/events → Events tab
```

## Key Files to Reference

| Purpose | Reference File |
|---------|----------------|
| Types pattern | `features/projects/types/project.types.ts` |
| Schema pattern | `features/projects/schemas/projects.schemas.ts` |
| Repository pattern | `features/projects/repositories/projects.repository.ts` |
| Actions pattern | `features/projects/actions/projects.actions.ts` |
| Theme editor | `features/projects/components/designer/ThemeEditor.tsx` |
| Real-time hook | `features/projects/hooks/useProject.ts` |
| Events list page | `app/(workspace)/[companySlug]/[projectId]/events/page.tsx` |
| Event theme page | `app/(workspace)/[companySlug]/[projectId]/[eventId]/theme/page.tsx` |
| Project layout | `app/(workspace)/[companySlug]/[projectId]/layout.tsx` |

## Testing Strategy

1. **Unit tests** for critical paths:
   - Event creation with default theme
   - Theme update validation
   - Soft delete behavior

2. **Manual testing**:
   - Create event in empty project
   - Customize theme and verify preview
   - Set event as active
   - Delete active event (verify activeEventId cleared)

## Common Issues

### Firestore Permission Denied

Ensure admin secret is set in environment:
```bash
# web/.env.local
ADMIN_SECRET=your-secret
```

### TypeScript Errors

Run type-check to catch issues early:
```bash
pnpm type-check
```

### Theme Not Updating

Check that Server Action uses dot notation for partial updates:
```typescript
updateData["theme.primaryColor"] = value;
```
