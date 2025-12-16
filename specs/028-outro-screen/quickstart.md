# Quickstart: Event Outro & Share Configuration

**Feature**: 028-outro-screen
**Date**: 2025-12-15

## Prerequisites

- Familiarity with the existing Welcome screen implementation
- Understanding of react-hook-form and useAutoSave patterns
- Knowledge of PreviewShell and theming system

## Key Files to Reference

Before implementing, review these existing patterns:

| Pattern | File |
|---------|------|
| Event types | `web/src/features/events/types/event.types.ts` |
| Event schemas | `web/src/features/events/schemas/event.schemas.ts` |
| Welcome section form | `web/src/features/events/components/welcome/WelcomeSection.tsx` |
| Welcome preview | `web/src/features/events/components/welcome/WelcomePreview.tsx` |
| Event General Tab (layout) | `web/src/features/events/components/EventGeneralTab.tsx` |
| Autosave hook | `web/src/hooks/useAutoSave.ts` |
| Share types | `web/src/features/steps/types/step.types.ts` |

---

## Implementation Order

### Phase 1: Data Layer

1. **Add types** to `event.types.ts`:
   - `EventOutro` interface
   - `EventShareOptions` interface
   - Update `Event` interface with new optional fields

2. **Add schemas** to `event.schemas.ts`:
   - `eventOutroSchema`
   - `eventShareOptionsSchema`
   - Partial versions for updates

3. **Add constants** to `constants.ts`:
   - `DEFAULT_EVENT_OUTRO`
   - `DEFAULT_EVENT_SHARE_OPTIONS`

4. **Add repository methods** to `events.repository.ts`:
   - `updateEventOutro()`
   - `updateEventShareOptions()`

5. **Add server actions** to `events.actions.ts`:
   - `updateEventOutroAction()`
   - `updateEventShareOptionsAction()`

### Phase 2: Admin Components

6. **Create outro form components** in `components/outro/`:
   - `OutroSection.tsx` - Title, description, CTA fields
   - `ShareOptionsSection.tsx` - Toggle switches, social platform checkboxes

7. **Create preview component**:
   - `OutroPreview.tsx` - Live preview with theme support

8. **Create page route** at `app/(workspace)/[companySlug]/[projectId]/[eventId]/outro/page.tsx`:
   - Two-column layout (form + preview)
   - useAutoSave integration
   - Form state with react-hook-form

### Phase 3: Guest Component

9. **Create guest outro component** in `features/guest/components/outro/`:
   - `OutroContent.tsx` - Guest-facing display

---

## Code Snippets

### EventOutro Type

```typescript
// web/src/features/events/types/event.types.ts

export interface EventOutro {
  title?: string | null;
  description?: string | null;
  ctaLabel?: string | null;
  ctaUrl?: string | null;
}

export interface EventShareOptions {
  allowDownload: boolean;
  allowSystemShare: boolean;
  allowEmail: boolean;
  socials: ShareSocial[];
}

// Update Event interface
export interface Event {
  // ... existing fields
  outro?: EventOutro;
  shareOptions?: EventShareOptions;
}
```

### Schema Definitions

```typescript
// web/src/features/events/schemas/event.schemas.ts

export const eventOutroSchema = z.object({
  title: z.string().max(100).nullable().optional(),
  description: z.string().max(500).nullable().optional(),
  ctaLabel: z.string().max(50).nullable().optional(),
  ctaUrl: z.string().url().nullable().optional(),
});

export const eventShareOptionsSchema = z.object({
  allowDownload: z.boolean(),
  allowSystemShare: z.boolean(),
  allowEmail: z.boolean(),
  socials: z.array(z.enum([
    "instagram", "facebook", "twitter", "linkedin", "tiktok", "whatsapp"
  ])),
});
```

### Default Constants

