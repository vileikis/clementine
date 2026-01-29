# Quickstart: Guest Share Screen Integration

**Feature**: Guest Share Screen with Renderer Integration
**Branch**: `046-guest-share-screen`
**Estimated Implementation Time**: 3-4 hours

## Prerequisites

- [x] Branch `046-guest-share-screen` checked out
- [x] Dependencies installed (`pnpm install`)
- [x] Dev server running (`pnpm app:dev`)
- [x] Reviewed research.md and data-model.md

## Overview

This implementation includes **architectural refactoring** to align share renderers with the ExperiencePage pattern:
1. **Extract ThemedBackground** from share renderers (30 min)
2. **Update ShareEditorPage** to add ThemedBackground wrapper (15 min)
3. **Implement SharePage** with ThemedBackground and renderers (45 min)
4. **Test and validate** all changes (60 min)

## Implementation Checklist

### Step 1: Refactor ShareLoadingRenderer (15 minutes)

**File**: `apps/clementine-app/src/domains/project-config/share/components/ShareLoadingRenderer.tsx`

**Goal**: Extract ThemedBackground wrapper, return content directly

**Current Structure**:
```tsx
return (
  <ThemedBackground className="h-full w-full" contentClassName="...">
    {/* content */}
  </ThemedBackground>
)
```

**Target Structure**:
```tsx
return (
  <div className="flex flex-col items-center justify-center p-8 space-y-6 h-full w-full">
    {/* content */}
  </div>
)
```

**Implementation Tasks**:

1. **Remove ThemedBackground import** (1 minute)
   ```diff
   - import { ThemedBackground, ThemedText } from '@/shared/theming'
   + import { ThemedText } from '@/shared/theming'
   ```

2. **Replace ThemedBackground with div** (10 minutes)
   ```diff
   - return (
   -   <ThemedBackground
   -     className="h-full w-full"
   -     contentClassName="flex flex-col items-center justify-center p-8 space-y-6"
   -   >
   + return (
   +   <div className="flex flex-col items-center justify-center p-8 space-y-6 h-full w-full">
        {/* Image skeleton */}
        <Skeleton className="w-full aspect-square max-w-md rounded-lg" />

        {/* Loading title */}
        <ThemedText variant="heading" className="text-center">
          {shareLoading.title || 'Creating your experience...'}
        </ThemedText>

        {/* Loading description */}
        <ThemedText variant="body" className="text-center opacity-90 max-w-md">
          {shareLoading.description ||
            'This usually takes 30-60 seconds. Please wait while we generate your personalized result.'}
        </ThemedText>
   -   </ThemedBackground>
   +   </div>
     )
   ```

3. **Verify TypeScript compiles** (4 minutes)
   ```bash
   pnpm app:type-check
   ```

**Validation**:
- [ ] ThemedBackground import removed
- [ ] Root element is now `<div>`
- [ ] All layout classes preserved (centering, padding, spacing)
- [ ] No TypeScript errors

---

### Step 2: Refactor ShareReadyRenderer (15 minutes)

**File**: `apps/clementine-app/src/domains/project-config/share/components/ShareReadyRenderer.tsx`

**Goal**: Extract ThemedBackground wrapper, return content directly

**Implementation Tasks**:

1. **Remove ThemedBackground import** (1 minute)
   ```diff
   import {
   -  ThemedBackground,
     ThemedButton,
     ThemedIconButton,
     ThemedText,
   } from '@/shared/theming'
   ```

2. **Replace ThemedBackground with div** (10 minutes)
   ```diff
   - return (
   -   <ThemedBackground
   -     className="h-full w-full"
   -     contentClassName="flex flex-col h-full"
   -   >
   + return (
   +   <div className="flex flex-col h-full w-full">
        {/* Scrollable content zone */}
        <div className="flex-1 overflow-y-auto p-8 flex flex-col items-center space-y-6">
          {/* ... existing content ... */}
        </div>

        {/* Fixed footer zone */}
        <div className="shrink-0 border-t border-current/10 p-4 space-y-3">
          {/* ... existing footer ... */}
        </div>
   -   </ThemedBackground>
   +   </div>
     )
   ```

