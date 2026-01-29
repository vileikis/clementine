# Data Model: Guest Share Screen

**Feature**: Guest Share Screen with Renderer Integration
**Date**: 2026-01-29
**Phase**: 1 - Design & Contracts

## Overview

This feature uses existing type definitions from `@clementine/shared` and does not introduce new entities. All data structures are already defined in the shared package schema files. This document describes how existing entities are used in the SharePage implementation.

## Entities Used (Read-Only References)

### ShareLoadingConfig

**Source**: `@clementine/shared` (packages/shared/src/schemas/project/project-config.schema.ts:67-70)

**Purpose**: Configuration for the loading state shown while AI generation is in progress.

**Schema**:
```typescript
{
  title: string | null,        // Loading state title (default: "Creating your experience...")
  description: string | null   // Loading state description (default: "This usually takes 30-60 seconds...")
}
```

**Usage in SharePage**: Passed to ShareLoadingRenderer component to display loading message and skeleton placeholder.

**Validation Rules**:
- title: max 100 characters (SHARE_TITLE_MAX_LENGTH)
- description: max 500 characters (SHARE_DESCRIPTION_MAX_LENGTH)
- Both fields nullable (null displays default from renderer)

**Mock Data**:
```typescript
const MOCK_LOADING_CONFIG: ShareLoadingConfig = {
  title: 'Creating your masterpiece...',
  description: 'Our AI is working its magic. This usually takes 30-60 seconds.',
}
```

---

### ShareReadyConfig

**Source**: `@clementine/shared` (packages/shared/src/schemas/project/project-config.schema.ts:75-79)

**Purpose**: Configuration for the ready state shown when AI result is available.

**Schema**:
```typescript
{
  title: string | null,        // Ready state title
  description: string | null,  // Ready state description
  cta: CtaConfig | null       // Call-to-action button configuration
}
```

**Nested Type - CtaConfig**:
```typescript
{
  label: string | null,  // CTA button text (null = hide button)
  url: string | null     // CTA target URL (null = hide button)
}
```

**Usage in SharePage**: Passed to ShareReadyRenderer component to display result with share options and action buttons.

**Validation Rules**:
- title: max 100 characters
- description: max 500 characters
- cta.label: max 50 characters (CTA_LABEL_MAX_LENGTH)
- cta.url: valid URL format (validated on save in designer)
- CTA button hidden if label OR url is null (FR-011)

**Mock Data**:
```typescript
const MOCK_READY_CONFIG: ShareReadyConfig = {
  title: 'Your AI Creation is Ready!',
  description: 'Share your unique creation with friends and family.',
  cta: {
    label: 'Visit Our Website',
    url: 'https://example.com',
  },
}
```

---

### ShareOptionsConfig

**Source**: `@clementine/shared` (packages/shared/src/schemas/project/project-config.schema.ts:43-53)

**Purpose**: Boolean flags determining which share platform icons are displayed.

**Schema**:
```typescript
{
  download: boolean,    // Download button
  copyLink: boolean,    // Copy link button
  email: boolean,       // Email share
  instagram: boolean,   // Instagram share
  facebook: boolean,    // Facebook share
  linkedin: boolean,    // LinkedIn share
  twitter: boolean,     // Twitter/X share
  tiktok: boolean,      // TikTok share
  telegram: boolean     // Telegram share
}
```

**Usage in SharePage**: Passed to ShareReadyRenderer to determine which share icons appear in the footer.

**Behavior**:
- `true` = icon displayed (but non-interactive in this phase per FR-008)
- `false` = icon hidden
- Empty array (all false) = no share icons section rendered

**Mock Data**:
```typescript
const MOCK_SHARE_OPTIONS: ShareOptionsConfig = {
  download: true,
  copyLink: true,
  email: false,
  instagram: true,
  facebook: true,
  linkedin: false,
  twitter: true,
  tiktok: false,
  telegram: false,
}
```

---

### Project (Context Data)

**Source**: `@clementine/shared` (project.schema.ts)

**Purpose**: Container for project configuration including theme.

**Relevant Fields for SharePage**:
```typescript
{
  id: string,                    // Project ID (for navigation)
  draftConfig?: {
    theme?: ThemeConfig | null,  // Visual theme configuration
    // ... other config fields
  }
}
```

**Usage in SharePage**:
- `project.id` → Used in "Start Over" navigation target (`/join/$projectId`)
- `project.draftConfig?.theme` → Applied via ThemeProvider to style renderers

**Access Pattern**: Retrieved from GuestContext via `useGuestContext()` hook.

---

## State Management

### Component-Local State

**SharePage Internal State**:
```typescript
interface SharePageState {
  isReady: boolean  // false = loading, true = ready
}
```

