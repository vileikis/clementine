# Quickstart Guide: Loading State Editor Implementation

**Date**: 2026-01-28
**Feature**: Loading State Editor for Share Screen
**Estimated Time**: 4-6 hours

## Overview

This guide provides step-by-step implementation instructions for the loading state editor feature. Follow phases in order to maintain working code at each checkpoint.

---

## Prerequisites

- [ ] Read [spec.md](./spec.md) (feature requirements)
- [ ] Read [plan.md](./plan.md) (architecture decisions)
- [ ] Read [research.md](./research.md) (existing patterns)
- [ ] Read [data-model.md](./data-model.md) (schema definitions)
- [ ] Branch checked out: `044-loading-state-editor`
- [ ] Dev server running: `pnpm app:dev`

---

## Phase A: Schema & Data Layer (1-1.5 hours)

### A1. Update Project Config Schema

**File**: `packages/shared/src/schemas/project/project-config.schema.ts`

**Changes**:

1. Add ShareLoadingConfig schema:
```typescript
/**
 * Share Loading State Configuration
 * Shown while AI generation is in progress
 */
export const shareLoadingConfigSchema = z.object({
  title: z.string().nullable().default(null),
  description: z.string().nullable().default(null),
})
```

2. Rename ShareConfig schema (keep old export):
```typescript
/**
 * Share Ready State Configuration
 * (Formerly "shareConfigSchema" - renamed for clarity)
 */
export const shareReadyConfigSchema = z.object({
  title: z.string().nullable().default(null),
  description: z.string().nullable().default(null),
  cta: ctaConfigSchema.nullable().default(null),
})

/** @deprecated Use shareReadyConfigSchema instead */
export const shareConfigSchema = shareReadyConfigSchema
```

3. Update projectConfigSchema:
```typescript
export const projectConfigSchema = z.looseObject({
  schemaVersion: z.number().default(CURRENT_CONFIG_VERSION),
  overlays: overlaysConfigSchema,
  shareReady: shareReadyConfigSchema.nullable().default(null),     // ← Renamed
  shareLoading: shareLoadingConfigSchema.nullable().default(null),  // ← New
  shareOptions: shareOptionsConfigSchema.nullable().default(null),
  welcome: welcomeConfigSchema.nullable().default(null),
  theme: themeSchema.nullable().default(null),
  experiences: experiencesConfigSchema.nullable().default(null),
})
```

4. Export new types:
```typescript
export type ShareLoadingConfig = z.infer<typeof shareLoadingConfigSchema>
export type ShareReadyConfig = z.infer<typeof shareReadyConfigSchema>

/** @deprecated Use ShareReadyConfig instead */
export type ShareConfig = ShareReadyConfig
```

**Test**: Run `pnpm --filter @clementine/shared build` (should succeed)

---

### A2. Update Default Constants

**File**: `apps/clementine-app/src/domains/project-config/share/constants/defaults.ts`

**Changes**:

1. Add DEFAULT_SHARE_LOADING:
```typescript
export const DEFAULT_SHARE_LOADING: ShareLoadingConfig = {
  title: 'Creating your experience...',
  description: 'This usually takes 30-60 seconds. Please wait while we generate your personalized result.',
}
```

2. Rename DEFAULT_SHARE (keep old export):
```typescript
export const DEFAULT_SHARE_READY: ShareReadyConfig = {
  title: null,
  description: null,
  cta: null,
}

/** @deprecated Use DEFAULT_SHARE_READY instead */
export const DEFAULT_SHARE = DEFAULT_SHARE_READY
```

**Test**: Import in ShareEditorPage (should have no type errors)

---

### A3. Create useUpdateShareLoading Hook

**File**: `apps/clementine-app/src/domains/project-config/share/hooks/useUpdateShareLoading.ts` (NEW)

**Content**:
```typescript
import { useProjectConfigMutation } from '@/domains/project-config/shared'
import { useTrackedMutation } from '@/shared/editor-status'
import { shareLoadingConfigSchema } from '@clementine/shared'

/**
 * Update share loading state configuration
 * Validates with shareLoadingConfigSchema before save
 */
export function useUpdateShareLoading(projectId: string) {
  const mutation = useProjectConfigMutation(
    projectId,
    ['shareLoading'],
    shareLoadingConfigSchema,
  )

  return useTrackedMutation(mutation, {
    domain: 'project-config',
    operation: 'update-share-loading',
  })
}
```