3. **Verify TypeScript compiles** (4 minutes)
   ```bash
   pnpm app:type-check
   ```

**Validation**:
- [ ] ThemedBackground import removed
- [ ] Root element is now `<div>`
- [ ] Flex layout preserved (`flex flex-col h-full`)
- [ ] No TypeScript errors

---

### Step 3: Update ShareEditorPage (15 minutes)

**File**: `apps/clementine-app/src/domains/project-config/share/containers/ShareEditorPage.tsx`

**Goal**: Add ThemedBackground wrapper around renderers inside PreviewShell

**Implementation Tasks**:

1. **Add ThemedBackground import** (1 minute)
   ```diff
   import { ThemeProvider } from '@/shared/theming'
   + import { ThemedBackground } from '@/shared/theming'
   ```

2. **Wrap renderers in ThemedBackground** (10 minutes)

   Find the PreviewShell children section (around line 130):
   ```diff
   <ThemeProvider theme={currentTheme}>
   +  <ThemedBackground className="h-full w-full" contentClassName="h-full w-full">
        {previewState === 'loading' ? (
          <ShareLoadingRenderer shareLoading={previewShareLoading} />
        ) : (
          <ShareReadyRenderer
            share={previewShare}
            shareOptions={displayShareOptions}
          />
        )}
   +  </ThemedBackground>
   </ThemeProvider>
   ```

3. **Test in preview** (4 minutes)
   - Navigate to `/projects/{projectId}/design/share`
   - Verify loading preview renders correctly
   - Switch to ready preview
   - Verify ready preview renders correctly
   - Check that theme colors apply correctly

**Validation**:
- [ ] ThemedBackground wrapper added
- [ ] Preview still renders correctly
- [ ] Tab switching (ready ↔ loading) works
- [ ] Theme colors apply correctly
- [ ] No console errors

---

### Step 4: Implement SharePage Component (45 minutes)

**File**: `apps/clementine-app/src/domains/guest/containers/SharePage.tsx`

**Current State**: Placeholder with static content
**Target State**: Integrated renderers with state management and navigation

**Implementation Tasks**:

1. **Add imports** (5 minutes)
   ```typescript
   import { useState, useEffect } from 'react'
   import { useNavigate } from '@tanstack/react-router'
   import type {
     ShareLoadingConfig,
     ShareReadyConfig,
     ShareOptionsConfig,
   } from '@clementine/shared'
   import {
     ShareLoadingRenderer,
     ShareReadyRenderer,
   } from '@/domains/project-config/share/components'
   import { ThemeProvider, ThemedBackground } from '@/shared/theming'
   import { useGuestContext } from '../contexts'
   import { DEFAULT_THEME } from '@/domains/project-config/theme/constants'
   ```

2. **Define mock data constants** (10 minutes)
   ```typescript
   const MOCK_LOADING_CONFIG: ShareLoadingConfig = {
     title: 'Creating your masterpiece...',
     description: 'Our AI is working its magic. This usually takes 30-60 seconds.',
   }

   const MOCK_READY_CONFIG: ShareReadyConfig = {
     title: 'Your AI Creation is Ready!',
     description: 'Share your unique creation with friends and family.',
     cta: {
       label: 'Visit Our Website',
       url: 'https://example.com',
     },
   }

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

   const MOCK_RESULT_IMAGE = 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800'
   ```

