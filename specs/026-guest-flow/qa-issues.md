# QA Issues: Guest Flow

**QA Date**: 2024-12-13
**Branch**: `026-guest-flow`
**Status**: All Issues Fixed (P0/P1/P2) - Awaiting Re-test

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

### BUG-002 Update: Empty experiences now shows welcome screen
**Change**: Instead of showing a generic "Coming Soon" screen when event has no experiences, now shows the full welcome screen with "No experiences available yet" message in the experience cards area.

**Rationale**: Better UX - guests see the event branding and can understand they're at the right place, just no experiences available yet.

**Files changed**:
- `web/src/app/(public)/join/[projectId]/page.tsx` - removed EmptyEvent check
- `web/src/features/guest/components/welcome/ExperienceCards.tsx` - theme-aware empty message

---

### UX-003 Fix: Content not vertically centered (P2)
**Root Cause**: ThemedBackground had mixed concerns (theming + layout) and required boilerplate `className="flex h-full flex-col"` everywhere. Child components used `flex-1` hacks that conflicted with parent layouts.

**Solution**: Refactored `ThemedBackground` with sensible defaults:
- Outer container: `flex flex-1 flex-col` built-in (no need to pass className)
- Content wrapper: centered, max-width 768px, vertically centered, scrollable by default
- Single content wrapper (not two nested divs)
- `contentClassName` prop to override or disable (`contentClassName=""`)

**Fix**:
1. Refactored `ThemedBackground` to have built-in centering and max-width
2. Simplified all guest components to remove redundant `flex-1 justify-center` classes
3. Parent components just need `className="h-screen"` to set full height

**Files changed**:
- `web/src/features/theming/components/ThemedBackground.tsx` - major refactor
- `web/src/app/(public)/join/[projectId]/page.tsx` - simplified to `className="h-screen"`
- `web/src/app/(public)/join/[projectId]/JoinPageClient.tsx` - simplified to `className="h-screen"`
- `web/src/features/guest/components/EmptyStates.tsx` - removed flex-1 hacks
- `web/src/features/guest/components/LoadingScreen.tsx` - removed flex-1 hacks
- `web/src/features/guest/components/ExperienceScreen.tsx` - removed flex-1 hacks
- `web/src/features/guest/components/welcome/WelcomeContent.tsx` - simplified layout

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

### UX-003: Welcome screen content not vertically centered ✅ FIXED

**Observed**: Welcome screen content is not centered vertically (unlike in preview shell)
**Expected**: Consistent vertical centering between preview and guest flow

**Solution**: Refactored `ThemedBackground` with sensible defaults instead of creating a separate `ContentLayout` component. This approach:
- Eliminates boilerplate `className="flex h-full flex-col"` everywhere
- Provides centered, max-width (768px) content by default
- Uses single content wrapper instead of nested divs
- Allows override via `contentClassName` prop

**Tasks**:
- [x] Refactor `ThemedBackground` with built-in centering
- [x] Simplify `WelcomeContent` - remove redundant flex/justify classes
- [x] Simplify `ExperienceScreen` - remove redundant flex/justify classes
- [x] Simplify empty state components (`NoActiveEvent`) - remove flex-1 hacks
- [x] Simplify `LoadingScreen` - remove flex-1 hacks
- [ ] Verify consistency with preview shell (manual QA)

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
