# Share Screen Loading State Editor

## Overview

Add configuration and preview capabilities for the share screen's loading/processing state. Currently, admins can only configure the "ready" state (when results are available). This feature adds a separate configuration for the "loading" state (when AI generation is in progress).

## Background

The share screen has two distinct states from a guest's perspective:

1. **Loading State** - AI is processing the image/video (30-60 seconds)
   - Shows skeleton loader
   - Different title/description ("Creating your experience...")
   - No share buttons
   - No CTA button
   - Future: Email capture form

2. **Ready State** - Results are available
   - Shows generated media
   - Title/description about the result
   - Share buttons (download, social, etc.)
   - CTA button (optional)

Currently, admins can only configure the ready state. We need to let them configure the loading state with its own title and description.

## Goals

- Enable admins to customize loading state content (title, description)
- Provide clear visual preview of both states
- Maintain simple, intuitive editing workflow
- Set up extensible architecture for future features (email capture)

## Non-Goals (Future Enhancements)

- Email capture configuration (loading state)
- Custom loading animations/spinners
- Progress indicators (0%, 25%, 50%, etc.)
- Split-view comparison of both states
- Error state configuration

## User Stories

**As an event organizer**, I want to customize the loading screen message so that guests understand what's happening while they wait.

**As a brand marketer**, I want to set loading state copy that matches my brand voice so the experience feels cohesive.

**As an admin**, I want to preview both loading and ready states so I can ensure they look good and transition naturally.

## Design Decisions

### 1. Schema Structure: Separate Configs

**Decision**: Use separate top-level configs for each state

```typescript
projectConfig = {
  shareReady: ShareReadyConfig       // ← Renamed from "share"
  shareLoading: ShareLoadingConfig   // ← New
  shareOptions: ShareOptionsConfig   // ← Existing (applies to ready state)
}
```

**Rationale**:
- Clear separation of concerns
- Independent evolution of each state
- Simple validation (no nested conditionals)
- Easy to add more states later (error, timeout, etc.)

**Alternative Considered**: Single `share` config with nested state objects
- ❌ Rejected: More complex, harder to validate, less clear TypeScript types

### 2. UX Pattern: Preview Shell Tabs

**Decision**: State switcher tabs in Preview Shell (right panel)

```
┌─────────────────────────────────────────────┐
│  Preview Shell                              │
│  ┌────────────────────────────────────┐     │
│  │ [Ready | Loading]  [Mobile▼]  [⛶] │     │ ← State tabs here
│  └────────────────────────────────────┘     │
│         [Preview content]                   │
└─────────────────────────────────────────────┘
┌─────────────────────────────────────────────┐
│  Config Panel · Loading                     │ ← Shows active state
│  [Loading config fields]                    │
└─────────────────────────────────────────────┘
```

**Rationale**:
- Visual-first workflow (see state, then configure)
- Consistent with viewport switcher (both are "viewing controls")
- Natural for comparison workflow
- Higher visibility (preview panel is larger)
- Matches design tool patterns (Figma, Framer)

**Alternative Considered**: Tabs in Config Panel
- ❌ Rejected: Less visible, feels more form-driven than visual-driven

### 3. Behavior: Linked State

**Decision**: Tabs control BOTH preview and config panel

- Click "Loading" tab → preview shows loading state + config panel shows loading fields
- Click "Ready" tab → preview shows ready state + config panel shows ready fields
- No separate controls (one source of truth)

**Rationale**:
- Simple mental model
- No confusion about what you're viewing vs. editing
- Prevents state mismatch scenarios

## Technical Specifications

### Schema Changes

**File**: `packages/shared/src/schemas/project/project-config.schema.ts`

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

/**
 * Share Loading State Configuration
 * Shown while AI generation is in progress
 */
export const shareLoadingConfigSchema = z.object({
  title: z.string().nullable().default(null),
  description: z.string().nullable().default(null),
  // Future fields:
  // emailCapture: z.object({
  //   enabled: z.boolean().default(false),
  //   buttonLabel: z.string().default('Send Results'),
  //   placeholder: z.string().default('your@email.com'),
  // }).nullable().default(null),
})

