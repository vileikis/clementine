# Research: Guest Share Screen Integration

**Feature**: Guest Share Screen with Renderer Integration
**Date**: 2026-01-29
**Phase**: 0 - Outline & Research

## Research Questions

### Q1: Should share renderers include ThemedBackground or should it be extracted to container level?

**Decision**: Extract ThemedBackground from share renderers to container level (SharePage, ShareEditorPage)

**Rationale**:
- **Consistency**: Aligns with ExperiencePage pattern where ThemedBackground is at container level, step renderers only contain content
- **Performance**: Avoids ThemedBackground re-mounting during loading→ready transition in SharePage (current implementation would destroy/recreate background)
- **Separation of concerns**: Renderers focus on content layout, containers manage background/theme
- **Flexibility**: Renderers become reusable in different contexts without assumptions about background
- **Clean transitions**: State changes (loading→ready) only swap content, not the entire visual shell

**Current Pattern Analysis**:
```tsx
// ExperiencePage (established pattern)
<ThemeProvider theme={theme}>
  <ThemedBackground>
    <StepRendererRouter step={currentStep} />  // Step renderers: content only
  </ThemedBackground>
</ThemeProvider>

// Share renderers (current - inconsistent)
function ShareLoadingRenderer() {
  return (
    <ThemedBackground>  // Background inside renderer ❌
      {/* content */}
    </ThemedBackground>
  )
}
```

**Refactored Pattern** (matches ExperiencePage):
```tsx
// SharePage (after refactor)
<ThemeProvider theme={currentTheme}>
  <div className="h-screen">
    <ThemedBackground className="h-full w-full" contentClassName="h-full w-full">
      {isReady ? (
        <ShareReadyRenderer />    // Content only ✓
      ) : (
        <ShareLoadingRenderer />  // Content only ✓
      )}
    </ThemedBackground>
  </div>
</ThemeProvider>
```

**Layout Preservation**:
- ShareLoadingRenderer keeps its centering layout: `className="flex flex-col items-center justify-center p-8 space-y-6"`
- ShareReadyRenderer keeps its flex layout: `className="flex flex-col h-full"`
- These classes move to the root `<div>` of each renderer (instead of ThemedBackground.contentClassName)

**Alternatives Considered**:
1. **Keep background inside renderers** (status quo)
   - ❌ Rejected: Inconsistent with ExperiencePage, causes unnecessary re-mounts, violates separation of concerns
2. **Add prop to control background rendering** (`includeBackground?: boolean`)
   - ❌ Rejected: Over-engineered, adds complexity without clear benefit
3. **Create separate "content-only" renderer variants**
   - ❌ Rejected: Code duplication, maintenance burden

**Breaking Change Impact**:
- ShareEditorPage: Needs to add ThemedBackground wrapper (inside PreviewShell, wrapping renderers)
- SharePage: Already being built, will include ThemedBackground from the start
- No external consumers affected (renderers are internal to share domain)

**Files to Modify**:
1. ShareLoadingRenderer.tsx - Remove ThemedBackground wrapper
2. ShareReadyRenderer.tsx - Remove ThemedBackground wrapper
3. ShareEditorPage.tsx - Add ThemedBackground around renderers
4. SharePage.tsx - Include ThemedBackground in initial implementation

---

### Q2: How should we handle the loading-to-ready state transition?

**Decision**: Use client-side React state (useState + useEffect) with setTimeout

**Rationale**:
- Requirement FR-014 explicitly states "must use client-side state, not route navigation"
- Simple, predictable timing control (exactly 3 seconds)
- No network latency or complexity from route transitions
- Preserves mainSessionId without prop drilling through navigation
- Aligns with Constitution Principle II (Clean Code & Simplicity)

**Alternatives Considered**:
1. **Route-based transition** (navigate to different route after 3s)
   - ❌ Rejected: Violates FR-014, adds URL complexity, loses mainSessionId context
2. **TanStack Router state management** (router.state)
   - ❌ Rejected: Over-engineered for a simple boolean toggle
3. **Context-based state** (create SharePageContext)
   - ❌ Rejected: Unnecessary abstraction for single-component state

