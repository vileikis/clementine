# Events Feature Refactoring - Implementation Checklist

**Estimated Total Time**: 12-15 hours

---

## Phase 0: Standards Compliance Fixes (1-2 hours)

**Status**: ✅ Complete

- [x] **Task 0.1**: Move `lib/schemas.ts` → `schemas/events.schemas.ts` + create barrel export
- [x] **Task 0.2**: Create `constants.ts` with validation constraints (no magic numbers)
- [x] **Task 0.3**: Fix all optional fields to use `.nullable().optional().default(null)`
- [x] **Task 0.4**: Extract all nested schemas (theme, etc.) to separate named schemas
- [x] **Task 0.5**: Update error handlers to include field paths from `error.issues`
- [x] **Task 0.6**: Remove unnecessary existence checks before `.update()` (trust Firebase)
- [x] **Task 0.7**: Implement dynamic field mapping using `Object.entries()` in update actions
- [x] **Task 0.8**: Standardize all error responses to use structured `{ code, message, issues? }` format

---

## Phase 1: Schema Update to V4 (2-3 hours)

- [x] **Task 1.1**: Update `schemas/events.schemas.ts`:
  - Change status enum: `"live"` → `"published"`
  - Create nested theme sub-schemas: `text`, `button`, `background`
  - Remove: `welcome`, `ending`, `share`, counters
  - Add: `activeJourneyId`, restructured `theme`
  - Rename: `title` → `name`, `companyId` → `ownerId`
  - Use Zod v4 validators: `z.url()` not `z.string().url()`

- [x] **Task 1.2**: Update `types/event.types.ts`:
  - Match new schema structure
  - Remove old interfaces (EventWelcome, EventEnding, EventShareConfig)
  - Add new theme sub-interfaces

- [x] **Task 1.3**: Update `constants.ts`:
  - Rename `TITLE_LENGTH` → `NAME_LENGTH`
  - Add `THEME_DEFAULTS` for UI default values

---

## Phase 2: Delete Content Code (30 mins)

**Status**: ✅ Complete

- [x] **Task 2.1**: Delete files:
  - `components/designer/WelcomeEditor.tsx`
  - `components/designer/WelcomeEditor.test.tsx`
  - `components/designer/EndingEditor.tsx`
  - `components/designer/EndingEditor.test.tsx`

- [x] **Task 2.2**: Update `components/shared/DesignSubTabs.tsx` (no changes needed - already using V4 structure)

- [x] **Task 2.3**: Delete actions from `actions/events.ts`:
  - `updateEventWelcome()`
  - `updateEventEnding()`
  - `updateEventShare()`

- [x] **Task 2.4**: Delete test suites from `actions/events.test.ts` (3 describe blocks) - will be done in Phase 6

- [x] **Task 2.5**: Remove exports from `index.ts`

---

## Phase 3: Repository Layer (1 hour)

- [x] **Task 3.1**: Update `createEvent()`:
  - Parameters: `name`, `ownerId`, `primaryColor`
  - Initialize full theme structure with defaults
  - Add `activeJourneyId: null`
  - Remove counters and share config

- [x] **Task 3.2**: Update `listEvents()` filter: `companyId` → `ownerId`

- [x] **Task 3.3**: Rename `updateEventTitle()` → `updateEventName()`

- [x] **Task 3.4**: Update repository tests with new schema

---

## Phase 4: Actions Layer (2-3 hours)

- [x] **Task 4.1**: Update `createEventAction()`:
  - Input schema: `name`, `ownerId`, `primaryColor`
  - Validate owner (company) exists and is active
  - Use structured error responses

- [x] **Task 4.2**: Update `listEventsAction()` filter: `companyId` → `ownerId`

- [x] **Task 4.3**: Rename `updateEventTitleAction()` → `updateEventNameAction()`

- [x] **Task 4.4**: Update `updateEventStatusAction()` enum: `"live"` → `"published"`

- [x] **Task 4.5**: Refactor `updateEventTheme()`:
  - Support new nested structure (text, button, background)
  - Use dynamic field mapping (not manual if-statements)
  - Use Firestore dot notation for nested updates

- [x] **Task 4.6**: Create `updateEventSwitchboardAction()` for `activeJourneyId`

---

