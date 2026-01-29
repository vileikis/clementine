# Contracts: Guest Share Screen

**Feature**: Guest Share Screen with Renderer Integration
**Date**: 2026-01-29

## Overview

This feature does not introduce new API contracts. It integrates existing React components using established prop interfaces.

All contracts are TypeScript interfaces defined in source code (not OpenAPI/GraphQL schemas).

## Component Contracts

### SharePage Props Contract

**File**: `apps/clementine-app/src/domains/guest/containers/SharePage.tsx`

**Interface**:
```typescript
export interface SharePageProps {
  /** Main session ID from URL query params */
  mainSessionId: string
}
```

**Contract**:
- **Input**: mainSessionId (string, required)
- **Output**: Rendered React component (ShareLoadingRenderer → ShareReadyRenderer)
- **Side Effects**:
  - Navigation to `/join/$projectId` (Start Over button)
  - Navigation to external URL (CTA button)
  - 3-second setTimeout (automatic state transition)

**Usage**:
```tsx
// Route provides prop
<SharePage mainSessionId="abc123xyz" />
```

---

### ShareLoadingRenderer Props Contract

**File**: `apps/clementine-app/src/domains/project-config/share/components/ShareLoadingRenderer.tsx`

**Interface**:
```typescript
export interface ShareLoadingRendererProps {
  shareLoading: ShareLoadingConfig
  mode?: 'edit' | 'run'
}
```

**Contract**:
- **Input**:
  - shareLoading (ShareLoadingConfig, required)
  - mode ('edit' | 'run', optional, default: 'edit')
- **Output**: Rendered loading content (skeleton, title, description) in a root `<div>` element
- **Side Effects**: None (pure presentational component)
- **Layout**: Root element has centering classes: `flex flex-col items-center justify-center p-8 space-y-6 h-full w-full`

**Architecture Note**: This renderer does NOT include ThemedBackground wrapper (extracted in 046 refactoring). Container must provide ThemedBackground.

**SharePage Usage**:
```tsx
<ShareLoadingRenderer
  shareLoading={MOCK_LOADING_CONFIG}
  mode="run"
/>
```

---

### ShareReadyRenderer Props Contract

**File**: `apps/clementine-app/src/domains/project-config/share/components/ShareReadyRenderer.tsx`

**Interface**:
```typescript
export interface ShareReadyRendererProps {
  share: ShareReadyConfig
  shareOptions: ShareOptionsConfig
  mode?: 'edit' | 'run'
  mediaUrl?: string | null
  onShare?: (platform: keyof ShareOptionsConfig) => void
  onCta?: () => void
  onStartOver?: () => void
}
```

**Contract**:
- **Input**:
  - share (ShareReadyConfig, required)
  - shareOptions (ShareOptionsConfig, required)
  - mode ('edit' | 'run', optional, default: 'edit')
  - mediaUrl (string | null, optional)
  - onShare (callback, optional but required when mode='run')
  - onCta (callback, optional but required when mode='run')
  - onStartOver (callback, optional but required when mode='run')
- **Output**: Rendered result content (media, title, description, share icons, buttons) in a root `<div>` element
- **Side Effects**: Invokes callbacks on user interaction (when mode='run')
- **Layout**: Root element uses flex column layout: `flex flex-col h-full w-full`

**Architecture Note**: This renderer does NOT include ThemedBackground wrapper (extracted in 046 refactoring). Container must provide ThemedBackground.

**SharePage Usage**:
```tsx
<ShareReadyRenderer
  share={MOCK_READY_CONFIG}
  shareOptions={MOCK_SHARE_OPTIONS}
  mode="run"
  mediaUrl={MOCK_RESULT_IMAGE}
  onShare={(platform) => {
    // No-op in this phase (FR-008: non-interactive)
  }}
  onCta={handleCta}
  onStartOver={handleStartOver}
/>
```

---

### ThemeProvider Props Contract

**File**: `apps/clementine-app/src/shared/theming/ThemeProvider.tsx`

**Interface**:
```typescript
export interface ThemeProviderProps {
  theme: ThemeConfig
  children: ReactNode
}
```

**Contract**:
- **Input**:
  - theme (ThemeConfig, required)
  - children (ReactNode, required)
- **Output**: Renders children with CSS variables applied
- **Side Effects**: Sets CSS custom properties on wrapper element

**SharePage Usage**:
```tsx
<ThemeProvider theme={currentTheme}>
  {/* ShareLoadingRenderer or ShareReadyRenderer */}
</ThemeProvider>
```

---