**Test**: Import in ShareEditorPage (should compile)

---

### A4. Rename useUpdateShare Hook

**Action**: Rename file and exports for backward compatibility

**File**: `apps/clementine-app/src/domains/project-config/share/hooks/useUpdateShare.ts`
→ **Rename to**: `useUpdateShareReady.ts`

**Changes in file**:
```typescript
/**
 * Update share ready state configuration
 * (Formerly useUpdateShare - renamed for clarity)
 */
export function useUpdateShareReady(projectId: string) {
  const mutation = useProjectConfigMutation(
    projectId,
    ['shareReady'],
    shareReadyConfigSchema,
  )

  return useTrackedMutation(mutation, {
    domain: 'project-config',
    operation: 'update-share-ready',
  })
}

/** @deprecated Use useUpdateShareReady instead */
export const useUpdateShare = useUpdateShareReady
```

**Test**: Check git shows rename (not delete + add)

---

### A5. Update Barrel Export

**File**: `apps/clementine-app/src/domains/project-config/share/index.ts`

**Changes**:
```typescript
// Hooks
export { useUpdateShareReady, useUpdateShare } from './hooks/useUpdateShareReady'
export { useUpdateShareLoading } from './hooks/useUpdateShareLoading'
export { useUpdateShareOptions } from './hooks/useUpdateShareOptions'

// ... rest unchanged
```

**Test**: Run `pnpm app:type-check` (should pass)

**Checkpoint**: Schema and data layer complete. Commit work.

---

## Phase B: UI Components (1.5-2 hours)

### B1. Update PreviewShell

**File**: `apps/clementine-app/src/shared/preview-shell/containers/PreviewShell.tsx`

**Changes**:

1. Add headerSlot prop:
```typescript
interface PreviewShellProps {
  children: React.ReactNode
  enableViewportSwitcher?: boolean
  enableFullscreen?: boolean
  viewportMode?: ViewportMode
  onViewportChange?: (mode: ViewportMode) => void
  className?: string
  headerSlot?: React.ReactNode // ← New
}
```

2. Render headerSlot in header:
```typescript
<div className="border-b border-border px-4 py-2 flex items-center gap-4">
  {/* Custom header content */}
  {headerSlot}

  {/* Existing controls */}
  {enableViewportSwitcher && <ViewportSwitcher />}
  {enableFullscreen && <FullscreenToggle />}
</div>
```

**Test**: Verify existing editors still work (no visual changes)

---

### B2. Rename ShareConfigPanel

**Action**: Rename file and component

**File**: `apps/clementine-app/src/domains/project-config/share/components/ShareConfigPanel.tsx`
→ **Rename to**: `ShareReadyConfigPanel.tsx`

**Changes in file**:

1. Rename component:
```typescript
export interface ShareReadyConfigPanelProps {
  share: ShareReadyConfig,     // ← Update type
  shareOptions: ShareOptionsConfig,
  onShareUpdate: (updates: Partial<ShareReadyConfig>) => void,
  onCtaUpdate: (updates: Partial<CtaConfig>) => void,
  onShareOptionToggle: (field: keyof ShareOptionsConfig) => void,
  ctaUrlError?: string | null,
  onCtaUrlBlur?: () => void,
  disabled?: boolean,
}

export function ShareReadyConfigPanel({
  share,
  shareOptions,
  // ... rest unchanged
}: ShareReadyConfigPanelProps) {
  // Component body unchanged
}
```

2. Update imports in ShareEditorPage:
```typescript
import { ShareReadyConfigPanel } from '../components/ShareReadyConfigPanel'
```

**Test**: Verify share editor still renders ready state config

---

### B3. Create ShareLoadingConfigPanel

**File**: `apps/clementine-app/src/domains/project-config/share/components/ShareLoadingConfigPanel.tsx` (NEW)

