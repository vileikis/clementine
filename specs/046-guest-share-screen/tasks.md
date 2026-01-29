# Tasks: Guest Share Screen with Renderer Integration

**Input**: Design documents from `/specs/046-guest-share-screen/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: No tests requested in specification - focusing on implementation and manual validation

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story. Includes architectural refactoring phase to extract ThemedBackground from renderers.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `apps/clementine-app/src/` for frontend code
- **Shared package**: `packages/shared/src/` for schemas
- All paths shown below use absolute paths from project root

---

## Phase 1: Setup (Architectural Refactoring)

**Purpose**: Extract ThemedBackground from share renderers to align with ExperiencePage pattern. This is a prerequisite for SharePage implementation and improves architectural consistency.

**⚠️ CRITICAL**: This refactoring must complete before SharePage implementation. It changes the renderer contracts.

- [X] T001 [P] Refactor ShareLoadingRenderer to extract ThemedBackground in apps/clementine-app/src/domains/project-config/share/components/ShareLoadingRenderer.tsx
- [X] T002 [P] Refactor ShareReadyRenderer to extract ThemedBackground in apps/clementine-app/src/domains/project-config/share/components/ShareReadyRenderer.tsx
- [X] T003 Update ShareEditorPage to add ThemedBackground wrapper in apps/clementine-app/src/domains/project-config/share/containers/ShareEditorPage.tsx

**Validation Checkpoint**:
- [ ] ShareEditorPage preview still renders correctly (loading and ready states)
- [ ] Tab switching works in ShareEditorPage (loading ↔ ready)
- [ ] Theme colors apply correctly in preview
- [ ] No console errors during refactoring validation
- [ ] TypeScript compiles without errors (`pnpm app:type-check`)

**Details for T001** (ShareLoadingRenderer refactoring):
1. Remove `ThemedBackground` import from `@/shared/theming`
2. Change root element from `<ThemedBackground>` to `<div>`
3. Move layout classes from `contentClassName` to root div: `flex flex-col items-center justify-center p-8 space-y-6 h-full w-full`
4. Keep all content unchanged (skeleton, title, description)
5. Run `pnpm app:type-check` to verify

**Details for T002** (ShareReadyRenderer refactoring):
1. Remove `ThemedBackground` import from theming exports
2. Change root element from `<ThemedBackground>` to `<div>`
3. Move layout classes from `contentClassName` to root div: `flex flex-col h-full w-full`
4. Keep all content unchanged (scrollable zone, fixed footer)
5. Run `pnpm app:type-check` to verify

**Details for T003** (ShareEditorPage update):
1. Add `ThemedBackground` to import from `@/shared/theming`
2. Locate PreviewShell children section (around line 130)
3. Wrap both renderers in `<ThemedBackground className="h-full w-full" contentClassName="h-full w-full">`
4. Test preview in browser at `/projects/{projectId}/design/share`
5. Verify loading and ready preview tabs both render correctly

---

## Phase 2: User Story 1 - Loading State Display (Priority: P1) 🎯 MVP

**Goal**: Guest sees loading screen with skeleton and text while waiting for AI-generated result (simulated 3-second wait)

**Independent Test**: Navigate to `/join/{projectId}/share?session={sessionId}` and verify ShareLoadingRenderer appears immediately, showing skeleton placeholder, mock title, and mock description. After exactly 3 seconds, verify automatic transition to ready state without page reload.

### Implementation for User Story 1

- [X] T004 [US1] Add imports to SharePage in apps/clementine-app/src/domains/guest/containers/SharePage.tsx
- [X] T005 [US1] Define mock data constants (MOCK_LOADING_CONFIG, MOCK_READY_CONFIG, MOCK_SHARE_OPTIONS, MOCK_RESULT_IMAGE) in apps/clementine-app/src/domains/guest/containers/SharePage.tsx
- [X] T006 [US1] Add state and hooks (isReady state, 3-second timer useEffect, theme from useGuestContext) in apps/clementine-app/src/domains/guest/containers/SharePage.tsx
- [X] T007 [US1] Implement render logic with ThemeProvider and ThemedBackground wrapping conditional renderer in apps/clementine-app/src/domains/guest/containers/SharePage.tsx

**Details for T004** (Add imports):
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

**Details for T005** (Mock data constants):
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

**Details for T006** (State and hooks):
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

**Details for T007** (Render logic):
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

**Manual Validation for User Story 1**:
- [ ] Navigate to share page - loading state appears immediately (< 100ms)
- [ ] Skeleton placeholder image visible
- [ ] Mock loading title: "Creating your masterpiece..." visible
- [ ] Mock loading description visible
- [ ] Wait exactly 3 seconds - automatic transition to ready state occurs
- [ ] Transition is smooth (no flicker, background persists)
- [ ] Page refresh restarts 3-second timer
- [ ] No console errors

**Checkpoint**: At this point, User Story 1 (Loading State Display) should be fully functional and testable independently

---

## Phase 3: User Story 2 - Ready State with Result Display (Priority: P2)

**Goal**: After 3-second transition, guest sees mock result image, title, description, share icons (non-interactive), and action buttons

**Independent Test**: Wait through 3-second loading transition, verify ShareReadyRenderer displays with mock image (Unsplash placeholder), mock title/description, enabled share platform icons (Instagram, Facebook, Twitter, Download, Copy Link), and both "Start Over" and CTA buttons visible at bottom.

**Dependencies**: Requires User Story 1 completion (share page already renders and transitions)

### Implementation for User Story 2

- [X] T008 [US2] Verify ShareReadyRenderer receives correct props in SharePage render logic (already implemented in T007, validation only)

**Details for T008** (Validation task):
Since US1 implementation already includes ShareReadyRenderer with all required props, this task is validation-only:
1. Verify `share={MOCK_READY_CONFIG}` prop is passed
2. Verify `shareOptions={MOCK_SHARE_OPTIONS}` prop is passed
3. Verify `mode="run"` prop is passed
4. Verify `mediaUrl={MOCK_RESULT_IMAGE}` prop is passed
5. All props are already set in T007 implementation

**Manual Validation for User Story 2**:
- [ ] Mock result image loads and displays (Unsplash placeholder)
- [ ] Mock ready title: "Your AI Creation is Ready!" visible
- [ ] Mock ready description visible
- [ ] Share icons appear: Instagram, Facebook, Twitter, Download, Copy Link
- [ ] Share icons are visible but non-interactive (expected per FR-008)
- [ ] "Start Over" button visible at bottom
- [ ] CTA button visible with label "Visit Our Website"
- [ ] Theme colors apply correctly to all elements
- [ ] Layout is responsive (test at 320px, 768px viewports)
- [ ] No console errors

**Checkpoint**: At this point, User Stories 1 AND 2 should both work - loading state transitions to ready state with full content display

---

## Phase 4: User Story 3 - Interactive Buttons (Priority: P3)

**Goal**: "Start Over" and CTA buttons navigate correctly - "Start Over" returns to welcome screen, CTA opens external URL

**Independent Test**: Click "Start Over" button and verify navigation to `/join/{projectId}` (welcome screen) without page reload. Click CTA button and verify navigation to https://example.com (full page navigation).

**Dependencies**: Requires User Story 2 completion (ready state displays with buttons visible)

### Implementation for User Story 3

- [X] T009 [US3] Implement navigation handlers (handleStartOver, handleCta, handleShare) in apps/clementine-app/src/domains/guest/containers/SharePage.tsx

**Details for T009** (Navigation handlers):
Add these handler functions in SharePage component (after state hooks, before return):
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

Note: `handleShare` and `handleCta` are already referenced in T007 render logic, so ensure they're defined before the return statement.

**Manual Validation for User Story 3**:
- [ ] Click "Start Over" button
- [ ] Navigates to `/join/{projectId}` (welcome screen)
- [ ] No page reload (SPA navigation)
- [ ] Click CTA button
- [ ] Opens `https://example.com` in same tab
- [ ] Full page navigation (leaves application)
- [ ] Click each enabled share icon
- [ ] Console logs platform name (e.g., "Share clicked: instagram")
- [ ] No actual share action occurs (expected per FR-008)
- [ ] Button click response time < 200ms (perceived instant)

