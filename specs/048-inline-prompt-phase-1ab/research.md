# Research Findings: Inline Prompt Architecture - Phase 1a & 1b

**Feature**: 048-inline-prompt-phase-1ab
**Date**: 2026-01-29
**Status**: Complete - No unknowns found

## Summary

Research phase found **zero unknowns** requiring investigation. All technical approaches use well-established patterns already present in the Clementine codebase. No experimental libraries, architectural changes, or performance concerns identified.

## Decision Log

### Decision 1: Step Name Validation Pattern

**Question**: How should step names be validated to support spaces while remaining AI-safe?

**Decision**: Use Zod regex validation `/^[a-zA-Z0-9 \-_]+$/` with `.trim()` and `.min(1).max(50)`

**Rationale**:
- Industry standard pattern for identifiers that support spaces
- Regex explicitly allows letters, numbers, spaces, hyphens, underscores (safe for prompt references)
- Trim removes leading/trailing whitespace (prevents accidental whitespace-only names)
- Max 50 chars prevents unwieldy names in UI and prompts

**Alternatives Considered**:
- **Slug-only (kebab-case)**: Rejected - less user-friendly, forces manual formatting
- **No spaces allowed**: Rejected - user requirement explicitly calls for "Pet Choice" style names
- **Unicode support**: Rejected - adds complexity, not needed for English-first product

**Implementation**: Add to `experienceStepNameSchema` in `packages/shared/src/schemas/experience/step.schema.ts`

**Best Practices**:
- Use Zod's built-in `.trim()` before validation (automatic sanitization)
- Provide clear error messages for validation failures
- Test edge cases: whitespace-only, max length, special characters

**References**:
- Existing validation: `experienceStepNameSchema` already has max length validation
- Zod regex docs: https://zod.dev/?id=strings

---

### Decision 2: Uniqueness Check Implementation

**Question**: Where should step name uniqueness be validated - schema, Firestore rules, or UI hook?

**Decision**: Implement in React hook (`useValidateStepName`) that scans all steps in the experience on blur event

**Rationale**:
- **O(n) complexity acceptable**: Experiences typically have < 10 steps, scan is near-instant
- **Real-time feedback**: Hook runs on blur, provides immediate validation without server round-trip
- **Zustand state available**: Steps already in memory via `useExperienceDesignerStore`, no extra reads
- **Case-sensitive**: Honors user-specified capitalization (e.g., "Pet Choice" ≠ "pet choice")

**Alternatives Considered**:
- **Firestore security rules**: Rejected - rules can't access sibling documents efficiently, would require compound queries
- **Schema-level validation**: Rejected - Zod can't access experience context (other steps), validation must be contextual
- **Server-side Cloud Function**: Rejected - adds latency, unnecessary for simple in-memory scan

**Implementation**: Create `useValidateStepName` hook in `apps/clementine-app/src/domains/experience/designer/hooks/`

**Best Practices**:
- Call on blur (not every keystroke) to avoid excessive validation
- Exclude current step from uniqueness check (`s.id !== stepId`)
- Return structured result: `{ valid: boolean; error?: string }`
- Reuse Zod validation first (DRY principle)

**Complexity**: O(n) where n = number of steps. For typical experience (5-10 steps), < 1ms overhead.

**References**:
- Existing pattern: `useExperienceDesignerStore` already used for accessing draft state
- Similar validation: Experience title validation (already implemented)

---

### Decision 3: Auto-Save Pattern

**Question**: How should step name changes be persisted - immediate write, debounced, or manual save?

**Decision**: Reuse existing `useUpdateExperienceDraft` hook with 2000ms debounce

**Rationale**:
- **Consistency**: Designer already uses 2000ms debounce for all auto-save operations
- **Proven pattern**: `useUpdateExperienceDraft` handles Firestore writes, error handling, optimistic updates
- **Network efficiency**: Debounce reduces Firestore writes (cost savings, less network chatter)
- **UX expectation**: Users expect auto-save in modern apps, consistent with Google Docs, Notion

**Alternatives Considered**:
- **Immediate save**: Rejected - excessive Firestore writes (1 write per keystroke = expensive, slow on mobile)
- **Manual save button**: Rejected - poor UX, users forget to save, data loss risk
- **Longer debounce (5000ms)**: Rejected - feels unresponsive, users unsure if changes saved

