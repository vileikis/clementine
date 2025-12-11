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

5. **Create WelcomeSection** (`components/welcome/WelcomeSection.tsx`)
   - Form fields for title, description, media, layout
   - Receives `form` prop from EventGeneralTab (lifted state)
   - Receives `onBlur` handler for autosave

6. **Create WelcomePreview** (`components/welcome/WelcomePreview.tsx`)
   - Uses `PreviewShell` with `ThemedBackground`
   - Shows welcome content + experience cards
   - Receives `welcome` values + `event` props

7. **Create ExperienceCards** (`components/welcome/ExperienceCards.tsx`)
   - Renders experience cards in list or grid layout
   - Filters to show only enabled experiences

8. **Modify EventGeneralTab** (`components/EventGeneralTab.tsx`)
   - Owns form state (lifted from WelcomeSection)
   - Two-column layout: left sections, right preview (sticky)
   - Integrates `useAutoSave` hook

### Phase 3: Integration

9. **Update Event creation** (`events.repository.ts`)
   - Add `welcome: DEFAULT_EVENT_WELCOME` to new events

10. **Handle migration** (`normalizeEvent` helper)
    - Fallback for existing events without welcome field

---

## Key Files

| File | Purpose |
|------|---------|
| `features/events/types/events.types.ts` | EventWelcome, ExperienceLayout types |
| `features/events/schemas/events.schemas.ts` | Zod validation schemas |
| `features/events/repositories/events.repository.ts` | updateEventWelcome function |
| `features/events/actions/events.actions.ts` | updateEventWelcomeAction server action |
| `features/events/components/welcome/WelcomeSection.tsx` | Form fields (NEW) |
| `features/events/components/welcome/WelcomePreview.tsx` | Preview component (NEW) |
| `features/events/components/welcome/ExperienceCards.tsx` | Card list/grid (NEW) |
| `features/events/components/EventGeneralTab.tsx` | Parent tab, owns form state (MODIFY) |
| `hooks/useAutoSave.ts` | Existing autosave hook (REUSE) |

---

## Component Architecture

```
EventGeneralTab (owns form state, two-column layout)
├── Left Column (sections)
│   ├── WelcomeSection (receives form prop)
│   │   ├── Title input (form.register)
│   │   ├── Description textarea (form.register)
│   │   ├── ImageUploadField (media)
│   │   └── Layout toggle (list/grid)
│   ├── ExperiencesSection (existing)
│   └── ExtrasSection (existing)
│
└── Right Column (sticky preview)
    └── WelcomePreview (receives welcome + event)
        └── PreviewShell
            └── ThemedBackground
                ├── Hero Media
                ├── Title (or event.name fallback)
                ├── Description
                └── ExperienceCards (list or grid)
```

---

## State Management & Autosave

Form state is **lifted to EventGeneralTab** so both WelcomeSection (form) and WelcomePreview (display) can access it.

```typescript
// EventGeneralTab.tsx - owns form state
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAutoSave } from "@/hooks/useAutoSave";
import { eventWelcomeSchema, type EventWelcome } from "../schemas/events.schemas";
import { WelcomeSection, WelcomePreview } from "./welcome";

export function EventGeneralTab({ event, projectId }: Props) {
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
      const result = await updateEventWelcomeAction(projectId, event.id, updates);
      if (result.success) {
        toast.success("Saved");
      } else {
        toast.error(result.error.message);
      }
    },
    fieldsToCompare: ['title', 'description', 'mediaUrl', 'mediaType', 'layout'],
    debounceMs: 500,
  });

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_1fr] items-start">
      {/* Left: Form sections */}
      <div className="space-y-8">
        <WelcomeSection form={form} event={event} onBlur={handleBlur} />
        <ExperiencesSection event={event} />
        <ExtrasSection event={event} />
      </div>

      {/* Right: Preview (sticky) */}
      <div className="lg:sticky lg:top-4">
        <WelcomePreview welcome={welcomeValues} event={event} />
      </div>
    </div>
  );
}
```

---

## Preview Integration

WelcomePreview receives both `welcome` (form values) and `event` (for experiences + theme):

```tsx
// WelcomePreview.tsx
interface WelcomePreviewProps {
  welcome: EventWelcome;
  event: Event;
}

export function WelcomePreview({ welcome, event }: WelcomePreviewProps) {
  // Filter to enabled experiences only
  const enabledExperiences = event.experiences.filter(exp => exp.enabled);

  return (
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

          {/* Title (fallback to event.name) */}
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
  );
}
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