3. **Add state and hooks** (10 minutes)
   ```typescript
   export function SharePage({ mainSessionId }: SharePageProps) {
     const { project } = useGuestContext()
     const navigate = useNavigate()
     const [isReady, setIsReady] = useState(false)

     // 3-second transition timer
     useEffect(() => {
       const timer = setTimeout(() => setIsReady(true), 3000)
       return () => clearTimeout(timer)
     }, [])

     // Get theme from project or use default
     const currentTheme = project.draftConfig?.theme ?? DEFAULT_THEME
   ```

4. **Add navigation handlers** (10 minutes)
   ```typescript
     const handleStartOver = () => {
       navigate({ to: '/join/$projectId', params: { projectId: project.id } })
     }

     const handleCta = () => {
       if (MOCK_READY_CONFIG.cta?.url) {
         window.location.href = MOCK_READY_CONFIG.cta.url
       }
     }

     const handleShare = (platform: keyof ShareOptionsConfig) => {
       // No-op - share functionality deferred (FR-008)
       console.log(`Share clicked: ${platform}`)
     }
   ```

5. **Update render logic** (10 minutes)
   ```typescript
     return (
       <ThemeProvider theme={currentTheme}>
         <div className="h-screen">
           <ThemedBackground className="h-full w-full" contentClassName="h-full w-full">
             {isReady ? (
               <ShareReadyRenderer
                 share={MOCK_READY_CONFIG}
                 shareOptions={MOCK_SHARE_OPTIONS}
                 mode="run"
                 mediaUrl={MOCK_RESULT_IMAGE}
                 onShare={handleShare}
                 onCta={handleCta}
                 onStartOver={handleStartOver}
               />
             ) : (
               <ShareLoadingRenderer
                 shareLoading={MOCK_LOADING_CONFIG}
                 mode="run"
               />
             )}
           </ThemedBackground>
         </div>
       </ThemeProvider>
     )
   }
   ```

   **Note**: ThemedBackground wraps both renderers at the container level (matches ExperiencePage pattern). The background persists during the loading→ready transition, only the content swaps.

**Validation**:
- [ ] TypeScript compiles without errors
- [ ] No linting errors (`pnpm app:lint`)
- [ ] Component renders loading state immediately
- [ ] Transitions to ready state after 3 seconds
- [ ] "Start Over" button navigates correctly
- [ ] CTA button navigates to external URL

---

### Step 5: Manual Testing (60 minutes)

**Test Environment**: Local dev server (`pnpm app:dev`)

