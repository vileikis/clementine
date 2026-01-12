# Epic E4: Share Screen Editor

> **Epic Series:** Experience System
> **Dependencies:** E1 (Data Layer & Library) - just needs event schema
> **Enables:** E8 (Share Screen Guest Integration)

---

## 1. Goal

Enable admins to configure the share screen that appears at the end of the guest experience flow.

**This epic delivers:**

- Share screen configuration in event designer
- Event config schema updates for share screen
- Share screen editor UI (new tab or section in Settings)
- Share options configuration (download, social sharing)
- Share screen preview (edit mode)

**This epic does NOT include:**

- Guest-facing share screen (E8)
- Experience runtime (E5)
- Photo capture or transform (E5, E9)

---

## 2. Concept

The share screen is **event-scoped**, not experience-scoped. It appears at the end of every experience in the event and displays:

- Result media (photo/video from experience)
- Custom title and description
- Call-to-action button
- Sharing options (download, copy link, social)

This is consistent across all experiences in an event - admins configure it once per event.

---

## 3. Event Config Schema Updates

### 3.1 ShareScreen Field

Add to `projectEventConfigSchema`:

```typescript
shareScreen: {
  title: string                    // "Your photo is ready!"
  description: string | null       // Optional description
  cta: {
    label: string                  // "Create Another"
    action: 'restart' | 'external'
    url: string | null             // Only if action = 'external'
  } | null
}
```

### 3.2 Sharing Field (existing or new)

```typescript
sharing: {
  download: {
    enabled: boolean
    quality: 'original' | 'optimized'
  }
  copyLink: {
    enabled: boolean
  }
  social: {
    facebook: { enabled: boolean }
    twitter: { enabled: boolean }
    instagram: { enabled: boolean }
    whatsapp: { enabled: boolean }
    email: { enabled: boolean }
  }
}
```

**Note:** If `sharing` field already exists, extend it. Otherwise create new.

---

## 4. Share Screen Editor

### 4.1 Location Options

Two options for where to place the editor:

**Option A: New Tab in Event Designer**
- Adds "Share" tab alongside Welcome, Theme, Settings
- Dedicated space for share configuration
- Cleaner separation of concerns

**Option B: Section in Settings Tab**
- Adds "Share Screen" section to Settings
- Groups with other "flow" settings
- Less navigation

**Recommendation:** Option A (new tab) provides clearer UX and room to grow.

### 4.2 Editor Layout

```
┌─────────────────────────────────────────────────────────────┐
│ [Welcome] [Theme] [Share] [Settings]              [Publish] │
├──────────────────────────────┬──────────────────────────────┤
│                              │                              │
│     Share Screen Preview     │    Share Config Panel        │
│     (Phone Frame)            │                              │
│                              │    Title                     │
│     ┌──────────────────┐     │    [Your photo is ready!]   │
│     │                  │     │                              │
│     │   [Result Image] │     │    Description               │
│     │                  │     │    [________________]        │
│     │  Your photo is   │     │                              │
│     │     ready!       │     │    Call to Action            │
│     │                  │     │    Label: [Create Another]   │
│     │ [Create Another] │     │    Action: ○ Restart ○ URL  │
│     │                  │     │    URL: [______________]     │
│     │ 📥 🔗 📱 📧     │     │                              │
│     └──────────────────┘     │    Sharing Options           │
│                              │    ☑ Download                │
│                              │    ☑ Copy Link               │
│                              │    ☑ Facebook                │
│                              │    ☑ Twitter                 │
│                              │    ☐ Instagram               │
│                              │    ☑ WhatsApp                │
│                              │    ☑ Email                   │
│                              │                              │
└──────────────────────────────┴──────────────────────────────┘
```

---

## 5. Share Config Panel

### 5.1 Presentation Section

**Title**
- Text input
- Required
- Default: "Your photo is ready!"

**Description**
- Textarea
- Optional
- Placeholder: "Add a description..."

### 5.2 Call to Action Section

**Label**
- Text input
- Required if CTA enabled
- Default: "Create Another"

**Action**
- Radio: "Restart Experience" | "External URL"
- If "External URL" selected, show URL input

**URL**
- Text input
- Required if action = "external"
- Validated as URL

### 5.3 Sharing Options Section

Toggle for each sharing option:

| Option | Default | Description |
|--------|---------|-------------|
| Download | ✓ | Download result to device |
| Copy Link | ✓ | Copy shareable link |
| Facebook | ✓ | Share to Facebook |
| Twitter | ✓ | Share to Twitter/X |
| Instagram | ✗ | Share to Instagram |
| WhatsApp | ✓ | Share via WhatsApp |
| Email | ✓ | Share via email |

---

## 6. Share Screen Preview

### 6.1 Edit Mode

- Shows phone frame with share screen layout
- Placeholder image for result media
- Displays configured title and description
- Shows CTA button with configured label
- Shows sharing icons for enabled options
- Updates immediately when config changes

### 6.2 Component

```typescript
interface ShareScreenPreviewProps {
  mode: 'edit' | 'run'
  config: ShareScreenConfig
  sharing: SharingConfig
  resultMedia?: string        // URL for run mode
  onAction?: () => void       // CTA click for run mode
  onShare?: (platform: string) => void
}
```

---

## 7. Implementation Phases

### Phase 1: Schema Updates

Add shareScreen and sharing fields to event config schema. Handle defaults for existing events.

### Phase 2: Share Tab Route

Create Share tab route in event designer. Set up 2-column layout (preview + config panel).

### Phase 3: Config Panel

Build share config panel with presentation, CTA, and sharing options sections.

### Phase 4: Preview Component

Build share screen preview component in edit mode with placeholder media.

### Phase 5: Integration & Polish

Wire up auto-save, add to navigation, handle loading/error states.

---

## 8. Acceptance Criteria

### Must Have

- [ ] Event config includes shareScreen and sharing fields
- [ ] Admin can access Share tab in event designer
- [ ] Admin can configure share screen title
- [ ] Admin can configure share screen description
- [ ] Admin can configure CTA label and action
- [ ] Admin can enable/disable sharing options
- [ ] Share preview shows configured content
- [ ] Preview updates immediately on changes
- [ ] Changes auto-save to draft config

### Nice to Have

- [ ] Preview shows themed styling
- [ ] Social platform icons with brand colors
- [ ] CTA button styling options

---

## 9. Technical Notes

### Folder Structure

```
domains/event/
├── share/
│   ├── containers/
│   │   └── ShareEditorTab.tsx
│   └── components/
│       ├── ShareConfigPanel.tsx
│       ├── ShareScreenPreview.tsx
│       ├── PresentationSection.tsx
│       ├── CtaSection.tsx
│       └── SharingOptionsSection.tsx
└── shared/
    └── schemas/
        └── project-event-config.schema.ts  # Updated
```

### Route

```
app/workspace/
└── $workspaceSlug.projects/
    └── $projectId.events/
        └── $eventId.share.tsx  # New tab route
```

---

## 10. Out of Scope

| Item | Epic |
|------|------|
| Guest-facing share screen | E8 |
| Actual sharing implementation | E8 |
| Social API integrations | E8 |
| Download functionality | E8 |
| Experience runtime | E5, E7 |
