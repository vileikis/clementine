# Quickstart: Share Screen Editor

**Feature**: 024-share-editor
**Date**: 2026-01-13

## Overview

This feature adds a "Share" tab to the event designer that allows admins to configure the share screen appearance with a live preview. The share screen is what guests see when their AI-transformed photo/video is ready.

## Key Files to Create/Modify

### New Files

| File | Purpose |
|------|---------|
| `shared/editor-controls/components/SelectOptionCard.tsx` | Compact toggle card for ConfigPanel sidebars |
| `domains/event/share/index.ts` | Barrel exports for share domain |
| `domains/event/share/containers/ShareEditorPage.tsx` | Main container (2-column layout) |
| `domains/event/share/components/ShareConfigPanel.tsx` | Form controls sidebar (uses SelectOptionCard) |
| `domains/event/share/components/SharePreview.tsx` | Live preview component |
| `domains/event/share/components/index.ts` | Component barrel exports |
| `domains/event/share/hooks/useUpdateShare.ts` | Mutation hook for share content |
| `domains/event/share/hooks/index.ts` | Hooks barrel exports |
| `domains/event/share/constants/defaults.ts` | Default values |
| `app/.../\$eventId.share.tsx` | Route file |

### Modified Files

| File | Change |
|------|--------|
| `domains/event/shared/schemas/project-event-config.schema.ts` | Add `shareConfigSchema`, `ctaConfigSchema`; rename `sharing` → `shareOptions` |
| `domains/event/settings/hooks/useUpdateShareOptions.ts` | Update field prefix from `sharing` to `shareOptions` |
| `domains/event/settings/components/SharingSection.tsx` | Read from `shareOptions` instead of `sharing` |
| `domains/event/designer/containers/EventDesignerLayout.tsx` | Add Share tab to `eventDesignerTabs` |

## Implementation Pattern

### 1. Schema Extension

Add to `project-event-config.schema.ts`:

```typescript
export const ctaConfigSchema = z.object({
  label: z.string().nullable().default(null),
  url: z.string().url().nullable().default(null),
})

export const shareConfigSchema = z.object({
  title: z.string().nullable().default(null),
  description: z.string().nullable().default(null),
  cta: ctaConfigSchema.nullable().default(null),
})

// Add to projectEventConfigSchema:
share: shareConfigSchema.nullable().default(null),
```

### 2. Tab Registration

Add to `eventDesignerTabs` in `EventDesignerLayout.tsx`:

```typescript
{
  id: 'share',
  label: 'Share',
  to: '/workspace/$workspaceSlug/projects/$projectId/events/$eventId/share',
},
```

### 3. Container Pattern (ShareEditorPage)

Follow WelcomeEditorPage pattern with two mutation hooks:

```typescript
export function ShareEditorPage() {
  // 1. Get route params
  const { projectId, eventId } = useParams({ strict: false })

  // 2. Fetch event data
  const { data: event } = useProjectEvent(projectId!, eventId!)

  // 3. Get current config with defaults
  const currentShare = event?.draftConfig?.share ?? DEFAULT_SHARE
  const currentShareOptions = event?.draftConfig?.shareOptions ?? DEFAULT_SHARE_OPTIONS

  // 4. Setup form for share content (title, description, CTA)
  const form = useForm<ShareConfig>({
    defaultValues: currentShare,
    values: currentShare,
  })

  // 5. Setup mutations - TWO hooks for different data
  const updateShare = useUpdateShare(projectId!, eventId!)           // For title, description, CTA
  const updateShareOptions = useUpdateShareOptions(projectId!, eventId!) // For platform toggles (reused!)

  // 6. Setup auto-save for share content (2000ms debounce)
  const { triggerSave } = useAutoSave({
    form,
    originalValues: currentShare,
    onUpdate: async () => {
      await updateShare.mutateAsync(form.getValues())
    },
    debounceMs: 2000,
  })

  // 7. Watch for preview
  const watchedShare = useWatch({ control: form.control })

  // 8. Handler for share options toggles (300ms debounce like SharingSection)
  const handleToggleShareOption = (field: string) => {
    updateShareOptions.mutateAsync({ [field]: !currentShareOptions[field] })
  }

  // 9. Render 2-column layout
  return (
    <div className="flex h-full">
      <aside className="w-80 shrink-0 border-r">
        <ShareConfigPanel
          share={watchedShare}
          shareOptions={currentShareOptions}
          onShareUpdate={handleUpdate}
          onShareOptionToggle={handleToggleShareOption}
        />
      </aside>
      <div className="flex-1 min-w-0">
        <PreviewShell>
          <ThemeProvider theme={currentTheme}>
            <SharePreview share={watchedShare} shareOptions={currentShareOptions} />
          </ThemeProvider>
        </PreviewShell>
      </div>
    </div>
  )
}
```