**Implementation**:
```tsx
const [isReady, setIsReady] = useState(false)

useEffect(() => {
  const timer = setTimeout(() => setIsReady(true), 3000)
  return () => clearTimeout(timer)
}, [])
```

---

### Q3: What mock data should we use for share configs?

**Decision**: Use inline mock objects with realistic content and public placeholder image

**Rationale**:
- Requirements FR-002, FR-005, FR-006, FR-007 all specify mock data
- Inline definition keeps implementation simple and self-contained
- Use DEFAULT_SHARE_LOADING from constants as reference for realistic content
- Mock data should demonstrate all features (title, description, CTA, share icons)

**Mock Data Structure**:
```typescript
// Mock loading config
const MOCK_LOADING_CONFIG: ShareLoadingConfig = {
  title: 'Creating your masterpiece...',
  description: 'Our AI is working its magic. This usually takes 30-60 seconds.',
}

// Mock ready config
const MOCK_READY_CONFIG: ShareReadyConfig = {
  title: 'Your AI Creation is Ready!',
  description: 'Share your unique creation with friends and family.',
  cta: {
    label: 'Visit Our Website',
    url: 'https://example.com',
  },
}

// Mock share options
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

// Mock result image (public placeholder)
const MOCK_RESULT_IMAGE = 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800'
```

**Alternatives Considered**:
1. **Import DEFAULT_* constants directly**
   - ❌ Rejected: DEFAULT_SHARE_READY has all null values (not useful for demo)
2. **Fetch from external mock API**
   - ❌ Rejected: Adds unnecessary network dependency and complexity
3. **Store in separate constants file**
   - ❌ Rejected: Over-engineering for temporary mock data

