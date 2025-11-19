# Quickstart: Event Collection Schema Refactor

**Feature**: 001-event-collection-update
**Date**: 2025-11-19
**For**: Developers implementing this feature

## Overview

This quickstart guide provides step-by-step instructions for implementing the Event schema refactor. Follow these steps in order to migrate from flat prefixed fields to nested semantic objects.

**Estimated Time**: 4-6 hours

---

## Prerequisites

Before starting, ensure you have:

- [x] Read the [spec.md](./spec.md) to understand requirements and acceptance criteria
- [x] Read the [data-model.md](./data-model.md) to understand the new schema structure
- [x] Read the [research.md](./research.md) to understand technical decisions
- [x] Reviewed [contracts/server-actions.md](./contracts/server-actions.md) for API contracts
- [x] Local development environment running (`pnpm dev` from repo root)
- [x] Checked out feature branch: `001-event-collection-update`

---

## Implementation Checklist

### Phase 1: Update Schemas & Types (1-2 hours)

#### 1.1 Update Event TypeScript Types

**File**: `web/src/features/events/types/event.types.ts`

**Changes**:
- [ ] Add new nested object interfaces: `EventTheme`, `EventWelcome`, `EventEnding`, `EventShareConfig`
- [ ] Update `Event` interface to use nested objects instead of flat prefixed fields
- [ ] Remove deprecated field types (`brandColor`, `showTitleOverlay`, survey fields, flat prefixed fields)

**Example**:
```typescript
// ADD new interfaces
export interface EventTheme {
  buttonColor?: string;
  buttonTextColor?: string;
  backgroundColor?: string;
  backgroundImage?: string;
}

export interface EventWelcome {
  title?: string;
  body?: string;
  ctaLabel?: string;
  backgroundImage?: string;
  backgroundColor?: string;
}

export interface EventEnding {
  title?: string;
  body?: string;
  ctaLabel?: string;
  ctaUrl?: string;
}

export interface EventShareConfig {
  allowDownload: boolean;
  allowSystemShare: boolean;
  allowEmail: boolean;
  socials: ShareSocial[];
}

// UPDATE Event interface
export interface Event {
  id: string;
  title: string;
  status: EventStatus;
  companyId: string | null;
  joinPath: string;
  qrPngPath: string;
  publishStartAt?: number;
  publishEndAt?: number;

  // NEW nested objects
  theme?: EventTheme;
  welcome?: EventWelcome;
  ending?: EventEnding;
  share: EventShareConfig;

  // Denormalized counters (unchanged)
  experiencesCount: number;
  sessionsCount: number;
  readyCount: number;
  sharesCount: number;

  createdAt: number;
  updatedAt: number;

  // REMOVE deprecated fields:
  // brandColor, showTitleOverlay, survey fields, flat prefixed fields
}
```

#### 1.2 Update Zod Schemas

**File**: `web/src/features/events/lib/schemas.ts`

**Changes**:
- [ ] Add Zod schemas for nested objects: `eventThemeSchema`, `eventWelcomeSchema`, `eventEndingSchema`, `eventShareConfigSchema`
- [ ] Update `eventSchema` to use nested object schemas
- [ ] Update Server Action schemas: `updateEventWelcomeSchema`, `updateEventEndingSchema`, add `updateEventShareSchema`, add `updateEventThemeSchema`
- [ ] Remove deprecated field schemas