/**
 * Project Configuration Schema
 */
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

// TypeScript types
export type ShareReadyConfig = z.infer<typeof shareReadyConfigSchema>
export type ShareLoadingConfig = z.infer<typeof shareLoadingConfigSchema>
export type ProjectConfig = z.infer<typeof projectConfigSchema>
```

### Default Values

**File**: `apps/clementine-app/src/domains/project-config/share/constants.ts`

```typescript
export const DEFAULT_SHARE_READY: ShareReadyConfig = {
  title: null,
  description: null,
  cta: null,
}

export const DEFAULT_SHARE_LOADING: ShareLoadingConfig = {
  title: 'Creating your experience...',
  description: 'This usually takes 30-60 seconds. Please wait while we generate your personalized result.',
}

// Note: Rename existing DEFAULT_SHARE → DEFAULT_SHARE_READY
```

### Data Hooks

**File**: `apps/clementine-app/src/domains/project-config/share/hooks.ts`

```typescript
// Existing hook - rename internal references
export function useUpdateShareReady(projectId: string) {
  return useProjectConfigMutation(projectId, ['shareReady'])
}

// New hook for loading state
export function useUpdateShareLoading(projectId: string) {
  return useProjectConfigMutation(projectId, ['shareLoading'])
}
```

### Component Architecture

```
ShareEditorPage (Container)
├─ State: previewState ('ready' | 'loading')
├─ Forms: shareReadyForm, shareLoadingForm
├─ Auto-save: Separate for each form
│
├─ PreviewShell (Right Panel)
│  ├─ Header:
│  │  ├─ State Tabs: [Ready | Loading]  ← Controls previewState
│  │  ├─ Viewport Switcher
│  │  └─ Fullscreen Toggle
│  └─ SharePreview
│     ├─ Props: previewState, shareReady, shareLoading, shareOptions
│     └─ Renders: Loading or Ready UI based on previewState
│
└─ Config Panel (Left Panel)
   ├─ Header: "Share Screen · {Ready|Loading}"
   └─ Conditional Panel:
      ├─ If previewState === 'ready' → ShareReadyConfigPanel
      └─ If previewState === 'loading' → ShareLoadingConfigPanel
```

## Implementation Details

### 1. Update ShareEditorPage Container

**File**: `apps/clementine-app/src/domains/project-config/share/containers/ShareEditorPage.tsx`

**Changes**:
1. Add `previewState` state variable
2. Create `shareLoadingForm` (in addition to existing ready form)
3. Add `useUpdateShareLoading` mutation
4. Add separate auto-save for loading form
5. Pass state tabs to PreviewShell via `headerSlot` prop
6. Conditional render of config panels based on `previewState`

**Key Code**:
```typescript
export function ShareEditorPage() {
  const { projectId } = useParams({ strict: false })
  const { data: project } = useProject(projectId ?? '')

  // Preview state (controls both preview and config panel)
  const [previewState, setPreviewState] = useState<'ready' | 'loading'>('ready')

  // Current configs from project
  const currentShareReady = project?.draftConfig?.shareReady ?? DEFAULT_SHARE_READY
  const currentShareLoading = project?.draftConfig?.shareLoading ?? DEFAULT_SHARE_LOADING
  const currentShareOptions = project?.draftConfig?.shareOptions ?? DEFAULT_SHARE_OPTIONS

  // Forms for both states
  const shareReadyForm = useForm<ShareReadyConfig>({
    defaultValues: currentShareReady,
    values: currentShareReady,
  })

  const shareLoadingForm = useForm<ShareLoadingConfig>({
    defaultValues: currentShareLoading,
    values: currentShareLoading,
  })

  // Mutations
  const updateShareReady = useUpdateShareReady(projectId!)
  const updateShareLoading = useUpdateShareLoading(projectId!)
  const updateShareOptions = useUpdateShareOptions(projectId!)

  // Auto-save for ready state
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

  // Auto-save for loading state
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

  // Watch both forms for preview
  const watchedReady = useWatch({ control: shareReadyForm.control }) as ShareReadyConfig
  const watchedLoading = useWatch({ control: shareLoadingForm.control }) as ShareLoadingConfig

  // ... handlers for ready state (existing)
  // ... handlers for loading state (new)

  return (
    <div className="flex h-full">
      {/* Preview */}
      <div className="flex-1 min-w-0">
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
      </div>

      {/* Config Panel */}
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
    </div>
  )
}
```

### 2. Rename ShareConfigPanel → ShareReadyConfigPanel

**File**: Rename `apps/clementine-app/src/domains/project-config/share/components/ShareConfigPanel.tsx`

**To**: `apps/clementine-app/src/domains/project-config/share/components/ShareReadyConfigPanel.tsx`

**Changes**:
- Rename component
- Update prop types to use `ShareReadyConfig`
- Update imports in ShareEditorPage

### 3. Create ShareLoadingConfigPanel

**File**: `apps/clementine-app/src/domains/project-config/share/components/ShareLoadingConfigPanel.tsx`

**New Component**:
```typescript
import { Label } from '@/ui-kit/components/label'
import { Textarea } from '@/ui-kit/components/textarea'
import type { ShareLoadingConfig } from '@/domains/project-config/shared'