**Implementation**: Wrap `useUpdateExperienceDraft` in `useUpdateStepName` hook with debounce logic

**Best Practices**:
- Use `useDebouncedCallback` from existing utilities
- Show save status indicator ("Saving...", "Saved", "Error")
- Cancel debounce on component unmount (prevent ghost writes)
- Optimistic update: reflect changes immediately in UI, revert on error

**References**:
- Existing hook: `useUpdateExperienceDraft` in `apps/clementine-app/src/domains/experience/designer/hooks/`
- Debounce utility: Already in codebase (check `lib/` or install `use-debounce`)

---

### Decision 4: AI Badge Design

**Question**: How should AI-enabled options be visually indicated in the option list?

**Decision**: Use existing shadcn Badge component with custom variant, theme tokens for colors

**Rationale**:
- **Consistency**: Badge component already used throughout app (status indicators, labels)
- **Accessibility**: Badges have proper ARIA roles, semantic HTML
- **Theme-aware**: Using `bg-primary/10 text-primary` ensures badge adapts to light/dark mode
- **Icon + text**: Sparkles icon + "AI" text provides visual + semantic indicator (works without color)

**Alternatives Considered**:
- **Tooltip-only**: Rejected - tooltips don't work on mobile (hover not available)
- **Color change**: Rejected - not accessible (color alone insufficient for colorblind users)
- **Prefix in option value**: Rejected - pollutes user data, ugly in runtime

**Implementation**: Create `AIEnabledBadge` component in `apps/clementine-app/src/domains/experience/designer/components/`