**Reference**: See [data-model.md](./data-model.md#validation-rules) for complete schema definitions

#### 1.3 Update Type Exports

**File**: `web/src/features/events/lib/schemas.ts`

**Changes**:
- [ ] Export new Zod schemas
- [ ] Export TypeScript types inferred from schemas using `z.infer<typeof schema>`

```typescript
export type Event = z.infer<typeof eventSchema>;
export type EventTheme = z.infer<typeof eventThemeSchema>;
export type EventWelcome = z.infer<typeof eventWelcomeSchema>;
export type EventEnding = z.infer<typeof eventEndingSchema>;
export type EventShareConfig = z.infer<typeof eventShareConfigSchema>;
```

**Validation**: Run `pnpm type-check` to ensure no TypeScript errors

---

### Phase 2: Update Server Actions (1-2 hours)

#### 2.1 Refactor updateEventWelcome

**File**: `web/src/features/events/actions/events.ts`

**Changes**:
- [ ] Update to use dot notation for nested object fields: `"welcome.title"`, `"welcome.body"`, etc.
- [ ] Replace flat field names (`welcomeTitle` → `"welcome.title"`)
- [ ] Use `updateEventWelcomeSchema` for validation

**Reference**: See [contracts/server-actions.md](./contracts/server-actions.md#updateeventwelcome) for implementation pattern

#### 2.2 Refactor updateEventEnding

**File**: `web/src/features/events/actions/events.ts`

**Changes**:
- [ ] Update to use dot notation for `ending.*` fields
- [ ] Remove share-related fields (move to separate `updateEventShare` action)
- [ ] Use `updateEventEndingSchema` for validation

#### 2.3 Create updateEventShare (NEW)

**File**: `web/src/features/events/actions/events.ts`

**Changes**:
- [ ] Create new Server Action for updating `event.share.*` fields
- [ ] Use dot notation: `"share.allowDownload"`, `"share.socials"`, etc.
- [ ] Use `updateEventShareSchema` for validation

#### 2.4 Create updateEventTheme (NEW)

**File**: `web/src/features/events/actions/events.ts`

**Changes**:
- [ ] Create new Server Action for updating `event.theme.*` fields
- [ ] Use dot notation: `"theme.buttonColor"`, `"theme.backgroundColor"`, etc.
- [ ] Use `updateEventThemeSchema` for validation

**Validation**: Run `pnpm lint` and `pnpm type-check`

---

### Phase 3: Update Event Designer Components (1-2 hours)

#### 3.1 Refactor WelcomeEditor

**File**: `web/src/features/events/components/designer/WelcomeEditor.tsx`

**Changes**:
- [ ] Update state initialization to use `event.welcome?.title ?? ""`
- [ ] Update form field bindings to read from `event.welcome.*`
- [ ] Update Server Action call to use new `updateEventWelcome`
- [ ] Use optional chaining throughout: `event.welcome?.field`

**Example**:
```typescript
// BEFORE
const [welcomeTitle, setWelcomeTitle] = useState(event.welcomeTitle || "");

// AFTER
const [title, setTitle] = useState(event.welcome?.title ?? "");
```

#### 3.2 Refactor EndingEditor

**File**: `web/src/features/events/components/designer/EndingEditor.tsx`

**Changes**:
- [ ] Update state initialization to use `event.ending?.*` and `event.share.*`
- [ ] Update form field bindings
- [ ] Update Server Action calls to use `updateEventEnding` and `updateEventShare`
- [ ] Split save logic into two separate actions (ending and share)

#### 3.3 Create ThemeEditor (NEW)

**File**: `web/src/features/events/components/designer/ThemeEditor.tsx` (CREATE)

**Changes**:
- [ ] Create new component for editing `event.theme.*` fields
- [ ] Form fields: buttonColor, buttonTextColor, backgroundColor, backgroundImage
- [ ] Use color picker input for color fields
- [ ] Use ImageUploadField for backgroundImage
- [ ] Call `updateEventTheme` Server Action on save

**Reference**: Follow same structure as WelcomeEditor for consistency

**Validation**: Run `pnpm dev` and test in browser

---

### Phase 4: Update Tests (1 hour)

#### 4.1 Update Server Action Tests

**File**: `web/src/features/events/actions/events.test.ts`

**Changes**:
- [ ] Update `updateEventWelcome` tests to verify dot notation usage
- [ ] Update `updateEventEnding` tests
- [ ] Add tests for `updateEventShare` (new)
- [ ] Add tests for `updateEventTheme` (new)
- [ ] Verify all tests check for correct Firestore update calls with nested field names

#### 4.2 Update Repository Tests

**File**: `web/src/features/events/repositories/events.test.ts`

**Changes**:
- [ ] Update mock Event data to use nested objects instead of flat fields
- [ ] Verify repository correctly reads nested objects from Firestore

#### 4.3 Create Component Tests

**Files**: Create new test files
- [ ] `web/src/features/events/components/designer/WelcomeEditor.test.tsx`
- [ ] `web/src/features/events/components/designer/EndingEditor.test.tsx`
- [ ] `web/src/features/events/components/designer/ThemeEditor.test.tsx`

**Test Coverage**:
- Render component with event data (nested objects)
- Update form fields and verify state changes
- Submit form and verify Server Action called with correct data
- Handle optional nested objects (undefined welcome/ending/theme)

**Validation**: Run `pnpm test` to ensure all tests pass

---

### Phase 5: Update Firestore Security Rules (30 minutes)

#### 5.1 Update Security Rules

**File**: `web/firestore.rules`

**Changes**:
- [ ] Add validation to deny writes containing deprecated field keys
- [ ] Ensure `share` field is required
- [ ] Validate `status` enum values
- [ ] Allow nested object writes

**Reference**: See [data-model.md](./data-model.md#firestore-security-rules) for complete rule definition

#### 5.2 Deploy Security Rules

```bash
# From repo root
firebase deploy --only firestore:rules
```

**Validation**: Test with Firestore emulator or manual validation in Firebase Console

---

### Phase 6: Validation Loop (30 minutes)

Run the complete validation loop to ensure code quality:

#### 6.1 Lint

```bash
pnpm lint
```

**Expected**: Zero errors, zero warnings

#### 6.2 Type Check

```bash
pnpm type-check
```

**Expected**: Zero TypeScript errors

#### 6.3 Tests

```bash
pnpm test
```

**Expected**: All tests pass (100% pass rate)

#### 6.4 Manual Testing

1. Start dev server: `pnpm dev`
2. Navigate to Event Designer: `http://localhost:3000/events/[eventId]`
3. Test WelcomeEditor:
   - [ ] Edit welcome title, body, CTA
   - [ ] Upload background image
   - [ ] Change background color
   - [ ] Save and verify persistence (refresh page)
4. Test EndingEditor:
   - [ ] Edit ending title, body, CTA label/URL
   - [ ] Update share settings (download, email, socials)
   - [ ] Save and verify persistence
5. Test ThemeEditor (if created):
   - [ ] Edit theme colors
   - [ ] Upload background image
   - [ ] Save and verify persistence

**Expected**: All editors work correctly with no console errors

---

## Common Pitfalls

### ❌ Wrong: Replacing Entire Nested Object

```typescript
// DON'T DO THIS - deletes omitted fields
await eventRef.update({
  welcome: { title: "New Title" }, // This deletes body, ctaLabel, etc.
});
```

### ✅ Correct: Using Dot Notation

```typescript
// DO THIS - updates only specified fields
await eventRef.update({
  "welcome.title": "New Title", // Other fields remain unchanged
});
```

### ❌ Wrong: Accessing Nested Fields Without Optional Chaining

```typescript
// DON'T DO THIS - will crash if welcome is undefined
const title = event.welcome.title;
```

### ✅ Correct: Using Optional Chaining

```typescript
// DO THIS - safe even if welcome is undefined
const title = event.welcome?.title ?? "";
```

### ❌ Wrong: Mixing Old and New Field Names

```typescript
// DON'T DO THIS - inconsistent schema
const title = event.welcomeTitle || event.welcome?.title; // Confusing
```

### ✅ Correct: Using Only New Nested Structure

```typescript
// DO THIS - always use new structure
const title = event.welcome?.title ?? "";
```

---

## Verification Checklist

Before marking this feature complete, verify:

- [ ] All TypeScript errors resolved (`pnpm type-check`)
- [ ] All ESLint errors resolved (`pnpm lint`)
- [ ] All tests passing (`pnpm test`)
- [ ] No code references deprecated fields (search codebase for `welcomeTitle`, `endHeadline`, `shareAllowDownload`, etc.)
- [ ] Firestore security rules deny writes to deprecated fields
- [ ] Event Designer Welcome editor saves/loads correctly
- [ ] Event Designer Ending editor saves/loads correctly
- [ ] Event Designer Theme editor saves/loads correctly (if implemented)
- [ ] Manual testing in browser shows no console errors
- [ ] Existing events with legacy fields still display correctly (graceful degradation)
- [ ] New events use only nested object fields

---

## Rollback Plan

If critical issues are discovered after deployment:

1. **Revert code changes**: Merge commit that reverts this feature branch
2. **Revert Firestore rules**: Deploy previous version of security rules
3. **No data rollback needed**: No Firestore data was migrated, so no data cleanup required

---

## Next Steps

After completing implementation:

1. Create pull request from `001-event-collection-update` branch
2. Request code review
3. Verify CI/CD pipeline passes (lint, type-check, test)
4. Merge to main branch
5. Deploy to staging environment
6. Verify staging deployment works correctly
7. Deploy to production
8. Monitor for errors in production logs

---

## Questions?

Refer to:
- [spec.md](./spec.md) - Feature requirements and acceptance criteria
- [data-model.md](./data-model.md) - Complete schema definitions
- [research.md](./research.md) - Technical decisions and rationale
- [contracts/server-actions.md](./contracts/server-actions.md) - Server Action contracts