**Content**:
```typescript
import { Label } from '@/ui-kit/components/label'
import { Textarea } from '@/ui-kit/components/textarea'
import type { ShareLoadingConfig } from '@clementine/shared'

export interface ShareLoadingConfigPanelProps {
  shareLoading: ShareLoadingConfig
  onShareLoadingUpdate: (updates: Partial<ShareLoadingConfig>) => void
  disabled?: boolean
}

export function ShareLoadingConfigPanel({
  shareLoading,
  onShareLoadingUpdate,
  disabled = false,
}: ShareLoadingConfigPanelProps) {
  return (
    <div className="space-y-6 p-4">
      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="loading-title">Loading Title</Label>
        <Textarea
          id="loading-title"
          value={shareLoading.title ?? ''}
          onChange={(e) => onShareLoadingUpdate({ title: e.target.value || null })}
          placeholder="Creating your experience..."
          rows={2}
          disabled={disabled}
        />
        <p className="text-xs text-muted-foreground">
          Shown to guests while AI generates their result
        </p>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="loading-description">Loading Description</Label>
        <Textarea
          id="loading-description"
          value={shareLoading.description ?? ''}
          onChange={(e) => onShareLoadingUpdate({ description: e.target.value || null })}
          placeholder="This usually takes 30-60 seconds. Please wait..."
          rows={4}
          disabled={disabled}
        />
        <p className="text-xs text-muted-foreground">
          Additional context about wait time or what's happening
        </p>
      </div>
    </div>
  )
}
```

**Test**: Import in ShareEditorPage (should compile)

---

### B4. Update SharePreview

**File**: `apps/clementine-app/src/domains/project-config/share/components/SharePreview.tsx`

**Changes**:

1. Update props:
```typescript
import { Skeleton } from '@/ui-kit/components/skeleton'

interface SharePreviewProps {
  previewState: 'ready' | 'loading' // ← New
  shareReady: ShareReadyConfig       // ← Renamed from share
  shareLoading: ShareLoadingConfig   // ← New
  shareOptions: ShareOptionsConfig
}
```

2. Add loading state rendering:
```typescript
export function SharePreview({
  previewState,
  shareReady,
  shareLoading,
  shareOptions,
}: SharePreviewProps) {
  // Loading state preview
  if (previewState === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center p-8 min-h-screen">
        {/* Image skeleton */}
        <Skeleton className="w-full aspect-square max-w-md mb-6 rounded-lg" />

        {/* Loading title */}
        <h1 className="text-2xl font-bold mb-2 text-center">
          {shareLoading.title || 'Creating your experience...'}
        </h1>

        {/* Loading description */}
        {(shareLoading.description || 'This usually takes 30-60 seconds.') && (
          <p className="text-muted-foreground text-center max-w-md">
            {shareLoading.description || 'This usually takes 30-60 seconds. Please wait while we generate your personalized result.'}
          </p>
        )}
      </div>
    )
  }

  // Ready state preview (existing implementation - update prop name)
  return (
    <div className="flex flex-col items-center justify-center p-8 min-h-screen">
      {/* Placeholder image */}
      <img
        src="/placeholder-result.jpg"
        alt="Result preview"
        className="w-full aspect-square max-w-md mb-6 rounded-lg object-cover"
      />

      {/* Ready title */}
      <h1 className="text-2xl font-bold mb-2 text-center">
        {shareReady.title || 'Your Experience'}
      </h1>

      {/* Ready description */}
      {shareReady.description && (
        <p className="text-muted-foreground text-center max-w-md mb-6">
          {shareReady.description}
        </p>
      )}

      {/* CTA Button */}
      {shareReady.cta?.label && shareReady.cta?.url && (
        <Button asChild className="mb-6">
          <a href={shareReady.cta.url} target="_blank" rel="noopener noreferrer">
            {shareReady.cta.label}
          </a>
        </Button>
      )}

      {/* Share buttons (using shareOptions) */}
      <ShareButtons options={shareOptions} />
    </div>
  )
}
```

**Test**: Import in ShareEditorPage (should compile)

**Checkpoint**: UI components complete. Test preview in isolation if needed.

---

## Phase C: Container Integration (2-2.5 hours)

### C1. Update ShareEditorPage Container

**File**: `apps/clementine-app/src/domains/project-config/share/containers/ShareEditorPage.tsx`

**Major Changes**:

1. Import new dependencies:
```typescript
import { Tabs, TabsList, TabsTrigger } from '@/ui-kit/components/tabs'
import { ShareReadyConfigPanel } from '../components/ShareReadyConfigPanel'
import { ShareLoadingConfigPanel } from '../components/ShareLoadingConfigPanel'
import { useUpdateShareReady } from '../hooks/useUpdateShareReady'
import { useUpdateShareLoading } from '../hooks/useUpdateShareLoading'
import { DEFAULT_SHARE_READY, DEFAULT_SHARE_LOADING } from '../constants/defaults'
import type { ShareReadyConfig, ShareLoadingConfig } from '@clementine/shared'
```