### 4. Mutation Hook Pattern (useUpdateShare)

Follow useUpdateWelcome pattern:

```typescript
export function useUpdateShare(projectId: string, eventId: string) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (share: ShareConfig) => {
      await updateEventConfigField(projectId, eventId, {
        'share': share,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['project-event', projectId, eventId],
      })
    },
  })

  return useTrackedMutation(mutation)
}
```

### 5. Preview Component (SharePreview)

Two-zone layout:

```tsx
export function SharePreview({ share, shareOptions }: SharePreviewProps) {
  const enabledIcons = Object.entries(shareOptions)
    .filter(([_, enabled]) => enabled)
    .map(([platform]) => platform)

  return (
    <div className="flex flex-col h-full bg-background text-foreground">
      {/* Scrollable content zone */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Media placeholder */}
        <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
          <ImageIcon className="h-12 w-12 text-muted-foreground" />
        </div>

        {/* Title (hidden if null) */}
        {share.title && (
          <h1 className="text-xl font-bold text-center">{share.title}</h1>
        )}

        {/* Description (hidden if null) */}
        {share.description && (
          <p className="text-center text-muted-foreground">{share.description}</p>
        )}
      </div>

      {/* Fixed footer zone */}
      <div className="shrink-0 border-t p-4 space-y-3">
        {/* Share icons */}
        {enabledIcons.length > 0 && (
          <div className="flex justify-center gap-4">
            {enabledIcons.map((platform) => (
              <ShareIcon key={platform} platform={platform} />
            ))}
          </div>
        )}

        {/* Start over button (always visible) */}
        <Button variant="outline" className="w-full">
          Start over
        </Button>

        {/* CTA button (hidden if no label) */}
        {share.cta?.label && (
          <Button className="w-full">{share.cta.label}</Button>
        )}
      </div>
    </div>
  )
}
```

## Validation Rules

| Field | Rule |
|-------|------|
| `title` | Max 100 characters |
| `description` | Max 500 characters |
| `cta.label` | Max 50 characters |
| `cta.url` | Valid URL format (http/https) |
| `cta.url` | Required when `cta.label` is provided |

## Default Values

```typescript
export const DEFAULT_SHARE: ShareConfig = {
  title: null,
  description: null,
  cta: null,
}

export const DEFAULT_CTA: CtaConfig = {
  label: null,
  url: null,
}
```

## Testing Checklist

- [ ] Title field updates preview immediately
- [ ] Description field updates preview immediately
- [ ] CTA label shows button in preview
- [ ] CTA URL validation shows error for invalid URLs
- [ ] CTA URL required error when label provided without URL
- [ ] Empty title hides title in preview
- [ ] Empty description hides description in preview
- [ ] Empty CTA label hides CTA button in preview
- [ ] Share option toggles update preview icons immediately
- [ ] Share options sync between Share tab and Settings tab
- [ ] Auto-save triggers after 2s debounce (content) / 300ms (share options)
- [ ] Save status indicator shows during save
- [ ] Tab navigation works correctly
- [ ] SelectOptionCard displays correctly in narrow sidebar
