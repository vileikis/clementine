# Quickstart: Theme Editor

**Feature**: 003-theme-editor
**Date**: 2025-11-25

## Prerequisites

1. Node.js 18+ installed
2. pnpm package manager installed
3. Firebase project configured (Firestore + Storage)
4. Environment variables set in `web/.env.local`

## Development Setup

### 1. Install Dependencies

```bash
# From repository root
pnpm install
```

### 2. Start Development Server

```bash
pnpm dev
```

The app will be available at `http://localhost:3000`

### 3. Access Theme Editor

Navigate to: `http://localhost:3000/events/{eventId}/design/theme`

Replace `{eventId}` with an actual event ID from your Firestore database.

## File Locations

### Files to Modify

| File | Purpose |
|------|---------|
| `web/src/app/(dashboard)/events/[eventId]/(studio)/design/theme/page.tsx` | Page component (create by renaming branding) |
| `web/src/features/events/components/shared/DesignSubTabs.tsx` | Navigation tabs (update label and href) |

### Existing Components (No Changes Needed)

| File | Purpose |
|------|---------|
| `web/src/features/events/components/designer/ThemeEditor.tsx` | Main editor component |
| `web/src/features/events/components/designer/PreviewPanel.tsx` | Mobile preview frame |
| `web/src/features/events/actions/events.ts` | Server actions including `updateEventTheme` |
| `web/src/components/shared/ImageUploadField.tsx` | Image upload component |
| `web/src/hooks/useKeyboardShortcuts.ts` | Keyboard shortcut hook |

## Implementation Steps

### Step 1: Rename Route Directory

```bash
# From repository root
cd web/src/app/\(dashboard\)/events/\[eventId\]/\(studio\)/design/
mv branding theme
```

### Step 2: Update Page Component

Replace the contents of `theme/page.tsx` with:

```typescript
import { notFound } from "next/navigation";
import { getEventAction } from "@/features/events/actions/events";
import { ThemeEditor } from "@/features/events/components/designer";

interface ThemePageProps {
  params: Promise<{ eventId: string }>;
}

export default async function ThemePage({ params }: ThemePageProps) {
  const { eventId } = await params;

  const result = await getEventAction(eventId);

  if (!result.success || !result.event) {
    notFound();
  }

  return <ThemeEditor event={result.event} />;
}
```

### Step 3: Update Navigation

In `DesignSubTabs.tsx`, change the branding tab:

```typescript
// Before
{ label: "Branding", href: `/events/${eventId}/design/branding` }

// After
{ label: "Theme", href: `/events/${eventId}/design/theme` }
```

## Validation

### Run Linting

```bash
pnpm lint
```

### Run Type Check

```bash
pnpm type-check
```

### Run Tests

```bash
pnpm test
```

### Manual Testing

1. Navigate to Event → Design → Theme
2. Verify all sections display (Identity, Primary Color, Text, Button, Background)
3. Modify each setting and verify preview updates
4. Click "Save Changes" and verify toast notification
5. Refresh page and verify changes persisted
6. Test Cmd+S / Ctrl+S keyboard shortcut

## Troubleshooting

### Event Not Found

- Verify the eventId exists in Firestore
- Check Firebase authentication is configured
- Verify `FIREBASE_ADMIN_SECRET` is set in environment

### Image Upload Fails

- Verify Firebase Storage buckets exist: `logos`, `backgrounds`
- Check Storage security rules allow uploads
- Verify file size is within limits (5MB for logos, 10MB for backgrounds)

### Theme Not Saving

- Check browser console for errors
- Verify server action is receiving correct data format
- Check Firestore security rules allow updates to events collection