interface ShareLoadingConfigPanelProps {
  shareLoading: ShareLoadingConfig
  onShareLoadingUpdate: (updates: Partial<ShareLoadingConfig>) => void
}

export function ShareLoadingConfigPanel({
  shareLoading,
  onShareLoadingUpdate,
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
        />
        <p className="text-xs text-muted-foreground">
          Additional context about wait time or what's happening
        </p>
      </div>

      {/* Future: Email capture settings */}
    </div>
  )
}
```

### 4. Update SharePreview Component

**File**: `apps/clementine-app/src/domains/project-config/share/components/SharePreview.tsx`

**Changes**:
```typescript
import { Skeleton } from '@/ui-kit/components/skeleton'
import type { ShareReadyConfig, ShareLoadingConfig, ShareOptionsConfig } from '@/domains/project-config/shared'

interface SharePreviewProps {
  previewState: 'ready' | 'loading'
  shareReady: ShareReadyConfig
  shareLoading: ShareLoadingConfig
  shareOptions: ShareOptionsConfig
}

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
        {shareLoading.description && (
          <p className="text-muted-foreground text-center max-w-md">
            {shareLoading.description}
          </p>
        )}

        {/* Future: Email capture form */}
      </div>
    )
  }

  // Ready state preview (existing implementation)
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

### 5. Update PreviewShell Component

**File**: `apps/clementine-app/src/shared/preview-shell/components/PreviewShell.tsx`

**Changes**:
Add optional `headerSlot` prop for custom header content:

```typescript
interface PreviewShellProps {
  children: React.ReactNode
  enableViewportSwitcher?: boolean
  enableFullscreen?: boolean
  headerSlot?: React.ReactNode  // ← New prop
}

export function PreviewShell({
  children,
  enableViewportSwitcher = false,
  enableFullscreen = false,
  headerSlot,  // ← New
}: PreviewShellProps) {
  return (
    <div className="h-full flex flex-col">
      {/* Header with controls */}
      <div className="border-b border-border px-4 py-2 flex items-center gap-4">
        {/* Custom header content (e.g., state tabs) */}
        {headerSlot}

        {/* Viewport switcher */}
        {enableViewportSwitcher && <ViewportSwitcher />}

        {/* Fullscreen toggle */}
        {enableFullscreen && <FullscreenToggle />}
      </div>

      {/* Preview content */}
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  )
}
```

## Migration Strategy

### Phase 1: Schema & Backend

1. ✅ Update `packages/shared/src/schemas/project/project-config.schema.ts`
   - Add `shareLoadingConfigSchema`
   - Rename `shareConfigSchema` → `shareReadyConfigSchema`
   - Update `projectConfigSchema`
   - Export new types

2. ✅ Update constants
   - Rename `DEFAULT_SHARE` → `DEFAULT_SHARE_READY`
   - Add `DEFAULT_SHARE_LOADING`

3. ✅ Add data hook
   - Create `useUpdateShareLoading`

### Phase 2: Components