**State Transitions**:
```
Initial Load → isReady = false (show ShareLoadingRenderer)
     ↓
After 3 seconds → isReady = true (show ShareReadyRenderer)
```

**Implementation**:
```typescript
const [isReady, setIsReady] = useState(false)

useEffect(() => {
  const timer = setTimeout(() => setIsReady(true), 3000)
  return () => clearTimeout(timer)
}, [])
```

**No Persistence**: State is ephemeral (lost on refresh). This is intentional - each page load simulates the full loading experience.

---

## Props Interface

### SharePageProps

**Definition**:
```typescript
export interface SharePageProps {
  /** Main session ID from URL query params */
  mainSessionId: string
}
```

**Source**: Route parameters from TanStack Router

**Validation**: None required in this phase (assumption: always present per spec)

**Usage**: Preserved throughout component lifecycle but not displayed or used functionally (placeholder for future Firebase integration).

---

## Mock Data Constants

### Mock Result Image URL

**Purpose**: Placeholder for AI-generated result media

**Value**: `'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800'`

**Properties**:
- Public CDN (Unsplash) - no auth required
- Square aspect ratio (matches renderer's aspect-square class)
- Abstract/artistic content (represents AI generation)
- 800px width (optimized for mobile + retina)

**Future Replacement**: Will be replaced with actual result media URL from Firebase Storage (fetched via mainSessionId).

---

## Type Imports

All types imported from shared package:

```typescript
import type {
  ShareLoadingConfig,
  ShareReadyConfig,
  ShareOptionsConfig,
} from '@clementine/shared'
```

**No New Types**: This implementation creates no new type definitions. All types are reused from existing schemas.

---

## Validation Rules Summary

| Field | Max Length | Nullable | Default |
|-------|-----------|----------|---------|
| ShareLoadingConfig.title | 100 chars | Yes | "Creating your experience..." |
| ShareLoadingConfig.description | 500 chars | Yes | "This usually takes 30-60 seconds..." |
| ShareReadyConfig.title | 100 chars | Yes | null |
| ShareReadyConfig.description | 500 chars | Yes | null |
| CtaConfig.label | 50 chars | Yes | null |
| CtaConfig.url | N/A (URL format) | Yes | null |
| ShareOptionsConfig.* | N/A (boolean) | No | varies by platform |

**Validation Location**: All validation handled in designer (ShareEditorPage). SharePage reads pre-validated data only.

---

## Relationships

```
SharePage (Container)
  ├─ uses → GuestContext (provides project theme)
  ├─ renders → ShareLoadingRenderer (when isReady = false)
  ├─ renders → ShareReadyRenderer (when isReady = true)
  ├─ wraps with → ThemeProvider (applies project theme)
  └─ navigates to → /join/$projectId (Start Over button)

ShareLoadingRenderer
  ├─ receives → ShareLoadingConfig (mock data)
  └─ renders → Skeleton (ui-kit component)

ShareReadyRenderer
  ├─ receives → ShareReadyConfig (mock data)
  ├─ receives → ShareOptionsConfig (mock data)
  ├─ receives → mediaUrl (mock image URL)
  ├─ receives → mode="run" (enables interactivity)
  ├─ receives → onStartOver callback
  ├─ receives → onCta callback
  └─ receives → onShare callback (no-op in this phase)
```

---

## Data Flow Diagram

```
Route (mainSessionId)
    ↓
SharePage (container)
    ↓
[isReady state check]
    ↓
    ├─ false → ShareLoadingRenderer
    │            ↓
    │         [Wait 3 seconds]
    │            ↓
    │         setIsReady(true)
    │
    └─ true → ShareReadyRenderer
                 ↓
              [User interactions]
                 ↓
              onStartOver → navigate('/join/$projectId')
              onCta → window.location.href = cta.url
              onShare → no-op (deferred to future iteration)
```

---

## Future Data Integration Points

This implementation uses mock data. Future iterations will integrate real data:

1. **ShareLoadingConfig / ShareReadyConfig**: Fetch from `project.publishedConfig.shareLoading` and `project.publishedConfig.shareReady` (via GuestContext)

2. **ShareOptionsConfig**: Fetch from `project.publishedConfig.shareOptions` (via GuestContext)

3. **Result Media URL**: Fetch from session document via Firebase:
   ```typescript
   // Future implementation
   const session = await getDoc(doc(firestore, 'sessions', mainSessionId))
   const mediaUrl = session.data()?.resultMedia?.publicUrl
   ```

4. **Job Status Tracking**: Subscribe to session.jobStatus for real-time loading state:
   ```typescript
   // Future implementation
   onSnapshot(sessionRef, (snapshot) => {
     const status = snapshot.data()?.jobStatus
     setIsReady(status === 'completed')
   })
   ```

**Migration Strategy**: Mock data constants will be replaced with GuestContext properties and Firebase queries. Component structure remains unchanged.
