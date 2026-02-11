# Research: Experience-to-Share Transition Gap

## Research Summary

This feature combines a UX gap fix with a targeted runtime refactor. Research covers the completing state pattern, store design for the Experience reference, and the prop-to-store migration for RuntimeTopBar and RuntimeNavigation.

## R1: Completing State UI Pattern

**Decision**: Use `Loader2` spinner + `ThemedText` support text, centered with flexbox.

**Rationale**: Follows two existing patterns in the codebase:
- `PermissionLoading.tsx` — Loader2 with themed text and opacity for loading states within the runtime context
- `JobStatusDisplay.tsx` — Loader2 `h-12 w-12 animate-spin text-primary` with `flex h-full items-center justify-center` centering and `gap-4` spacing

Using `ThemedText` ensures the support text respects the experience creator's theme (font, color), which is important since the completing state appears in the guest-facing runtime where theming is active.

**Alternatives considered**:
- `ShareLoadingRenderer` — Rejected per spec. Tailored to share-specific content (AI generation messaging, image skeleton). Different UX moment.
- Plain `<p>` with Tailwind classes — Would not respect experience theme. Inconsistent with other runtime components.
- Skeleton/pulse animation — Overkill for a simple "processing" state. Spinner communicates "working" more clearly.

## R2: Store full Experience reference vs experienceId

**Decision**: Store the full `Experience` object in the runtime Zustand store, replacing `experienceId: string | null` with `experience: Experience | null`.

**Rationale**:
- RuntimeTopBar needs `experience.name` — without the full reference, the name must be prop-drilled
- Future runtime components may need other experience fields (media, profile, config)
- The `Experience` type from `@clementine/shared` is already well-defined (id, name, status, profile, media, draft, published, versioning fields)
- Zustand stores hold references, not deep copies — storing the object is cheap

**Alternatives considered**:
- Store just `experienceName` alongside `experienceId` — Fixes the immediate need but doesn't scale. Adding another field later means another store + API change.
- Pass experience through React context — Over-engineered when the Zustand store already exists and is the established pattern for runtime state.

## R3: RuntimeTopBar and RuntimeNavigation — Props vs Store

**Decision**: Convert both components to read from the store via `useRuntime()`, keeping only callback props that come from consumers.

**RuntimeTopBar**: 7 props → 1 (`onClose`). Everything except the exit callback lives in the store.
**RuntimeNavigation**: 3 props → 0 required (optional `buttonLabel` kept). `next` and `canProceed` both live in the store.

**Rationale**:
- Children of ExperienceRuntime (GuestRuntimeContent, PreviewRuntimeContent) already use `useRuntime()` directly — the current prop drilling on TopBar/Navigation is inconsistent
- RuntimeNavigation is a clean win: zero props needed, fully self-contained
- RuntimeTopBar still needs `onClose` from the consumer (can't live in store — it's a navigation callback), but everything else (step index, total steps, experience name, isComplete, canGoBack, back action) comes from the store

**Alternatives considered**:
- Keep prop drilling — Works but adds friction for every new feature that needs store state in these components (like `isComplete` for the gap fix). The current `onBack`/`onClose`/`onHomeClick` prop split on RuntimeTopBar is already confusing.
- Full context approach (separate from store) — Unnecessary indirection when the Zustand store already provides this exact capability.

## R4: onHomeClick → onClose rename

**Decision**: Rename `onHomeClick` to `onClose` across ExperienceRuntime and RuntimeTopBar.

**Rationale**: The current RuntimeTopBar has three overlapping callback props: `onHomeClick` (confirms then navigates), `onClose` (fires on X button), `onBack` (fires on back arrow). In practice, `onClose` is never passed by ExperienceRuntime (always `undefined`), and `onHomeClick` is the real exit handler. Renaming to `onClose` simplifies the mental model: one exit action, one callback, with confirmation dialog.

**Consumer impact**: Four files need `onHomeClick` → `onClose` rename. Each is a single prop rename — no logic changes.

## R5: Dead Code Removal Safety

**Decision**: Remove `isComplete` handling from GuestRuntimeContent and PreviewRuntimeContent.

**Rationale**: When `store.isComplete` is true, ExperienceRuntime renders the completing state div instead of `{children}`. The children (GuestRuntimeContent, PreviewRuntimeContent) are never in the React tree during completion, making their `isComplete` checks unreachable dead code.

**Verification**: The `isCompleting` ternary in ExperienceRuntime's render replaces `{children}` entirely. React does not render children that are not in the JSX tree.