**Test Routes**:
- Navigate to: `http://localhost:3000/join/{projectId}/share?session={sessionId}`
- Replace `{projectId}` with valid project ID from your dev database
- Replace `{sessionId}` with any string (mock data doesn't validate)

**Test Cases**:

1. **Loading State Display** (P1 User Story) ✓
   - [ ] Page loads immediately (< 100ms perceived)
   - [ ] ShareLoadingRenderer appears with skeleton
   - [ ] Mock loading title and description visible
   - [ ] No console errors

2. **Loading-to-Ready Transition** (P1 User Story) ✓
   - [ ] Wait exactly 3 seconds
   - [ ] ShareReadyRenderer replaces ShareLoadingRenderer
   - [ ] Transition is smooth (no flicker)
   - [ ] Page refresh restarts 3-second timer

3. **Ready State Display** (P2 User Story) ✓
   - [ ] Mock result image loads and displays
   - [ ] Mock ready title and description visible
   - [ ] Share icons appear (Instagram, Facebook, Twitter, Download, Copy Link)
   - [ ] "Start Over" button visible
   - [ ] CTA button visible with label "Visit Our Website"

4. **Navigation - Start Over** (P3 User Story) ✓
   - [ ] Click "Start Over" button
   - [ ] Navigates to `/join/{projectId}` (welcome screen)
   - [ ] No page reload (SPA navigation)

5. **Navigation - CTA** (P3 User Story) ✓
   - [ ] Click CTA button
   - [ ] Opens `https://example.com` in same tab
   - [ ] Full page navigation (leaves app)

6. **Share Icons** (P2 User Story) ✓
   - [ ] Click each enabled share icon
   - [ ] Console logs platform name (e.g., "Share clicked: instagram")
   - [ ] No actual share action occurs (expected per FR-008)

7. **Theme Application** (FR-012) ✓
   - [ ] Renderers use theme colors from project config
   - [ ] ThemeProvider applies CSS variables correctly
   - [ ] No hardcoded colors visible

8. **ShareEditorPage Regression Test** (Refactoring Validation) ✓
   - [ ] Navigate to `/projects/{projectId}/design/share`
   - [ ] Loading preview tab renders correctly
   - [ ] Ready preview tab renders correctly
   - [ ] Tab switching works smoothly (loading ↔ ready)
   - [ ] Theme colors apply correctly in preview
   - [ ] Preview shows skeleton in loading state
   - [ ] Preview shows mock image placeholder in ready state
   - [ ] No console errors during preview rendering

**Background Persistence Test** (Architecture Validation) ✓
   - [ ] SharePage: ThemedBackground persists during loading→ready transition
   - [ ] No visual flicker when transitioning states
   - [ ] Background gradient/color remains stable
   - [ ] Only content area updates (not the entire page)

**Mobile Testing**:
- [ ] Test on mobile viewport (320px-768px)
- [ ] Touch targets are at least 44x44px
- [ ] Layout remains responsive
- [ ] No horizontal scroll

---

### Step 6: Code Quality Validation (15 minutes)

**Run validation loop**:

```bash
cd apps/clementine-app

# Format code
pnpm format

# Fix linting issues
pnpm lint:fix

# Type check
pnpm type-check

# Run all checks
pnpm check
```

**Checklist**:
- [ ] All formatting applied (Prettier)
- [ ] No linting errors (ESLint)
- [ ] No type errors (TypeScript strict mode)
- [ ] No console.log statements (except share handler placeholder)

---

### Step 7: Standards Compliance Review (30 minutes)

**Review applicable standards** (per Constitution Principle V):

1. **Component Libraries** (`standards/frontend/component-libraries.md`) ✓
   - [ ] Using existing ShareLoadingRenderer (no modification)
   - [ ] Using existing ShareReadyRenderer (no modification)
   - [ ] Using ThemeProvider from shared theming
   - [ ] No custom UI components created

2. **Design System** (`standards/frontend/design-system.md`) ✓
   - [ ] No hardcoded colors
   - [ ] ThemeProvider wraps renderers
   - [ ] Using theme tokens from project config
   - [ ] Renderers handle responsive design

3. **Project Structure** (`standards/global/project-structure.md`) ✓
   - [ ] File in correct location: `domains/guest/containers/SharePage.tsx`
   - [ ] Follows vertical slice architecture
   - [ ] Imports use path aliases (@/)
   - [ ] No barrel export violations

4. **Code Quality** (`standards/global/code-quality.md`) ✓
   - [ ] Functions are small and focused (< 30 lines each)
   - [ ] No dead code (removed placeholder content)
   - [ ] Clear function names (handleStartOver, handleCta, handleShare)
   - [ ] No premature abstractions
   - [ ] TypeScript strict mode compliant

5. **Security** (`standards/global/security.md`) ✓
   - [ ] No XSS vulnerabilities (using React's built-in escaping)
   - [ ] External URL navigation uses window.location (safe)
   - [ ] No eval or dangerouslySetInnerHTML
   - [ ] Mock data is hardcoded (no user input injection)

**Document any deviations**: None expected for this implementation.

---

### Step 8: Git Commit (10 minutes)

**Commit message**:
```
feat(guest): integrate share screen renderers with mock data

- Add ShareLoadingRenderer and ShareReadyRenderer to SharePage
- Implement 3-second loading-to-ready state transition
- Add Start Over and CTA navigation handlers
- Use mock data for share configs and result image
- Apply project theme via ThemeProvider
- Share icons displayed but non-interactive (per spec)

Implements user stories P1, P2, P3 from 046-guest-share-screen spec.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

**Commands**:
```bash
# Stage changes
git add apps/clementine-app/src/domains/guest/containers/SharePage.tsx

# Commit
git commit -m "$(cat <<'EOF'
feat(guest): integrate share screen renderers with mock data

- Add ShareLoadingRenderer and ShareReadyRenderer to SharePage
- Implement 3-second loading-to-ready state transition
- Add Start Over and CTA navigation handlers
- Use mock data for share configs and result image
- Apply project theme via ThemeProvider
- Share icons displayed but non-interactive (per spec)

Implements user stories P1, P2, P3 from 046-guest-share-screen spec.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
EOF
)"

# Verify commit
git log -1 --stat
```

---

## Common Issues & Solutions

### Issue: "useGuestContext must be used within GuestProvider"

**Cause**: SharePage not rendered within GuestLayout
**Solution**: Verify route structure - SharePage route should be child of GuestLayout

### Issue: Mock image not loading

**Cause**: Unsplash URL blocked or rate limited
**Solution**: Replace MOCK_RESULT_IMAGE with local image or different CDN:
```typescript
const MOCK_RESULT_IMAGE = 'https://via.placeholder.com/800'
```

### Issue: Navigation doesn't work

**Cause**: TanStack Router configuration issue
**Solution**: Check route definition in `app/routes.tsx` - ensure `/join/$projectId` route exists

### Issue: Theme not applying

**Cause**: Project theme is null/undefined
**Solution**: Verify DEFAULT_THEME constant is imported and used as fallback:
```typescript
const currentTheme = project.draftConfig?.theme ?? DEFAULT_THEME
```

### Issue: "Cannot read property 'id' of undefined"

**Cause**: GuestContext not providing project
**Solution**: Ensure GuestLayout has loaded project before rendering SharePage

---

## Testing Checklist Summary

Before marking feature complete:

- [ ] All P1 acceptance scenarios pass (loading state, transition)
- [ ] All P2 acceptance scenarios pass (ready state, share icons, buttons)
- [ ] All P3 acceptance scenarios pass (navigation works)
- [ ] Mobile viewport tested (320px-768px)
- [ ] Validation loop passes (format, lint, type-check)
- [ ] Standards compliance verified (5 standards reviewed)
- [ ] Code committed with descriptive message
- [ ] No console errors in browser DevTools

---

## Success Criteria Verification

Per spec success criteria:

- [x] **SC-001**: Loading state renders < 100ms ✓
- [x] **SC-002**: Transition occurs in 3 seconds ± 50ms ✓
- [x] **SC-003**: 100% of functional requirements met ✓
- [x] **SC-004**: Button navigation < 200ms ✓

**Feature Status**: ✅ Complete when all checkboxes above are checked.

---

## Next Steps (Future Iterations)

After this implementation is complete:

1. **Replace mock data with real configs** (fetch from project.publishedConfig)
2. **Implement Firebase session queries** (fetch resultMedia from mainSessionId)
3. **Add real-time job status tracking** (onSnapshot for session updates)
4. **Implement share button actions** (download, copy link, social sharing)
5. **Add error handling** (failed image loads, missing session data)
6. **Add analytics tracking** (share clicks, CTA conversions)

See Epic E8 (Share Screen) for complete feature roadmap.

---

## Resources

- **Spec**: [spec.md](./spec.md)
- **Research**: [research.md](./research.md)
- **Data Model**: [data-model.md](./data-model.md)
- **Contracts**: [contracts/README.md](./contracts/README.md)
- **Standards**: `/standards/` directory in repo root

---

## Support

Questions or issues during implementation?
- Review research.md for design decisions and rationale
- Check data-model.md for type definitions and mock data structures
- Consult contracts/README.md for prop interfaces and callback signatures
- Reference existing ShareEditorPage.tsx for renderer usage patterns