## Phase 5: UI Components (3-4 hours)

**Status**: ✅ Complete

- [x] **Task 5.1**: Refactor `ThemeEditor.tsx`:
  - Use `useReducer` for managing theme config state
  - Implement 7 sections: Identity, Primary Color, Text, Button, Background, Logo, Font
  - Support full nested theme structure
  - Update preview to reflect all new settings

- [x] **Task 5.2**: Update `EventForm.tsx`:
  - Rename fields: `title` → `name`, `companyId` → `ownerId`, `buttonColor` → `primaryColor`
  - Remove counter displays (already completed in Phase 4)

- [x] **Task 5.3**: Simplify/remove `DesignSubTabs.tsx` (only one tab remains)
  - Already using V4 structure with Journeys, Experiences, Branding tabs

---

## Phase 6: Tests (3-4 hours)

**Status**: ✅ Complete

- [x] **Task 6.1**: Update `actions/events.test.ts`:
  - Update all mock Event objects with new schema
  - Update test cases for renamed actions
  - Add test suite for `updateEventSwitchboardAction()`
  - Delete welcome/ending/share test suites

- [x] **Task 6.2**: Update `repositories/events.test.ts` with new schema

- [x] **Task 6.3**: Update `ThemeEditor.test.tsx` for new structure with useReducer

- [x] **Task 6.4**: Run full test suite: `pnpm test src/features/events`

---

## Phase 7: Public API & Documentation (30 mins)

**Status**: ✅ Complete

- [x] **Task 7.1**: Update `index.ts` exports:
  - Remove: WelcomeEditor, EndingEditor, updateEventWelcome, updateEventEnding
  - Add: updateEventSwitchboardAction, new theme types
  - Rename: updateEventTitleAction → updateEventNameAction

- [x] **Task 7.2**: Update `components/designer/index.ts` exports

- [x] **Task 7.3**: Create `MIGRATION.md` documenting all breaking changes

---

## Final Verification

- [x] All tests pass (79 tests)
- [x] TypeScript compiles without errors
- [x] Can create new event with V4 schema
- [x] Can update all theme settings
- [x] Theme preview renders correctly
- [x] No console errors in dev server
- [x] All standards compliance issues resolved

---

## Progress Tracking

**Phase 0**: ✅ | **Phase 1**: ✅ | **Phase 2**: ✅ | **Phase 3**: ✅
**Phase 4**: ✅ | **Phase 5**: ✅ | **Phase 6**: ✅ | **Phase 7**: ✅

**Legend**: ⬜ Not Started | 🟡 In Progress | ✅ Complete

---

## Notes

- **Phase 0-5 completed**: Standards compliance, V4 schema migration, repository, actions, and UI components fully updated
- **Status**:
  - ✅ ThemeEditor refactored with useReducer, 7 sections, nested theme structure
  - ✅ EventForm already using correct field names (name, ownerId, primaryColor)
  - ✅ DesignSubTabs already using V4 structure (Journeys, Experiences, Branding)
  - ✅ All type errors fixed (companyId→ownerId, title→name, removed counters)
  - ✅ TypeScript compilation passing
- **Additional fixes made**:
  - Updated ImageUploadField and uploadImage to support "logos" and "backgrounds" destinations
  - Fixed admin events page to use ownerId filter
  - Updated all layout files to use event.name instead of event.title
  - Removed counter references from results page
  - Fixed public join page to use new schema fields
  - Updated repository tests with V4 schema
- **Phase 6 completed**: All tests updated for V4 schema
  - ✅ `actions/events.test.ts`: 37 tests covering all server actions
  - ✅ `repositories/events.test.ts`: 11 tests with V4 schema mock data
  - ✅ `ThemeEditor.test.tsx`: 31 tests for useReducer state management
  - ✅ All 79 tests passing
  - ✅ TypeScript compilation passing
  - ✅ ESLint passing
- **Phase 7 completed**: Public API & Documentation
  - ✅ Created `components/designer/index.ts` barrel export
  - ✅ Created comprehensive `MIGRATION.md` documentation
  - ✅ All exports verified in main `index.ts`

**🎉 REFACTORING COMPLETE**
All phases (0-7) completed successfully. The Events feature is now fully migrated to V4 schema.