2. Add preview state:
```typescript
export function ShareEditorPage() {
  const { projectId } = useParams({ strict: false })
  const { data: project } = useProject(projectId ?? '')

  // Preview state (controls both preview and config panel)
  const [previewState, setPreviewState] = useState<'ready' | 'loading'>('ready')

  // ... rest of component
}
```

3. Add current configs:
```typescript
// Current configs from project
const currentShareReady = project?.draftConfig?.shareReady ?? DEFAULT_SHARE_READY
const currentShareLoading = project?.draftConfig?.shareLoading ?? DEFAULT_SHARE_LOADING
const currentShareOptions = project?.draftConfig?.shareOptions ?? DEFAULT_SHARE_OPTIONS
```

4. Create loading form:
```typescript
// Forms for both states
const shareReadyForm = useForm<ShareReadyConfig>({
  defaultValues: currentShareReady,
  values: currentShareReady,
})

const shareLoadingForm = useForm<ShareLoadingConfig>({
  defaultValues: currentShareLoading,
  values: currentShareLoading,
})
```

5. Add mutations:
```typescript
// Mutations
const updateShareReady = useUpdateShareReady(projectId!)
const updateShareLoading = useUpdateShareLoading(projectId!)
const updateShareOptions = useUpdateShareOptions(projectId!)
```

6. Add auto-save for loading form:
```typescript
// Auto-save for ready state (existing - update hook name)
useAutoSave({
  form: shareReadyForm,
  originalValues: currentShareReady,
  onUpdate: async () => {
    const fullShare = shareReadyForm.getValues()
    await updateShareReady.mutateAsync(fullShare)
  },
  fieldsToCompare: ['title', 'description', 'cta'],
  debounceMs: 2000,
})

// Auto-save for loading state (new)
useAutoSave({
  form: shareLoadingForm,
  originalValues: currentShareLoading,
  onUpdate: async () => {
    const fullShare = shareLoadingForm.getValues()
    await updateShareLoading.mutateAsync(fullShare)
  },
  fieldsToCompare: ['title', 'description'],
  debounceMs: 2000,
})
```

7. Watch both forms:
```typescript
// Watch both forms for preview
const watchedReady = useWatch({ control: shareReadyForm.control }) as ShareReadyConfig
const watchedLoading = useWatch({ control: shareLoadingForm.control }) as ShareLoadingConfig
```

8. Add loading state handlers:
```typescript
// Handle loading state updates
const handleShareLoadingUpdate = (updates: Partial<ShareLoadingConfig>) => {
  Object.entries(updates).forEach(([key, value]) => {
    shareLoadingForm.setValue(key as keyof ShareLoadingConfig, value, {
      shouldDirty: true,
    })
  })
}
```

9. Update JSX - Add state tabs to PreviewShell:
```typescript
<PreviewShell
  enableViewportSwitcher
  enableFullscreen
  headerSlot={
    <Tabs
      value={previewState}
      onValueChange={(v) => setPreviewState(v as 'ready' | 'loading')}
      className="mr-4"
    >
      <TabsList>
        <TabsTrigger value="ready">Ready</TabsTrigger>
        <TabsTrigger value="loading">Loading</TabsTrigger>
      </TabsList>
    </Tabs>
  }
>
  <ThemeProvider theme={currentTheme}>
    <SharePreview
      previewState={previewState}
      shareReady={watchedReady}
      shareLoading={watchedLoading}
      shareOptions={displayShareOptions}
    />
  </ThemeProvider>
</PreviewShell>
```

10. Update JSX - Conditional config panel:
```typescript
<aside className="w-80 shrink-0 border-r border-border overflow-y-auto bg-card">
  <div className="sticky top-0 z-10 border-b border-border bg-card px-4 py-3">
    <h2 className="font-semibold">
      Share Screen
      <span className="text-muted-foreground text-sm ml-2">
        · {previewState === 'ready' ? 'Ready' : 'Loading'}
      </span>
    </h2>
  </div>

  {previewState === 'ready' ? (
    <ShareReadyConfigPanel
      share={watchedReady}
      shareOptions={displayShareOptions}
      onShareUpdate={handleShareReadyUpdate}
      onCtaUpdate={handleCtaUpdate}
      onShareOptionToggle={handleShareOptionToggle}
      ctaUrlError={ctaUrlError}
      onCtaUrlBlur={handleCtaUrlBlur}
    />
  ) : (
    <ShareLoadingConfigPanel
      shareLoading={watchedLoading}
      onShareLoadingUpdate={handleShareLoadingUpdate}
    />
  )}
</aside>
```