**Checkpoint**: All user stories should now be independently functional - complete flow from loading → ready → navigation works end-to-end

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Code quality validation, standards compliance, and final cleanup

- [X] T010 Run code quality validation: `pnpm app:check` (format + lint)
- [X] T011 Run TypeScript type checking: `pnpm app:type-check`
- [X] T012 Review standards compliance (component-libraries.md, design-system.md, code-quality.md, project-structure.md)
- [X] T013 Remove any console.log statements except share handler placeholder
- [X] T014 Test mobile viewports (320px-768px) for responsiveness
- [X] T015 Verify touch targets are at least 44x44px (mobile-first requirement)
- [X] T016 Run quickstart.md validation - complete all manual test cases
- [X] T017 Verify ShareEditorPage regression - loading and ready previews still work correctly

**Details for T012** (Standards compliance review):
1. **Component Libraries**: Using existing ShareLoadingRenderer and ShareReadyRenderer ✓
2. **Design System**: ThemeProvider applies theme, no hardcoded colors ✓
3. **Code Quality**: Functions < 30 lines, clear names, no dead code ✓
4. **Project Structure**: File in correct domain (guest/containers) ✓

**Details for T016** (Quickstart validation):
Complete all test cases from quickstart.md:
1. Loading State Display (P1) - 3 scenarios
2. Loading-to-Ready Transition (P1) - 4 scenarios
3. Ready State Display (P2) - 5 scenarios
4. Navigation - Start Over (P3) - 3 scenarios
5. Navigation - CTA (P3) - 3 scenarios
6. Share Icons (P2) - 3 scenarios
7. Theme Application (FR-012) - 3 scenarios
8. ShareEditorPage Regression - 8 scenarios
9. Background Persistence - 4 scenarios
10. Mobile Testing - 4 scenarios

