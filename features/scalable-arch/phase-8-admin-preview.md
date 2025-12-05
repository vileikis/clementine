# Phase 8: Admin Preview

## Summary

Enable admins to preview an experience exactly as guests will see it by integrating the Experience Engine into the editor. This gives creators confidence before publishing and solves the gap between "what's configured" and "what will actually happen."

## Goals

- Allow admins to run the full experience using the **same Experience Engine** as guests
- Ensure Preview mode mirrors Guest mode **1:1** (same components, same behavior)
- Provide safe default handling (disable camera in editor preview, use mock data when needed)
- Enable quick iteration: creators can make a change → preview → publish confidently

## Problem Statement

Currently, creators have two disconnected preview experiences:

1. **Step Editor Preview** - Shows individual steps in isolation, but doesn't reflect the real flow
2. **Playback Mode** - Uses legacy preview infrastructure that may differ from the actual Guest Engine

This creates uncertainty: "Will it actually work the way I configured it?"

## User Stories

### US1: Preview Individual Step in Editor

**As a** creator editing a step
**I want to** see a live preview of how that step will render
**So that** I can verify my configuration before moving on

**Acceptance Criteria:**
- Preview updates immediately as I edit
- Camera capture is disabled (shows placeholder)
- AI transform shows mock result
- Reward step shows placeholder result image
- All styling and theming matches guest experience

### US2: Full Experience Playback

**As a** creator who has configured an experience
**I want to** run through the entire experience end-to-end
**So that** I can verify the complete flow before publishing

**Acceptance Criteria:**
- Uses the Experience Engine in ephemeral mode
- Camera capture works (real capture)
- AI transformation runs (real result)
- All step transitions work correctly
- Can restart or exit at any time
- Mobile/desktop viewport toggle available

### US3: Quick Edit-Preview Cycle

**As a** creator iterating on my experience
**I want to** quickly switch between edit and preview
**So that** I can verify changes without losing context

**Acceptance Criteria:**
- One-click to enter preview mode
- One-click to exit back to editor
- Current step position preserved when exiting (optional)
- Changes reflect immediately in preview

## Step Renderer Strategy

### Key Principle: Single Source of Truth

All step rendering uses the **same step renderer components** from the Experience Engine. The difference is only in the **context** they run in:

### Context 1: Editor Step Preview (Static)

**Used in:** Experience Editor (step-by-step configuration)

**Behavior:**
- `isInteractive: false` - No user interaction
- Camera disabled → shows placeholder image
- AI Transform → shows "will trigger transformation" state
- Processing → shows UI without real progress
- Reward → shows placeholder result image
- Inputs → shows default/empty state

**Purpose:** Visual preview while editing, no side effects

### Context 2: Playback Mode (Full Flow)

**Used in:** PlaybackMode component with Experience Engine

**Behavior:**
- `isInteractive: true` - Full user interaction
- Camera enabled → real capture
- AI Transform → triggers real job
- Processing → shows real progress with rotating messages
- Reward → shows real result from transformation
- Inputs → accepts real user input

**Session:** Ephemeral (in-memory only, no Firestore)

**Purpose:** Validate complete experience before publishing

## Preview Modes Comparison

| Aspect | Editor Preview | Playback Mode |
|--------|---------------|---------------|
| Component | Step renderers | ExperienceEngine |
| Interactive | No | Yes |
| Session | None | Ephemeral |
| Camera | Disabled (placeholder) | Enabled (real) |
| AI Transform | Mock trigger | Real trigger |
| Real-time updates | No | Yes |
| Navigation | None | Full |
| Purpose | Visual feedback | Flow validation |

## User Flow

### Editor Preview Flow

1. Creator opens Experience Editor
2. Selects a step to edit
3. Preview panel shows live render of step (non-interactive)
4. As creator edits configuration, preview updates immediately
5. Creator can see exactly how the step will look

### Playback Flow

1. Creator clicks "Preview Experience" button
2. Full-screen overlay opens with Experience Engine
3. Engine runs in ephemeral mode (no Firestore)
4. Creator goes through steps as a guest would:
   - Info steps show content
   - Capture steps allow real camera capture
   - AI Transform triggers real transformation
   - Processing shows real progress
   - Reward shows real result
5. Creator can restart, navigate, or exit at any time
6. Exit returns to editor

## Out of Scope

- Persisted preview sessions (always ephemeral)
- Sharing preview links with others
- Analytics tracking during preview
- A/B testing in preview mode
- Multi-user preview collaboration

## Success Metrics

- Creators can preview any step while editing
- Creators can run full experience end-to-end
- Preview matches guest experience 1:1
- No bugs discovered in guest mode that weren't visible in preview

## Dependencies

- **Phase 7 (Experience Engine)**: Must be complete (✅ Done)
- **Step Types**: All step types must have renderers
- **Theme Provider**: Must work in preview context

## Design Decisions

1. **Navigation**: Playback always starts from first step. Full navigation supported (next, back, restart) via `PreviewNavigationBar` - matches existing PlaybackMode implementation.

2. **Debug Info**: No on-screen debug display. Console logging is sufficient for troubleshooting.

3. **Long Transformations**: No special handling needed. Preview uses the same timeout/behavior as guest mode - what you see is what guests get.
