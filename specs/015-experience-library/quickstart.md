# Quickstart: Experience Library

**Feature**: 015-experience-library
**Date**: 2025-12-02

## Prerequisites

- Node.js 18+
- pnpm 8+
- Firebase project configured
- Local environment variables set up

## Setup

```bash
# From repository root
cd /path/to/clementine

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

## Key Files

### Feature Module Location

```
web/src/features/experiences/
├── types/experiences.types.ts      # TypeScript interfaces
├── schemas/experiences.schemas.ts  # Zod validation
├── repositories/experiences.repository.ts
├── actions/experiences.ts          # Server actions
├── hooks/                          # React hooks
│   ├── useExperiences.ts
│   ├── useSteps.ts
│   └── useStepMutations.ts
└── components/
    ├── ExperienceList.tsx
    ├── ExperienceCard.tsx
    └── editor/ExperienceEditor.tsx
```

### App Routes

```
web/src/app/(workspace)/[companySlug]/exps/
├── page.tsx          # Experience list
└── [expId]/page.tsx  # Experience editor
```

## Development Workflow

### 1. Create the Feature Module

Copy the journeys module structure:
```bash
cp -r web/src/features/journeys web/src/features/experiences
```

Then refactor:
- Rename all `Journey` → `Experience`
- Rename `journeyId` → `experienceId`
- Remove `eventId` references
- Add `companyId` field
- Update collection paths

### 2. Update Firestore Paths

**Old (journeys)**:
```
/events/{eventId}/journeys/{journeyId}
/events/{eventId}/steps/{stepId}
```

**New (experiences)**:
```
/experiences/{experienceId}
/experiences/{experienceId}/steps/{stepId}
```

### 3. Implement Routes

Replace placeholder pages with actual implementations:
- `exps/page.tsx` → Render `<ExperienceList />`
- `exps/[expId]/page.tsx` → Render `<ExperienceEditor />`

### 4. Update Step Type Filtering

In `steps/constants.ts`, mark deprecated types:
```typescript
{ type: 'experience-picker', deprecated: true }
```

In `StepTypeSelector.tsx`, filter deprecated:
```typescript
const available = STEP_TYPE_META.filter(t => !t.deprecated);
```

## Validation

Before completing each task:

```bash
# Run linting
pnpm lint

# Run type checking
pnpm type-check

# Run tests
pnpm test
```

## Testing Checklist

- [ ] Navigate to `/exps` → See experience list (or empty state)
- [ ] Create new experience → Appears in list
- [ ] Click experience → Opens editor
- [ ] Add step → Appears in step list
- [ ] Edit step → Changes persist
- [ ] Reorder steps → Order persists
- [ ] Rename experience → Name updates
- [ ] Delete experience → Removed from list (soft delete)
- [ ] Mobile viewport → All interactions work

## Common Issues

### Firebase Permission Denied
- Ensure security rules allow reads on `/experiences`
- Ensure Admin SDK is used for writes (Server Actions)

### Steps Not Showing
- Check `experienceId` matches in subcollection path
- Verify `stepsOrder` array is populated

### Real-time Updates Not Working
- Check Client SDK initialization
- Verify `onSnapshot` subscription is active
- Check for errors in browser console

## Architecture Notes

### Company Scoping
All experiences are filtered by `companyId`:
```typescript
query(
  collection(db, "experiences"),
  where("companyId", "==", companyId),
  where("status", "==", "active")
)
```

### Step Ordering
Steps are ordered via the `experience.stepsOrder` array, not Firestore ordering:
```typescript
const orderedSteps = stepsOrder
  .map(id => steps.find(s => s.id === id))
  .filter(Boolean);
```

### Server vs Client SDK
- **Server Actions** (create, update, delete) → Admin SDK
- **Real-time subscriptions** (list, watch) → Client SDK