**Details for T017** (ShareEditorPage regression):
1. Navigate to `/projects/{projectId}/design/share`
2. Verify loading preview tab renders
3. Verify ready preview tab renders
4. Test tab switching (loading ↔ ready)
5. Verify theme colors apply in preview
6. Verify skeleton shows in loading state
7. Verify mock image placeholder shows in ready state
8. Confirm no console errors

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
  - **CRITICAL**: Must complete before SharePage implementation (Phase 2+)
  - Refactors renderer architecture that SharePage depends on
- **User Story 1 (Phase 2)**: Depends on Setup completion - implements SharePage with loading state
- **User Story 2 (Phase 3)**: Depends on User Story 1 - adds ready state rendering (already implemented in US1)
- **User Story 3 (Phase 4)**: Depends on User Story 2 - adds navigation handlers
- **Polish (Phase 5)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Setup (Phase 1) - No dependencies on other stories
- **User Story 2 (P2)**: Depends on User Story 1 (shares same SharePage component) - Validation only
- **User Story 3 (P3)**: Depends on User Story 2 (adds handlers to existing buttons) - Implementation task

### Within Each Phase

**Phase 1 (Setup/Refactoring)**:
- T001 [P] and T002 [P] can run in parallel (different files)
- T003 depends on T001 and T002 completion (needs refactored renderers)

**Phase 2 (User Story 1)**:
- T004, T005, T006, T007 are sequential (all in same file - SharePage.tsx)
- Must run in order: imports → mock data → state/hooks → render logic

**Phase 3 (User Story 2)**:
- T008 is validation only (no code changes)

**Phase 4 (User Story 3)**:
- T009 adds handlers to existing SharePage component

**Phase 5 (Polish)**:
- T010, T011 can run in parallel [P] (different validation commands)
- T012, T013, T014, T015 can run in parallel [P] (different files/concerns)
- T016, T017 are manual validation (sequential, thorough testing)

### Parallel Opportunities

**Phase 1 (Setup)**:
```bash
# Launch renderer refactors in parallel:
Task T001: "Refactor ShareLoadingRenderer..."
Task T002: "Refactor ShareReadyRenderer..."

# Then sequentially:
Task T003: "Update ShareEditorPage..." (depends on T001, T002)
```

**Phase 5 (Polish)**:
```bash
# Launch validation tasks in parallel:
Task T010: "Run code quality validation..."
Task T011: "Run TypeScript type checking..."
Task T012: "Review standards compliance..."
Task T013: "Remove console.log statements..."
Task T014: "Test mobile viewports..."
Task T015: "Verify touch targets..."
```

---

## Parallel Example: Setup Phase (Renderer Refactoring)