**Test**: Run dev server, navigate to share editor, verify:
- Ready tab shows existing config panel
- Loading tab shows new config panel
- Preview updates when switching tabs
- Typing in fields updates preview in real-time

**Checkpoint**: Container integration complete. Feature functional end-to-end.

---

## Phase D: Validation & Testing (1 hour)

### D1. Run Validation Gates

**Technical Validation**:
```bash
# From apps/clementine-app/
pnpm check              # Auto-fix format + lint
pnpm type-check         # Verify no type errors
pnpm test               # Run existing tests (should still pass)
```

**Expected Results**:
- ✅ No lint errors
- ✅ No type errors
- ✅ All existing tests pass

---

### D2. Manual Standards Review

**Design System** (`standards/frontend/design-system.md`):
- [ ] No hard-coded colors (using theme tokens)
- [ ] Paired background/foreground colors
- [ ] Skeleton uses theme colors (via shadcn/ui)

**Component Libraries** (`standards/frontend/component-libraries.md`):
- [ ] Using shadcn/ui Tabs (not custom)
- [ ] Using shadcn/ui Skeleton (not custom)
- [ ] Using shadcn/ui Label, Textarea (existing pattern)
- [ ] No reinvented components

**Project Structure** (`standards/global/project-structure.md`):
- [ ] All code in correct domain (`domains/project-config/share/`)
- [ ] Organized by concern (components/, containers/, hooks/)
- [ ] File naming matches component names
- [ ] Barrel exports updated

**Code Quality** (`standards/global/code-quality.md`):
- [ ] No dead code (removed old imports)
- [ ] No console.log statements
- [ ] Clear, meaningful names
- [ ] Comments only where non-obvious

---

### D3. Test Scenarios

**Functional Testing**:

1. **Edit loading title**:
   - [ ] Navigate to share editor
   - [ ] Click "Loading" tab
   - [ ] Type in title field
   - [ ] Wait 2 seconds
   - [ ] Verify save indicator shows spinner → checkmark
   - [ ] Reload page
   - [ ] Verify title persists

2. **Edit loading description**:
   - [ ] Type in description field
   - [ ] Verify preview updates in real-time
   - [ ] Wait 2 seconds
   - [ ] Verify auto-save triggers

3. **Switch between tabs**:
   - [ ] Click "Ready" tab
   - [ ] Verify preview shows ready state
   - [ ] Verify config panel shows ready fields
   - [ ] Click "Loading" tab
   - [ ] Verify preview shows skeleton + loading text
   - [ ] Verify config panel shows loading fields

4. **Clear fields**:
   - [ ] Clear loading title
   - [ ] Verify preview shows default title
   - [ ] Wait 2 seconds (auto-save)
   - [ ] Reload page
   - [ ] Verify null stored, default displayed

5. **Rapid tab switching**:
   - [ ] Switch tabs rapidly 10 times
   - [ ] Verify no errors in console
   - [ ] Verify preview updates correctly
   - [ ] Verify save completes for last edited state

6. **Viewport switcher**:
   - [ ] Switch to mobile viewport
   - [ ] Verify loading preview renders correctly
   - [ ] Switch to desktop viewport
   - [ ] Verify no layout issues

---

### D4. Accessibility Check

**Keyboard Navigation**:
- [ ] Tab key navigates to state tabs
- [ ] Arrow keys switch between Ready/Loading tabs
- [ ] Enter/Space activates tab
- [ ] Tab key navigates to form fields
- [ ] All interactive elements focusable

**Screen Reader**:
- [ ] Tab role announced ("tab 1 of 2")
- [ ] Active tab announced ("selected")
- [ ] Form labels read correctly
- [ ] Help text associated with inputs
- [ ] Save status announced ("Saving...", "Saved")

**Visual**:
- [ ] Focus indicators visible on all interactive elements
- [ ] Active tab has clear visual distinction
- [ ] Text meets contrast requirements (WCAG AA)

---