**Placeholder Image Selection**:
- Use Unsplash public image (no API key required, reliable CDN)
- Abstract/artistic image to represent "AI-generated result"
- Square aspect ratio (matches renderers' aspect-square class)
- URL: `https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800`

---

### Q4: How should navigation handlers be implemented?

**Decision**: Use TanStack Router's useNavigate hook with type-safe navigation

**Rationale**:
- TanStack Router is the established routing solution (per CLAUDE.md)
- Type-safe navigation prevents runtime errors
- Link component provides href prop for browser navigation standards
- Follows established patterns in existing SharePage code

**Implementation Pattern**:
```tsx
import { Link, useNavigate } from '@tanstack/react-router'

function SharePage({ mainSessionId }: SharePageProps) {
  const { project } = useGuestContext()
  const navigate = useNavigate()

  const handleStartOver = () => {
    navigate({ to: '/join/$projectId', params: { projectId: project.id } })
  }

  const handleCta = () => {
    // For CTA, use window.location for external URLs
    if (mockReadyConfig.cta?.url) {
      window.location.href = mockReadyConfig.cta.url
    }
  }
}
```

**Alternatives Considered**:
1. **window.location for all navigation**
   - ❌ Rejected: Loses SPA benefits, full page reload
2. **Router Link components only**
   - ❌ Rejected: Renderers expect onClick handlers, not Link children
3. **Custom navigation context**
   - ❌ Rejected: Unnecessary abstraction, TanStack Router provides all needed features

**CTA Navigation Note**: External URLs should use `window.location.href` (not router navigation) since they leave the application. This aligns with standard web navigation patterns.

---

### Q5: How should theme be applied to renderers?

**Decision**: Wrap renderers in ThemeProvider using theme from useGuestContext

**Rationale**:
- Requirement FR-012 specifies "must apply project theme"
- GuestContext already provides project data including theme config
- ThemeProvider is the established pattern (used in ShareEditorPage)
- Renderers are designed to work within ThemeProvider (use themed components)

**Implementation Pattern**:
```tsx
import { ThemeProvider } from '@/shared/theming'
import { useGuestContext } from '../contexts'
import { DEFAULT_THEME } from '@/domains/project-config/theme/constants'

function SharePage({ mainSessionId }: SharePageProps) {
  const { project } = useGuestContext()
  const currentTheme = project.draftConfig?.theme ?? DEFAULT_THEME

  return (
    <ThemeProvider theme={currentTheme}>
      {isReady ? (
        <ShareReadyRenderer {...props} />
      ) : (
        <ShareLoadingRenderer {...props} />
      )}
    </ThemeProvider>
  )
}
```

**Alternatives Considered**:
1. **No theme (use browser defaults)**
   - ❌ Rejected: Violates FR-012, inconsistent guest experience
2. **Hardcode theme values**
   - ❌ Rejected: Violates design system standards, not configurable
3. **Create new theme context**
   - ❌ Rejected: Duplicate of existing ThemeProvider, unnecessary

**Theme Fallback**: Use DEFAULT_THEME constant if project theme is not configured. This ensures the page always has a valid theme (per defensive programming best practices).

---

### Q6: Should we handle edge cases in this implementation?

**Decision**: No - edge cases deferred to future iterations

**Rationale**:
- Spec explicitly lists edge cases in "Edge Cases" section but doesn't require handling
- Out of Scope section includes "Error handling for failed media loads"
- Assumptions section states "mainSessionId parameter is always present (edge case handling can be added later)"
- Focus on happy path for P1-P3 user stories

**Edge Cases Deferred**:
- Missing/invalid mainSessionId → Future iteration
- Long text overflow → Renderers already handle with max-w and truncation classes
- Failed image load → Future iteration (error boundaries)
- All share options disabled → Renderers handle gracefully (empty array)
- Null CTA → Renderers handle via conditional rendering (FR-011)

**Happy Path Focus**: This implementation establishes the visual foundation. Error handling and edge cases will be addressed when integrating real data (Firebase, job status tracking).

---

## Technology Best Practices

### React Hooks

**useState + useEffect Timer Pattern**:
- Always clean up timeouts in useEffect return function
- Avoid state updates on unmounted components
- Use empty dependency array for mount-only effects

```tsx
useEffect(() => {
  const timer = setTimeout(() => setIsReady(true), 3000)
  return () => clearTimeout(timer) // Cleanup prevents memory leaks
}, [])
```

**Reference**: React documentation on [useEffect cleanup](https://react.dev/reference/react/useEffect#disconnecting-from-the-server)

### TanStack Router

**Type-Safe Navigation**:
- Use `useNavigate` hook for programmatic navigation
- Always provide params object with typed route parameters
- Prefer `Link` component for declarative navigation

**Reference**: TanStack Router [navigation guide](https://tanstack.com/router/latest/docs/framework/react/guide/navigation)

### Component Integration

**Renderer Mode Prop**:
- ShareLoadingRenderer and ShareReadyRenderer accept `mode?: 'edit' | 'run'`
- Use `mode="run"` for guest-facing implementation (enables interactivity)
- Default is 'edit' (non-interactive preview for designer)

**Callback Props**:
- ShareReadyRenderer requires callbacks when mode="run": onShare, onCta, onStartOver
- ShareLoadingRenderer has no callbacks (passive loading display)

---

## Integration Patterns

### Existing Renderer Usage

**ShareEditorPage Pattern** (reference implementation):
```tsx
// From ShareEditorPage.tsx (lines 130-139)
<ThemeProvider theme={currentTheme}>
  {previewState === 'loading' ? (
    <ShareLoadingRenderer shareLoading={previewShareLoading} />
  ) : (
    <ShareReadyRenderer
      share={previewShare}
      shareOptions={displayShareOptions}
    />
  )}
</ThemeProvider>
```

**Key Differences for SharePage**:
1. No PreviewShell wrapper (SharePage is full-screen, not in iframe preview)
2. Add `mode="run"` prop to enable interactivity
3. Provide callback handlers (onShare, onCta, onStartOver)
4. Use actual result image URL (mediaUrl prop) instead of placeholder

---

## Validation Checklist

Before implementation:
- [x] All research questions answered with concrete decisions
- [x] Technology choices documented with rationale
- [x] Integration patterns identified from existing code
- [x] Best practices researched and documented
- [x] Edge case handling strategy defined
- [x] No unresolved NEEDS CLARIFICATION items

**Status**: Research complete. Ready for Phase 1 (Design & Contracts).