## Navigation Contracts

### Start Over Navigation

**API**: TanStack Router `useNavigate()` hook

**Contract**:
```typescript
navigate({
  to: '/join/$projectId',
  params: { projectId: string }
})
```

**Example**:
```tsx
const navigate = useNavigate()
const handleStartOver = () => {
  navigate({
    to: '/join/$projectId',
    params: { projectId: project.id }
  })
}
```

**Behavior**: Client-side navigation to welcome screen (no page reload)

---

### CTA Navigation

**API**: Browser `window.location.href`

**Contract**:
```typescript
window.location.href = string
```

**Example**:
```tsx
const handleCta = () => {
  if (MOCK_READY_CONFIG.cta?.url) {
    window.location.href = MOCK_READY_CONFIG.cta.url
  }
}
```

**Behavior**: Full page navigation to external URL (leaves application)

---

## Context Contracts

### GuestContext

**File**: `apps/clementine-app/src/domains/guest/contexts/GuestContext.tsx`

**Interface**:
```typescript
export interface GuestContextValue {
  user: User
  project: Project
  guest: Guest
  experiences: Experience[]
  experiencesLoading: boolean
}
```

**SharePage Usage**:
```tsx
const { project } = useGuestContext()
const currentTheme = project.draftConfig?.theme ?? DEFAULT_THEME
```

**Contract**:
- **Access Method**: `useGuestContext()` hook
- **Requirement**: Must be used within GuestProvider
- **Error Handling**: Throws error if used outside provider
- **Used Fields**:
  - `project.id` → Start Over navigation target
  - `project.draftConfig.theme` → Theme configuration

---

## Type Contracts

All type contracts are defined in `@clementine/shared`:

```typescript
// Import from shared package
import type {
  ShareLoadingConfig,
  ShareReadyConfig,
  ShareOptionsConfig,
  ThemeConfig,
} from '@clementine/shared'
```

See [data-model.md](../data-model.md) for detailed type definitions.

---

## Callback Contracts

### onStartOver Callback

**Signature**: `() => void`

**Implementation**:
```typescript
const handleStartOver = () => {
  navigate({ to: '/join/$projectId', params: { projectId: project.id } })
}
```

**Behavior**: Navigate back to welcome screen

---

### onCta Callback

**Signature**: `() => void`

**Implementation**:
```typescript
const handleCta = () => {
  if (MOCK_READY_CONFIG.cta?.url) {
    window.location.href = MOCK_READY_CONFIG.cta.url
  }
}
```

**Behavior**: Navigate to CTA URL (external link)

**Guard**: Only executes if CTA URL is defined (defensive programming)

---

### onShare Callback

**Signature**: `(platform: keyof ShareOptionsConfig) => void`

**Implementation** (this phase):
```typescript
const handleShare = (platform: keyof ShareOptionsConfig) => {
  // No-op - share functionality deferred to future iteration (FR-008)
  console.log(`Share clicked: ${platform}`)
}
```

**Behavior**: Placeholder - no action taken (icons displayed but non-interactive per FR-008)

**Future Implementation**: Will trigger download, copy link, or social share dialog

---

## Contract Validation

All contracts are type-checked at compile time via TypeScript strict mode:

- **No runtime validation required** (mock data is hardcoded and type-safe)
- **Prop types enforced** by React component interfaces
- **Navigation types enforced** by TanStack Router type system
- **Context types enforced** by useGuestContext return type

**Validation Command**: `pnpm app:type-check`

---

## Breaking Changes

**None** - This implementation uses existing contracts only. No breaking changes to:
- ShareLoadingRenderer interface
- ShareReadyRenderer interface
- ThemeProvider interface
- GuestContext interface
- TanStack Router navigation patterns

---

## Future Contract Extensions

When integrating real data, additional contracts will be needed:

1. **Firebase Session Query Contract**:
   ```typescript
   // Future: Fetch session data
   const sessionRef = doc(firestore, 'sessions', mainSessionId)
   const sessionSnap = await getDoc(sessionRef)
   ```

2. **Real-time Job Status Subscription**:
   ```typescript
   // Future: Subscribe to job status changes
   onSnapshot(sessionRef, (snapshot) => {
     const status = snapshot.data()?.jobStatus
   })
   ```

3. **Share Action Handlers**:
   ```typescript
   // Future: Implement actual share actions
   const handleDownload = async () => {
     const blob = await fetch(mediaUrl).then(r => r.blob())
     // ... download logic
   }
   ```

These will be defined when implementing Epic E8 (Share Screen) complete functionality.
