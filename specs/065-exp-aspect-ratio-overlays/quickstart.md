# Quickstart: Experience-Level Aspect Ratio & Overlay System

**Feature**: 065-exp-aspect-ratio-overlays
**Date**: 2026-02-06

## Prerequisites

- Node.js 20+
- pnpm 10.18.1+
- Firebase CLI (`npm install -g firebase-tools`)
- Access to Clementine Firebase project

## Setup

```bash
# Clone and checkout feature branch
git checkout 065-exp-aspect-ratio-overlays

# Install dependencies
pnpm install

# Build shared package (required before app)
pnpm --filter @clementine/shared build
```

## Development

### Start Frontend App

```bash
# From repo root
pnpm app:dev

# Opens at http://localhost:3000
```

### Start Firebase Emulators (optional, for local testing)

```bash
# From repo root
cd functions && pnpm serve

# Emulators: Firestore (8080), Storage (9199), Functions (5001)
```

## Implementation Order

Complete these tasks in order. Each can be independently tested.

### Phase 1: Shared Schema Package

**Goal**: Create canonical aspect ratio definitions and flatten job schema

```bash
cd packages/shared
```

1. Create `src/schemas/media/aspect-ratio.schema.ts` (canonical definitions)
2. Update `src/schemas/media/index.ts` (export aspect-ratio)
3. Update `src/schemas/index.ts` (export from media module)
4. Update `src/schemas/project/project-config.schema.ts` (extend overlays to 5 keys)
5. Update `src/schemas/experience/outcome.schema.ts` (import canonical, remove 16:9)
6. Update `src/schemas/experience/steps/capture-photo.schema.ts` (import canonical)
7. Update `src/schemas/job/job.schema.ts`:
   - Add `overlayChoice` field
   - Add `experienceRef` field at top level
   - Remove `projectContext` and related schemas
   - Remove deprecated type exports

**Verify**:
```bash
pnpm build && pnpm test
```

### Phase 2: Frontend - Overlay Editor

**Goal**: Support all 5 overlay slots in UI

```bash
cd apps/clementine-app
```

1. Update `src/domains/project-config/settings/components/OverlaySection.tsx`
   - Render 5 slots instead of 2
   - Layout: grid with 2 columns on mobile, more on desktop
2. Update `src/domains/project-config/settings/components/OverlayFrame.tsx`
   - Support "default" variant styling (different icon, dashed border)
3. Update `src/domains/project-config/settings/hooks/useUpdateOverlays.ts`
   - Handle new aspect ratio keys

**Verify**:
```bash
pnpm dev
# Navigate to Project Settings → Overlays
# Should see 5 slots: 1:1, 3:2, 2:3, 9:16, Default
```

### Phase 3: Frontend - Experience Configuration

**Goal**: Sync aspect ratio options with canonical schema

1. Update `src/domains/experience/create/lib/model-options.ts`
   - Import from canonical schema (remove 16:9)

**Verify**:
```bash
# Navigate to Experience → Create/Edit → Outcome
# Aspect ratio dropdown should show: 1:1, 3:2, 2:3, 9:16 (no 16:9)
```

### Phase 4: Backend - Overlay Resolution at Job Creation

**Goal**: Resolve overlay choice in callable, simplify transform

```bash
cd functions
```

1. Create `src/repositories/project.ts` (fetchProject helper)
2. Update `src/callable/startTransformPipeline.ts`:
   - Import fetchProject
   - Add `resolveOverlayChoice()` function
   - Get experienceRef from project config
   - Resolve overlayChoice based on aspect ratio
   - Pass overlayChoice and experienceRef to buildJobSnapshot
3. Update `src/repositories/job.ts`:
   - Update `buildJobSnapshot` to accept overlayChoice and experienceRef
   - Remove projectContext building logic

**Verify**:
```bash
pnpm build
# Test with Firebase emulators
```

### Phase 5: Backend - Simplify Transform

**Goal**: Use pre-resolved overlayChoice directly

1. Update `src/services/transform/outcomes/imageOutcome.ts`:
   - Change from `projectContext?.overlays` lookup to `snapshot.overlayChoice`
   - Simplify overlay application logic
2. Update `src/services/transform/operations/applyOverlay.ts`:
   - Remove `getOverlayForAspectRatio()` helper (no longer needed)

**Verify**:
```bash
pnpm build
# Deploy to staging and test end-to-end
```