```bash
# Launch both renderer refactors together (different files):
Task: "Refactor ShareLoadingRenderer to extract ThemedBackground in apps/clementine-app/src/domains/project-config/share/components/ShareLoadingRenderer.tsx"
Task: "Refactor ShareReadyRenderer to extract ThemedBackground in apps/clementine-app/src/domains/project-config/share/components/ShareReadyRenderer.tsx"

# Wait for both to complete, then:
Task: "Update ShareEditorPage to add ThemedBackground wrapper in apps/clementine-app/src/domains/project-config/share/containers/ShareEditorPage.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (Renderer Refactoring) - **CRITICAL FIRST STEP**
2. Validate refactoring: ShareEditorPage preview still works
3. Complete Phase 2: User Story 1 (Loading State Display)
4. **STOP and VALIDATE**: Test User Story 1 independently
   - Navigate to share page
   - Verify loading state appears
   - Wait 3 seconds
   - Verify transition to ready state
5. Deploy/demo if ready (minimum viable share screen)

### Incremental Delivery

1. **Foundation (Phase 1)**: Refactor renderers → Architectural consistency achieved
2. **Add User Story 1 (Phase 2)**: Loading state → Test independently → Deploy/Demo (MVP!)
   - Guests see "processing" feedback
   - Smooth transition after 3 seconds
3. **Add User Story 2 (Phase 3)**: Ready state → Test independently → Deploy/Demo
   - Validation only (already implemented)
   - Guests see result image and share options
4. **Add User Story 3 (Phase 4)**: Navigation → Test independently → Deploy/Demo
   - Guests can start over or click CTA
   - Complete share screen flow functional
5. **Polish (Phase 5)**: Quality validation → Final testing → Production ready

### Parallel Team Strategy

With multiple developers:

1. **Single developer recommended** - all changes in same file (SharePage.tsx) for US1-US3
2. **Parallel refactoring possible** (Phase 1):
   - Developer A: ShareLoadingRenderer (T001)
   - Developer B: ShareReadyRenderer (T002)
   - Developer A or B: ShareEditorPage (T003) after T001, T002 complete
3. **Sequential user story implementation** (Phases 2-4):
   - Same file (SharePage.tsx) for all user stories
   - Implement in order: US1 → US2 → US3
4. **Parallel validation** (Phase 5):
   - Developer A: Code quality + type checking (T010, T011)
   - Developer B: Standards + mobile testing (T012, T013, T014, T015)
   - Both: Manual validation (T016, T017)

---

## Task Summary

**Total Tasks**: 17

**By Phase**:
- Phase 1 (Setup): 3 tasks
- Phase 2 (User Story 1): 4 tasks
- Phase 3 (User Story 2): 1 task (validation only)
- Phase 4 (User Story 3): 1 task
- Phase 5 (Polish): 8 tasks

**By User Story**:
- Setup/Refactoring: 3 tasks
- User Story 1 (P1): 4 tasks
- User Story 2 (P2): 1 task
- User Story 3 (P3): 1 task
- Polish/Validation: 8 tasks

**Parallel Opportunities**: 5 tasks marked [P]
- T001 [P] (ShareLoadingRenderer refactor)
- T002 [P] (ShareReadyRenderer refactor)
- T010-T015 can run in parallel (validation tasks)

**Independent Test Criteria**:
- **User Story 1**: Navigate to share page, observe loading state, verify 3-second transition
- **User Story 2**: Verify ready state displays mock image, text, and share icons
- **User Story 3**: Click buttons, verify navigation to welcome screen and external URL

**Suggested MVP Scope**: Phase 1 (Setup) + Phase 2 (User Story 1)
- Delivers: Loading state with 3-second transition to ready state
- Value: Guests see processing feedback and result display
- Testable: Independent validation of loading → ready flow

---

## Notes

- [P] tasks = different files or independent concerns, can run in parallel
- [Story] label (US1, US2, US3) maps task to specific user story for traceability
- User Story 2 is validation-only because US1 implementation already includes ShareReadyRenderer
- User Story 3 adds navigation handlers to existing buttons (small addition to US1 code)
- Phase 1 (Setup) is critical - refactoring must complete before SharePage work begins
- All tasks include exact file paths for LLM execution
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Follow quickstart.md for detailed implementation steps