### D5. Edge Cases

**Empty Project**:
- [ ] Create new project
- [ ] Navigate to share editor
- [ ] Verify defaults applied (no errors)
- [ ] Edit loading config
- [ ] Verify saves correctly

**Long Text**:
- [ ] Enter 500+ character description
- [ ] Verify text wraps in preview (no overflow)
- [ ] Verify saves without truncation

**Special Characters**:
- [ ] Enter text with emojis, quotes, apostrophes
- [ ] Verify displays correctly
- [ ] Verify saves without escaping issues

**Concurrent Edits** (if multiple tabs open):
- [ ] Open share editor in 2 tabs
- [ ] Edit in tab 1 (wait for save)
- [ ] Edit in tab 2
- [ ] Verify no conflicts (last write wins)

---

## Phase E: Cleanup & Documentation (30 min)

### E1. Remove Debug Code
- [ ] Remove all console.log statements
- [ ] Remove commented-out code
- [ ] Remove unused imports

### E2. Add JSDoc Comments
- [ ] Add JSDoc to new exported functions/components
- [ ] Document non-obvious logic
- [ ] Add deprecation warnings to old exports

### E3. Update Barrel Exports
- [ ] Verify all new components exported
- [ ] Verify all new hooks exported
- [ ] Verify deprecated exports still work

### E4. Git Commit
```bash
git add .
git commit -m "feat: add loading state editor for share screen

- Add ShareLoadingConfig schema with title and description fields
- Rename ShareConfig → ShareReadyConfig for clarity
- Create ShareLoadingConfigPanel component
- Update SharePreview to support both ready and loading states
- Add state tabs to preview shell for switching between states
- Implement separate auto-save for each state
- Update ShareEditorPage container to manage both states

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Troubleshooting

### Type Errors After Schema Changes

**Problem**: TypeScript errors in ShareEditorPage after renaming ShareConfig

**Solution**:
```bash
# Rebuild shared package
pnpm --filter @clementine/shared build

# Restart dev server
pnpm app:dev
```

### Auto-Save Not Triggering

**Problem**: Changes don't save after 2 seconds

**Solution**:
- Check `fieldsToCompare` includes edited fields
- Verify `onUpdate` callback calls correct mutation
- Check mutation is wrapped with `useTrackedMutation`
- Check console for errors

### Preview Not Updating

**Problem**: Preview doesn't reflect form changes

**Solution**:
- Verify `useWatch` is watching correct form control
- Check preview receives watched values as props
- Verify form `setValue` called with `shouldDirty: true`
- Check React DevTools for prop updates

### Tab Switching Doesn't Change Panel

**Problem**: Clicking tab changes preview but not config panel

**Solution**:
- Verify `previewState` state variable updates on tab change
- Check conditional rendering uses `previewState === 'ready'`
- Verify both branches return valid components

---

## Rollback Plan

**If feature must be rolled back**:

1. Revert schema changes:
   ```bash
   git revert <commit-hash>
   pnpm --filter @clementine/shared build
   ```

2. Redeploy without loading state editor:
   ```bash
   pnpm app:build
   pnpm app:deploy
   ```

3. Data remains safe:
   - `shareLoading` field ignored if schema not present
   - `shareReady` falls back to `share` if missing
   - No data migration needed to rollback

---

## Success Criteria

**Feature is complete when**:

- [x] All validation gates pass (format, lint, type-check)
- [x] All test scenarios pass
- [x] Accessibility checks pass
- [x] Standards review complete
- [x] No console errors
- [x] Code committed to branch
- [x] Documentation updated

**Next steps after completion**:

1. Create pull request
2. Request code review
3. Address review feedback
4. Merge to main
5. Deploy to production
6. Monitor error tracking (Sentry)

---

## Estimated Time Breakdown

| Phase | Task | Time |
|-------|------|------|
| A | Schema & Data Layer | 1-1.5h |
| B | UI Components | 1.5-2h |
| C | Container Integration | 2-2.5h |
| D | Validation & Testing | 1h |
| E | Cleanup & Documentation | 0.5h |
| **Total** | | **6-7.5 hours** |

**Variables affecting time**:
- Familiarity with codebase: -1 to +2 hours
- Debugging issues: +0 to +2 hours
- Review/revisions: +1 to +3 hours

**Realistic estimate with buffer**: 8-12 hours for full feature including reviews.