## Testing Checklist

### Schema Tests

```bash
cd packages/shared
pnpm test
```

- [ ] `aspectRatioSchema` validates '1:1', '3:2', '2:3', '9:16'
- [ ] `aspectRatioSchema` rejects '16:9', 'auto', invalid strings
- [ ] `overlayKeySchema` includes 'default'
- [ ] `overlaysConfigSchema` allows null for all fields
- [ ] `videoAspectRatioSchema` only allows '9:16', '1:1'
- [ ] `jobSnapshotSchema` has `overlayChoice` field
- [ ] `jobSnapshotSchema` has `experienceRef` field
- [ ] `projectContextSnapshotSchema` is removed

### Frontend Tests

```bash
cd apps/clementine-app
pnpm test
```

- [ ] OverlaySection renders 5 slots
- [ ] OverlayFrame handles default variant styling
- [ ] Upload works for new aspect ratios (3:2, 2:3, default)

### Integration Tests

Manual testing with dev server:

1. **Overlay Upload Flow**
   - [ ] Upload overlay for 3:2 ratio
   - [ ] Upload overlay for 2:3 ratio
   - [ ] Upload default overlay
   - [ ] Verify each displays correctly in UI
   - [ ] Remove an overlay, verify removed

2. **Experience Configuration Flow**
   - [ ] Create experience with 3:2 output ratio
   - [ ] Verify aspect ratio options don't include 16:9

3. **Overlay Resolution Flow** (requires backend)
   - [ ] Create job with 3:2 ratio, 3:2 overlay exists → applies 3:2 overlay
   - [ ] Create job with 2:3 ratio, no 2:3 overlay, default exists → applies default
   - [ ] Create job with 2:3 ratio, no 2:3 overlay, no default → no overlay applied
   - [ ] Create job with applyOverlay=false → no overlay applied

## File Locations Reference

### Shared Package
```
packages/shared/src/schemas/
├── media/
│   ├── media-reference.schema.ts  # Existing
│   ├── aspect-ratio.schema.ts     # NEW
│   └── index.ts                   # UPDATE
├── project/
│   └── project-config.schema.ts   # UPDATE (overlays)
├── experience/
│   ├── outcome.schema.ts          # UPDATE (import canonical)
│   └── steps/
│       └── capture-photo.schema.ts # UPDATE (import canonical)
└── job/
    └── job.schema.ts              # UPDATE (flatten, remove projectContext)
```

### Frontend App
```
apps/clementine-app/src/domains/
├── project-config/settings/
│   ├── components/
│   │   ├── OverlaySection.tsx   # UPDATE
│   │   └── OverlayFrame.tsx     # UPDATE
│   └── hooks/
│       └── useUpdateOverlays.ts # UPDATE
└── experience/create/lib/
    └── model-options.ts         # UPDATE
```

### Backend Functions
```
functions/src/
├── callable/
│   └── startTransformPipeline.ts  # UPDATE (add overlay resolution)
├── repositories/
│   ├── job.ts                     # UPDATE (buildJobSnapshot)
│   └── project.ts                 # NEW (fetchProject)
└── services/transform/
    ├── operations/
    │   └── applyOverlay.ts        # SIMPLIFY (remove resolution helper)
    └── outcomes/
        └── imageOutcome.ts        # SIMPLIFY (use overlayChoice directly)
```

## Troubleshooting

### Build Errors in App

```bash
# Rebuild shared package first
pnpm --filter @clementine/shared build

# Then rebuild app
pnpm --filter @clementine/app build
```

### Type Errors After Schema Changes

```bash
# Clear TypeScript cache
rm -rf apps/clementine-app/.vinxi
pnpm app:type-check
```

### Firestore Permission Errors

- Check Firebase security rules include new overlay keys
- Verify user has workspace write access
- Check emulator is running if testing locally

## Deployment

### Deploy Functions Only

```bash
pnpm functions:deploy
```

### Deploy Frontend

```bash
pnpm app:deploy
# or
pnpm app:deploy 065-exp-aspect-ratio-overlays  # specific branch
```

### Deploy Firebase Rules

```bash
pnpm fb:deploy:rules
```

## Validation Commands

Before committing:

```bash
# From repo root
pnpm app:check        # Format + lint + type-check
pnpm app:test         # Run tests
pnpm --filter @clementine/shared test  # Shared package tests
```