4. ✅ Update PreviewShell
   - Add `headerSlot` prop

5. ✅ Rename ShareConfigPanel → ShareReadyConfigPanel
   - Update component name
   - Update prop types
   - Update all imports

6. ✅ Create ShareLoadingConfigPanel
   - Title field
   - Description field
   - Help text

7. ✅ Update SharePreview
   - Add `previewState` prop
   - Add loading state rendering
   - Update ready state prop names

### Phase 3: Page Integration

8. ✅ Update ShareEditorPage
   - Add `previewState` state
   - Add `shareLoadingForm`
   - Add loading auto-save
   - Add state tabs to PreviewShell
   - Add conditional config panel rendering
   - Add loading handlers

### Phase 4: Testing & Polish

9. ✅ Manual testing
   - Edit ready state → saves correctly
   - Edit loading state → saves correctly
   - Switch between states → preview updates
   - Auto-save works for both states
   - Viewport switcher still works

10. ✅ Edge cases
    - Empty fields (null handling)
    - Very long text (truncation/wrapping)
    - Rapid state switching

## Acceptance Criteria

### Schema & Data
- [ ] `shareReady` field exists in project config schema
- [ ] `shareLoading` field exists in project config schema
- [ ] Both schemas have correct Zod validation
- [ ] TypeScript types are exported
- [ ] Default values are defined

### UI Components
- [ ] State tabs appear in Preview Shell header
- [ ] Clicking "Ready" tab shows ready preview + ready config panel
- [ ] Clicking "Loading" tab shows loading preview + loading config panel
- [ ] Config panel header shows current state ("Share Screen · Ready")
- [ ] ShareReadyConfigPanel renders (renamed from ShareConfigPanel)
- [ ] ShareLoadingConfigPanel renders with title and description fields

### Preview Behavior
- [ ] Ready preview shows: image, title, description, CTA, share buttons
- [ ] Loading preview shows: skeleton loader, title, description
- [ ] Loading preview does NOT show: CTA button, share buttons
- [ ] Preview updates in real-time as user types

### Data Persistence
- [ ] Ready state edits auto-save to `shareReady` field
- [ ] Loading state edits auto-save to `shareLoading` field
- [ ] Debounce works (saves after 2 seconds of inactivity)
- [ ] Saves are independent (editing ready doesn't affect loading)
- [ ] Page reload preserves both configs

### Edge Cases
- [ ] Null/empty fields are handled gracefully
- [ ] Long text wraps properly in preview
- [ ] Rapid tab switching doesn't break preview
- [ ] Viewport switcher still works with state tabs
- [ ] Fullscreen mode still works

## Future Enhancements

### Email Capture (Loading State)
- Add `emailCapture` field to `shareLoadingConfigSchema`
- Add toggle + fields in ShareLoadingConfigPanel
- Render email form in SharePreview loading state

### Custom Loading Animations
- Add animation type selector (spinner, progress bar, custom)
- Add animation speed/color customization

### Progress Indicators
- Add percentage-based progress (0%, 25%, 50%, 75%, 100%)
- Different messages per stage

### Error State Configuration
- Add `shareError` config
- Configure error messages, retry button, support link

### Split-View Comparison
- Add "Compare" button
- Show both states side-by-side
- Highlight differences

## Open Questions

None - all decisions finalized.

## Risks & Mitigation

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Breaking change (rename `share` → `shareReady`) | High | Migration script to rename existing data |
| Users confused by dual editing | Medium | Clear header indicator, single control point |
| Complex state management | Medium | Keep previewState as single source of truth |
| Preview doesn't match runtime | Medium | Use same SharePreview component in guest flow |

## Success Metrics

- Admins successfully configure loading state copy (qualitative feedback)
- Loading state usage > 50% of projects (data tracking)
- No increase in support tickets about share screen editor (support metrics)

## References

- Existing ShareEditorPage: `apps/clementine-app/src/domains/project-config/share/containers/ShareEditorPage.tsx`
- Schema: `packages/shared/src/schemas/project/project-config.schema.ts`
- Design Discussion: Internal Claude Code conversation (2026-01-28)