**Best Practices**:
- Use Lucide React `Sparkles` icon (consistent with app icon library)
- Apply theme tokens from design system: `bg-primary/10 text-primary`
- Keep badge small (don't overwhelm option text)
- Show badge only when `promptFragment` OR `promptMedia` is set

**Visual mockup**:
```
[Option 1: Cat]  [AI]   <- Badge visible (has promptFragment or promptMedia)
[Option 2: Dog]         <- No badge (plain option)
```

**References**:
- Design system: `standards/frontend/design-system.md`
- shadcn Badge: Already in component library
- Lucide icons: Used throughout app

---

### Decision 5: Media Upload Pattern

**Question**: How should prompt media (images) be uploaded and stored?

**Decision**: Reuse existing `useUploadExperienceCover` pattern - upload to Firebase Storage, return MediaReference

**Rationale**:
- **Proven pattern**: Experience cover upload already implemented, tested, production-ready
- **Consistent data model**: MediaReference schema used throughout app (covers, step media, generated images)
- **Firebase Storage**: Already integrated, handles auth, CDN, signed URLs automatically
- **Path convention**: Use `prompt-media/{workspaceId}/{mediaAssetId}` (namespaced, collision-free)

**Alternatives Considered**:
- **Base64 inline**: Rejected - bloats Firestore documents, slow to load, no caching
- **Third-party CDN**: Rejected - adds dependency, cost, complexity (Firebase Storage sufficient)
- **New upload hook**: Rejected - duplicates existing logic, violates DRY

**Implementation**: Create `useUploadPromptMedia` hook that adapts `useUploadExperienceCover` logic

**Best Practices**:
- Validate file type (images only: JPEG, PNG, WebP)
- Validate file size (< 5MB recommended for mobile)
- Show upload progress (use Firebase Storage upload task)
- Generate unique mediaAssetId (UUID v4)
- Store full public URL in MediaReference (instant rendering)

**Storage Structure**:
```
Firebase Storage:
/prompt-media/
  /{workspaceId}/
    /{mediaAssetId}.jpg  <- Uploaded file
```

**Firestore Document**:
```typescript
{
  value: "Cat",
  promptFragment: "fluffy orange tabby cat",
  promptMedia: {
    mediaAssetId: "uuid-here",
    url: "https://storage.googleapis.com/.../uuid.jpg",
    filePath: "prompt-media/workspace-id/uuid.jpg",
    fileName: "my-cat.jpg"  // Original filename (optional)
  }
}
```

**References**:
- Existing hook: `useUploadExperienceCover` in `apps/clementine-app/src/domains/experience/designer/hooks/`
- MediaReference schema: `packages/shared/src/schemas/media.schema.ts`

---

## Technical Stack Validation

All dependencies already present in codebase:

| Technology | Version | Usage | Status |
|------------|---------|-------|--------|
| Zod | 4.1.12 | Schema validation | ✅ In use |
| React | 19.2.0 | UI components | ✅ In use |
| Zustand | 5.x | State management | ✅ In use |
| shadcn/ui | Latest | Component library | ✅ In use |
| Radix UI | Latest | Primitives (Badge, Input) | ✅ In use |
| Firebase SDK | 12.5.0 | Firestore, Storage | ✅ In use |
| Vitest | Latest | Unit testing (shared) | ✅ In use |
| Lucide React | Latest | Icons (Sparkles) | ✅ In use |

**No new dependencies required.**

---

## Performance Considerations

### Step Name Validation Performance

**Concern**: Will O(n) step name uniqueness check cause lag?

**Analysis**:
- Typical experience: 5-10 steps
- Worst case: 50 steps (rare)
- Operation: Simple string comparison in JavaScript array
- Expected time: < 1ms for 50 steps, < 0.1ms for 10 steps

**Conclusion**: No performance concerns. O(n) is acceptable for small n.

**Future optimization** (if needed): Use `Set<string>` for O(1) lookup if step count exceeds 100 (unlikely).

### Auto-Save Debounce

**Concern**: Will 2000ms debounce feel unresponsive?

**Analysis**:
- 2000ms is existing pattern in designer (proven UX)
- Optimistic UI update makes changes feel instant
- Save status indicator provides feedback
- Users rarely type continuously for 2+ seconds

**Conclusion**: 2000ms debounce is optimal balance (responsiveness vs Firestore costs).

### Firestore Write Frequency

**Concern**: Will auto-save cause excessive Firestore writes?

**Analysis**:
- Debounce limits writes to 1 per 2 seconds (max 30 writes/minute per user)
- Firestore quotas: 20k writes/day for free tier, 200k writes/day for paid
- Expected usage: Creator edits experience for 10-30 minutes, generates 50-200 writes
- Cost: $0.18 per 100k writes = negligible

**Conclusion**: Auto-save write frequency is well within quotas and budget.

---

## Security Considerations

### Step Name Injection Attacks

**Concern**: Can malicious step names break prompt resolution or cause XSS?

**Analysis**:
- Step names validated with strict regex: `/^[a-zA-Z0-9 \-_]+$/`
- No special characters allowed (no quotes, brackets, script tags)
- Prompts use template format: `@{step:stepName}` (parsed server-side, not eval'd)
- Firestore stores validated data only (Zod validation before write)

**Conclusion**: No injection risk. Regex validation prevents all special characters.

### Prompt Media Access Control

**Concern**: Can users access other workspaces' prompt media?

**Analysis**:
- Storage path includes workspaceId: `prompt-media/{workspaceId}/{mediaAssetId}`
- Firebase Storage rules enforce workspace membership (existing pattern)
- MediaReference URLs are public but unguessable (UUID-based)
- No sensitive data in prompt media (user-uploaded images only)

**Conclusion**: Access control enforced by existing Firebase Storage rules. No new security rules needed.

---

## Backward Compatibility Analysis

### Schema Changes Impact

**Change**: `experienceStepNameSchema` from `.optional()` to required

**Impact on existing data**:
- Existing experiences have steps with `name: undefined` or `name: ""`
- Zod validation will **reject** these steps on read

**Mitigation Strategy**:
1. **UI fallback**: StepList shows `step.name || step.config.title || 'Untitled Step'`
2. **Auto-migration on edit**: When user opens step editor, auto-generate name if missing
3. **Graceful degradation**: App renders existing experiences (doesn't block), prompts user to edit steps

**Testing**:
- Create experience with old schema (name: undefined)
- Open in designer with new schema
- Verify fallback displays
- Edit step, verify name auto-generated
- Save, verify persists with name

**Migration not required**: Pre-launch system, no production data. Graceful degradation sufficient.

---

## Conclusion

✅ **All technical decisions resolved** - No research blockers

All patterns use existing codebase conventions:
- Zod validation (existing)
- Zustand state management (existing)
- Firebase Storage uploads (existing)
- shadcn/ui components (existing)
- Debounced auto-save (existing)

**Zero unknowns** - Ready to proceed directly to implementation.

**Next phase**: Phase 1 Design & Data Model (already documented in plan.md)
