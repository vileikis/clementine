# Data Model: Event Outro & Share Configuration

**Feature**: 028-outro-screen
**Date**: 2025-12-15

## Overview

This feature extends the existing Event model with two new optional fields:
- `outro`: Configuration for the end-of-experience message
- `shareOptions`: Controls available sharing actions for guests

Both fields are stored directly on the Event document in Firestore.

---

## Entity: EventOutro

Configuration for the end-of-experience message displayed to guests after completing an AI photo experience.

### Fields

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `title` | `string \| null` | No | `null` | Heading text for the outro screen (max 100 chars) |
| `description` | `string \| null` | No | `null` | Body text below the title (max 500 chars) |
| `ctaLabel` | `string \| null` | No | `null` | Button text for call-to-action (max 50 chars) |
| `ctaUrl` | `string \| null` | No | `null` | URL for the CTA button (must be valid URL) |

### Validation Rules

- `title`: Optional, max 100 characters if provided
- `description`: Optional, max 500 characters if provided
- `ctaLabel`: Optional, max 50 characters if provided
- `ctaUrl`: Optional, must be valid URL format if provided (starts with http:// or https://)
- If `ctaUrl` is provided, `ctaLabel` should also be provided (UI validation)

### Behavior

- When all fields are null/empty, outro screen still renders showing only the result image and share options
- CTA button only appears if both `ctaLabel` and `ctaUrl` are provided
- Text fields support basic whitespace but no HTML/markdown

### TypeScript Interface

```typescript
interface EventOutro {
  title?: string | null;
  description?: string | null;
  ctaLabel?: string | null;
  ctaUrl?: string | null;
}
```

### Zod Schema

```typescript
const eventOutroSchema = z.object({
  title: z.string().max(100).nullable().optional(),
  description: z.string().max(500).nullable().optional(),
  ctaLabel: z.string().max(50).nullable().optional(),
  ctaUrl: z.string().url().nullable().optional(),
});
```

### Default Value

```typescript
const DEFAULT_EVENT_OUTRO: EventOutro = {
  title: null,
  description: null,
  ctaLabel: null,
  ctaUrl: null,
};
```

---

## Entity: EventShareOptions

Controls which sharing actions are available to guests on the outro screen.

### Fields

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `allowDownload` | `boolean` | Yes | `true` | Show download button for result image |
| `allowSystemShare` | `boolean` | Yes | `true` | Show native share button (uses Web Share API) |
| `allowEmail` | `boolean` | Yes | `false` | Show email share option |
| `socials` | `ShareSocial[]` | Yes | `[]` | List of enabled social platforms |

### ShareSocial Type (existing)

```typescript
type ShareSocial = "instagram" | "facebook" | "twitter" | "linkedin" | "tiktok" | "whatsapp";
```

### Validation Rules

- `allowDownload`: Boolean, required
- `allowSystemShare`: Boolean, required
- `allowEmail`: Boolean, required
- `socials`: Array of valid ShareSocial values, no duplicates

### Behavior

- Disabled options are hidden from guest UI (not shown as disabled buttons)
- When all options are disabled, share section is completely hidden
- At least one option being enabled shows the share section
- Social platform order in UI follows array order

### TypeScript Interface

```typescript
interface EventShareOptions {
  allowDownload: boolean;
  allowSystemShare: boolean;
  allowEmail: boolean;
  socials: ShareSocial[];
}
```

### Zod Schema

```typescript
const shareSocialSchema = z.enum([
  "instagram",
  "facebook",
  "twitter",
  "linkedin",
  "tiktok",
  "whatsapp"
]);

const eventShareOptionsSchema = z.object({
  allowDownload: z.boolean(),
  allowSystemShare: z.boolean(),
  allowEmail: z.boolean(),
  socials: z.array(shareSocialSchema),
});
```

### Default Value

```typescript
const DEFAULT_EVENT_SHARE_OPTIONS: EventShareOptions = {
  allowDownload: true,
  allowSystemShare: true,
  allowEmail: false,
  socials: [],
};
```

---

## Event Model Extension

### Updated Event Interface

```typescript
interface Event {
  // Existing fields...
  id: string;
  projectId: string;
  companyId: string;
  name: string;
  publishStartAt?: number | null;
  publishEndAt?: number | null;
  experiences: EventExperienceLink[];
  extras: EventExtras;
  logoUrl?: string | null;
  theme: Theme;
  welcome?: EventWelcome;
  deletedAt?: number | null;
  createdAt: number;
  updatedAt: number;

  // NEW FIELDS
  outro?: EventOutro;           // End-of-experience message config
  shareOptions?: EventShareOptions;  // Guest sharing controls
}
```

### Firestore Document Structure

```json
{
  "id": "event123",
  "projectId": "project456",
  "companyId": "company789",
  "name": "Summer Campaign",
  "theme": { /* Theme object */ },
  "welcome": { /* EventWelcome object */ },

  "outro": {
    "title": "Thanks for participating!",
    "description": "Share your photo with friends.",
    "ctaLabel": "Visit Our Website",
    "ctaUrl": "https://example.com"
  },

  "shareOptions": {
    "allowDownload": true,
    "allowSystemShare": true,
    "allowEmail": false,
    "socials": ["instagram", "facebook", "twitter"]
  },

  "createdAt": 1702656000000,
  "updatedAt": 1702656000000
}
```

---

## State Transitions

### EventOutro State

```
┌─────────────────┐
│   Undefined     │  (New event, uses defaults)
└────────┬────────┘
         │ User configures outro
         ▼
┌─────────────────┐
│   Configured    │  (Has at least one non-null field)
└────────┬────────┘
         │ User clears all fields
         ▼
┌─────────────────┐
│   Empty         │  (All fields null, still renders result + share)
└─────────────────┘
```

### EventShareOptions State

```
┌─────────────────┐
│   Undefined     │  (New event, uses defaults: download + share enabled)
└────────┬────────┘
         │ User toggles options
         ▼
┌─────────────────┐
│   Configured    │  (Custom share settings)
└────────┬────────┘
         │ All options disabled
         ▼
┌─────────────────┐
│   No Sharing    │  (Share section hidden from guest)
└─────────────────┘
```

---

## Relationships

```
Company (1) ─────┬───── (*) Projects
                 │
                 └───── (*) Events
                              │
                              ├── welcome: EventWelcome
                              ├── outro: EventOutro        ← NEW
                              ├── shareOptions: EventShareOptions  ← NEW
                              └── theme: Theme
```

---

## Migration Notes

- No migration needed - new fields are optional
- Existing events will use DEFAULT_EVENT_OUTRO and DEFAULT_EVENT_SHARE_OPTIONS when fields are undefined
- Guest-facing code must handle undefined outro/shareOptions gracefully