```typescript
// web/src/features/events/constants.ts

export const DEFAULT_EVENT_OUTRO: EventOutro = {
  title: null,
  description: null,
  ctaLabel: null,
  ctaUrl: null,
};

export const DEFAULT_EVENT_SHARE_OPTIONS: EventShareOptions = {
  allowDownload: true,
  allowSystemShare: true,
  allowEmail: false,
  socials: [],
};
```

### Page Layout Pattern

```typescript
// app/(workspace)/[companySlug]/[projectId]/[eventId]/outro/page.tsx

export default function OutroPage() {
  const { event } = useEventContext(); // or fetch event

  // Combined form for outro + share options
  const form = useForm<OutroFormValues>({
    resolver: zodResolver(outroFormSchema),
    defaultValues: {
      ...DEFAULT_EVENT_OUTRO,
      ...event.outro,
      ...DEFAULT_EVENT_SHARE_OPTIONS,
      ...event.shareOptions,
    },
  });

  const watchedValues = useWatch({ control: form.control });

  const { handleBlur } = useAutoSave({
    form,
    originalValues: {
      ...DEFAULT_EVENT_OUTRO,
      ...event.outro,
      ...DEFAULT_EVENT_SHARE_OPTIONS,
      ...event.shareOptions,
    },
    onUpdate: handleSave,
    fieldsToCompare: [
      "title", "description", "ctaLabel", "ctaUrl",
      "allowDownload", "allowSystemShare", "allowEmail", "socials"
    ],
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
      {/* Left: Form */}
      <div className="space-y-6" onBlur={handleBlur}>
        <OutroSection form={form} />
        <ShareOptionsSection form={form} />
      </div>

      {/* Right: Preview */}
      <div className="lg:sticky lg:top-4 lg:self-start">
        <OutroPreview event={event} outroValues={watchedValues} />
      </div>
    </div>
  );
}
```

### Preview Component Pattern

```typescript
// web/src/features/events/components/outro/OutroPreview.tsx

export function OutroPreview({ event, outroValues }: OutroPreviewProps) {
  return (
    <PreviewShell enableViewportSwitcher enableFullscreen>
      <ThemeProvider theme={event.theme}>
        <ThemedBackground
          background={event.theme.background}
          fontFamily={event.theme.fontFamily}
        >
          {/* Placeholder image */}
          <div className="aspect-square bg-muted rounded-lg mb-4">
            <img src="/placeholder-result.jpg" alt="Preview" />
          </div>

          {/* Outro text */}
          {outroValues.title && (
            <h2 style={{ color: event.theme.text.color }}>
              {outroValues.title}
            </h2>
          )}
          {outroValues.description && (
            <p style={{ color: event.theme.text.color }}>
              {outroValues.description}
            </p>
          )}

          {/* CTA button */}
          {outroValues.ctaLabel && outroValues.ctaUrl && (
            <ThemedButton>{outroValues.ctaLabel}</ThemedButton>
          )}

          {/* Share options preview */}
          <ShareOptionsPreview shareOptions={outroValues} />
        </ThemedBackground>
      </ThemeProvider>
    </PreviewShell>
  );
}
```

---

## Validation Checklist

Before marking implementation complete:

- [ ] `pnpm lint` passes
- [ ] `pnpm type-check` passes
- [ ] `pnpm test` passes (if tests added)
- [ ] Preview updates in real-time
- [ ] Autosave works on blur
- [ ] Mobile layout works (stacked, no horizontal scroll)
- [ ] Touch targets ≥ 44x44px on mobile
- [ ] Theme applied correctly in preview
- [ ] CTA URL validation shows error for invalid URLs
- [ ] Share options toggle correctly in preview

---

## Common Pitfalls

1. **Forgetting defaults**: Always merge with DEFAULT_EVENT_OUTRO/SHARE_OPTIONS
2. **Not using dot-notation**: Repository updates must use `outro.title` not replace entire object
3. **Missing revalidation**: Server actions may need `revalidatePath()` for cache
4. **Preview not updating**: Ensure `useWatch` is used, not just `form.getValues()`
5. **Schema import errors**: Don't export schemas from feature index (Next.js bundling)
