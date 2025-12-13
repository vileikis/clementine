# QA Issues: Guest Flow

**QA Date**: 2024-12-13
**Branch**: `026-guest-flow`
**Status**: P0/P1 Fixed - Awaiting Re-test

---

## Fixes Applied

### BUG-001/002 Fix: Empty states not rendering (invisible text)
**Root Cause**: Empty state components used hardcoded `text-white` CSS classes, but the default project theme has a white background (`#FFFFFF`). White text on white background = invisible content.

The components WERE rendering, but the text was invisible due to lack of color contrast.

**Fix**: Made empty states theme-aware by using `useEventTheme()` hook to get the theme's text color instead of hardcoded white.

**Files changed**:
- `web/src/features/guest/components/EmptyStates.tsx`
- `web/src/features/guest/components/LoadingScreen.tsx`

### BUG-003 Fix: Missing session creation
**Root Cause**: `useSession` hook only created sessions when `sessionId` was invalid. Missing `sessionId` (no `s` param) was treated as "no session needed" rather than "create new session".

**Fix**: Updated `useSession` effect to create session when `experienceId` exists but `sessionId` is missing.

**Files changed**:
- `web/src/features/guest/hooks/useSession.ts`

### UX-001 Fix: Loading spinner too small
**Fix**: Increased spinner from `h-8 w-8` to `h-12 w-12`, increased opacity from 60% to 80%.

**Files changed**:
- `web/src/features/guest/components/LoadingScreen.tsx`

### UX-002 Fix: Truncated IDs + missing experience ID
**Fix**: Added `experienceId` prop, show full IDs with `break-all` for wrapping.

**Files changed**:
- `web/src/features/guest/components/ExperienceScreen.tsx`
- `web/src/app/(public)/join/[projectId]/JoinPageClient.tsx`

---

## Critical Bugs (P0)

### BUG-001: Empty states not rendering for missing/inactive events

**Observed**: Project with no active event shows blank screen
**Expected**: "Event Not Available" message (`NoActiveEvent` component)

**Test Cases**:
- [ ] Project with no events at all → should show "Event Not Available"
- [ ] Project with `activeEventId: null` → should show "Event Not Available"
- [ ] Project with `activeEventId` pointing to non-existent event → should show "Event Not Available"

**Notes**: Confirmed `activeEventId` is `null` in Firestore. Server-side check `!project.activeEventId` should trigger `NoActiveEvent` render. Need to debug why component doesn't appear.

**Files to investigate**:
- `web/src/app/(public)/join/[projectId]/page.tsx` (lines 36-63)

---

### BUG-002: Empty states not rendering for events without experiences

**Observed**: Event with no experiences shows blank screen
**Expected**: "Coming Soon" message (`EmptyEvent` component)

**Test Cases**:
- [ ] Event with empty `experiences[]` array → should show "Coming Soon"
- [ ] Event with all experiences `enabled: false` → should show "Coming Soon"

**Files to investigate**:
- `web/src/app/(public)/join/[projectId]/page.tsx` (lines 68-83)

---

### BUG-003: Missing session not created when visiting with `exp` param only

**Observed**: Visiting `/join/[projectId]?exp=[expId]` (no `s` param) doesn't create a session
**Expected**: Should create a new session automatically, same as when `s` param has invalid value

**Current behavior**:
- `?exp=X&s=invalid` → creates new session ✓
- `?exp=X` (no `s`) → shows "no-session", doesn't create ✗

**Root cause**: `useSession` hook treats missing `sessionId` differently from invalid `sessionId`

**Files to fix**:
- `web/src/features/guest/hooks/useSession.ts`

---

## UX Issues (P1)

### UX-001: Loading spinner too small

**Observed**: Loading indicator is hard to see
**Expected**: Larger, more visible loading state

**Fix**: Increase spinner size from `h-8 w-8` to `h-12 w-12` (or larger)

**File**: `web/src/features/guest/components/LoadingScreen.tsx`

- [ ] Increase spinner size
- [ ] Verify visibility on mobile viewport

---

### UX-002: Experience screen shows truncated IDs

**Observed**: Guest ID and Session ID are truncated with `...`
**Expected**: Full IDs should be visible for debugging

**File**: `web/src/features/guest/components/ExperienceScreen.tsx`

- [ ] Show full guest ID
- [ ] Show full session ID
- [ ] Add experience ID display

---

## UX Issues (P2)

### UX-003: Welcome screen content not vertically centered

**Observed**: Welcome screen content is not centered vertically (unlike in preview shell)
**Expected**: Consistent vertical centering between preview and guest flow

**Solution**: Create shared `ContentLayout` component

**Proposed API**:
```tsx
interface ContentLayoutProps {
  children: React.ReactNode
  vAlign?: "top" | "center" | "bottom" | "stretch"  // default: "center"
  hAlign?: "left" | "center" | "right" | "stretch"  // default: "center"
  className?: string
}
```

**Tasks**:
- [ ] Create `web/src/components/shared/ContentLayout.tsx`
- [ ] Apply to `WelcomeContent`
- [ ] Apply to `ExperienceScreen`
- [ ] Apply to empty state components (`NoActiveEvent`, `EmptyEvent`)
- [ ] Apply to `LoadingScreen`
- [ ] Verify consistency with preview shell

---

## Design Decisions (Resolved)

### DECISION-001: Keep `exp` query parameter

**Question**: Do we need `exp` in URL if session already stores `experienceId`?

**Resolution**: Keep `exp` param for:
- Explicit state in URL
- Deep linking support
- Clarity for debugging

**Behavior**: If session's `experienceId` differs from URL `exp`, prioritize session's experience (current implementation is correct).

---

## Verification Checklist

After fixes are applied, re-run full QA:

### Core Flows
- [ ] Visit valid project URL → Welcome screen shows
- [ ] Visit invalid project → 404 shows
- [ ] Project with no active event → "Not Available" shows
- [ ] Event with no experiences → "Coming Soon" shows
- [ ] Tap experience card → Experience screen shows
- [ ] Check URL has `?exp=...&s=...`
- [ ] Tap "Back to Home" → Welcome screen shows
- [ ] Refresh on experience screen → Session preserved

### Edge Cases
- [ ] Visit `/join/[id]?exp=[expId]` (no `s`) → Creates session, updates URL
- [ ] Visit `/join/[id]?exp=[expId]&s=invalid` → Creates new session, updates URL
- [ ] Alter `s` value in URL → Creates new session

### Visual/UX
- [ ] Loading spinner visible and appropriately sized
- [ ] Content vertically centered on all screens
- [ ] Test on 320px mobile viewport
- [ ] Theme applied consistently
- [ ] No console errors

### Data
- [ ] Check Firestore for guest/session records
- [ ] Full IDs visible on experience screen (guest, session, experience)
