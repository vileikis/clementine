# Quickstart: Welcome Screen Customization

**Feature**: 025-welcome-screen
**Date**: 2024-12-11

## Overview

This guide provides quick reference for implementing the Welcome Screen Customization feature.

---

## Prerequisites

- Branch: `025-welcome-screen`
- Next.js dev server running (`pnpm dev`)
- Access to Firebase Firestore (dev environment)

---

## Implementation Order

### Phase 1: Data Layer

1. **Add types** (`events.types.ts`)
   ```typescript
   export type ExperienceLayout = "list" | "grid";
   export interface EventWelcome { ... }
   ```

2. **Add schemas** (`events.schemas.ts`)
   ```typescript
   export const eventWelcomeSchema = z.object({ ... });
   export const updateEventWelcomeSchema = z.object({ ... });
   ```

3. **Add repository function** (`events.repository.ts`)
   ```typescript
   export async function updateEventWelcome(projectId, eventId, welcome) { ... }
   ```

4. **Add server action** (`events.actions.ts`)
   ```typescript
   export async function updateEventWelcomeAction(projectId, eventId, data) { ... }
   ```

### Phase 2: UI Components

5. **Create WelcomeSection** (`components/designer/WelcomeSection.tsx`)
   - Form fields for title, description, media, layout
   - Uses React Hook Form with `useAutoSave` hook
   - Implements 500ms debounce autosave on blur

6. **Create WelcomePreview** (`components/designer/WelcomePreview.tsx`)
   - Uses `PreviewShell` with `ThemedBackground`
   - Shows welcome content + experience cards
   - Handles empty states

7. **Modify EventGeneralTab** (`components/EventGeneralTab.tsx`)
   - Add `<WelcomeSection />` as first section
   - Pass event and projectId props

### Phase 3: Integration

8. **Update Event creation** (`events.repository.ts`)
   - Add `welcome: DEFAULT_EVENT_WELCOME` to new events

9. **Handle migration** (`normalizeEvent` helper)
   - Fallback for existing events without welcome field

---

## Key Files

| File | Purpose |
|------|---------|
| `features/events/types/events.types.ts` | EventWelcome, ExperienceLayout types |
| `features/events/schemas/events.schemas.ts` | Zod validation schemas |
| `features/events/repositories/events.repository.ts` | updateEventWelcome function |
| `features/events/actions/events.actions.ts` | updateEventWelcomeAction server action |
| `features/events/components/designer/WelcomeSection.tsx` | Main component (NEW) |
| `features/events/components/designer/WelcomePreview.tsx` | Preview component (NEW) |
| `features/events/components/EventGeneralTab.tsx` | Parent tab (MODIFY) |
| `hooks/useAutoSave.ts` | Existing autosave hook (REUSE) |

---

## Component Architecture

```
EventGeneralTab
├── WelcomeSection
│   ├── WelcomeForm (title, description, media, layout)
│   └── WelcomePreview
│       ├── PreviewShell
│       │   └── ThemedBackground
│       │       ├── Hero Media
│       │       ├── Title
│       │       ├── Description
│       │       └── ExperienceCards (list or grid)
│       └── ViewportSwitcher
├── ExperiencesSection (existing)
└── ExtrasSection (existing)
```

---

## State Management & Autosave

Uses React Hook Form with the existing `useAutoSave` hook (`web/src/hooks/useAutoSave.ts`):

```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAutoSave } from "@/hooks/useAutoSave";
import { eventWelcomeSchema, type EventWelcome } from "../schemas/events.schemas";

// Form setup with Zod validation
const form = useForm<EventWelcome>({
  resolver: zodResolver(eventWelcomeSchema),
  defaultValues: event.welcome ?? DEFAULT_EVENT_WELCOME,
});

// Watch form values for real-time preview updates
const welcomeValues = form.watch();

// Autosave on blur with 500ms debounce
const { handleBlur } = useAutoSave({
  form,
  originalValues: event.welcome ?? DEFAULT_EVENT_WELCOME,
  onUpdate: async (updates) => {
    const result = await updateEventWelcomeAction(projectId, eventId, updates);
    if (result.success) {
      toast.success("Saved");
    } else {
      toast.error(result.error.message);
    }
  },
  fieldsToCompare: ['title', 'description', 'mediaUrl', 'mediaType', 'layout'],
  debounceMs: 500,
});

// Attach handleBlur to form
return (
  <form onBlur={handleBlur}>
    {/* Form fields using form.register() */}
  </form>
);
```

---

## Preview Integration

```tsx
<PreviewShell enableViewportSwitcher enableFullscreen>
  <ThemeProvider theme={event.theme}>
    <ThemedBackground
      background={event.theme.background}
      fontFamily={event.theme.fontFamily}
      className="flex h-full flex-col"
    >
      {/* Hero Media */}
      {welcome.mediaUrl && (
        welcome.mediaType === "video" ? (
          <video src={welcome.mediaUrl} autoPlay loop muted />
        ) : (
          <img src={welcome.mediaUrl} alt="Welcome" />
        )
      )}

      {/* Title */}
      <h1>{welcome.title || event.name}</h1>

      {/* Description */}
      {welcome.description && <p>{welcome.description}</p>}

      {/* Experience Cards */}
      <ExperienceCards
        experiences={enabledExperiences}
        layout={welcome.layout}
      />
    </ThemedBackground>
  </ThemeProvider>
</PreviewShell>
```

---

## Validation Commands

Run before committing:

```bash
pnpm lint        # ESLint
pnpm type-check  # TypeScript
pnpm test        # Jest tests
```

---

## Testing Checklist

- [ ] Title field saves and displays (max 100 chars)
- [ ] Description field saves and displays (max 500 chars)
- [ ] Image upload works and displays in preview
- [ ] Video upload works and displays in preview
- [ ] Layout toggle switches between list/grid
- [ ] Preview updates in real-time
- [ ] Theme colors apply to preview
- [ ] Autosave triggers on blur with 500ms debounce
- [ ] Save indicator shows during persistence
- [ ] Error handling on save failure
- [ ] Empty state when no experiences
- [ ] Fallback to event name when title empty

---

## Common Issues

### "welcome is undefined"

Existing events don't have the welcome field. Always use fallback:

```typescript
const welcome = event.welcome ?? DEFAULT_EVENT_WELCOME;
```

### Preview not updating

Ensure you're using `form.watch()` to get reactive values:

```typescript
const welcomeValues = form.watch();
// Use welcomeValues in preview, not form.getValues()
```

### Autosave not triggering

The `useAutoSave` hook triggers on blur, not on every keystroke. Ensure:
1. `handleBlur` is attached to the form: `<form onBlur={handleBlur}>`
2. `fieldsToCompare` includes all fields you want to track

### Media type not detected

Set mediaType based on file MIME type during upload:

```typescript
const mediaType = file.type.startsWith("video/") ? "video" : "image";
form.setValue("mediaType", mediaType);
form.setValue("mediaUrl", uploadedUrl);
```
