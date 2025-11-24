# Events Feature Module - Refactoring Plan

**Date**: 2024-11-24
**Status**: Ready for Implementation
**Estimated Time**: 12-15 hours

---

## Executive Summary

Refactor the events feature module to implement the new V4 schema. This is a **clean break** migration with no backward compatibility.

**Key Changes**:
- ❌ Remove content fields (`welcome`, `ending`, `share`) and all related code
- ✅ Add `activeJourneyId` for Switchboard pattern
- ✅ Restructure `theme` with nested `text`, `button`, `background` objects
- ✅ Rename fields: `title` → `name`, `companyId` → `ownerId`
- ✅ Update status enum: `"live"` → `"published"`
- ✅ Remove denormalized counters
- ✅ Keep `joinPath` (no `slug` implementation)

---

## Standards & Conventions to Follow

All implementation must comply with these standards:

### 1. Feature Module Structure (`standards/global/feature-modules.md`)

**Rules**:
- ✅ Organize by technical concern: `schemas/`, `types/`, `actions/`, `repositories/`, `components/`, `constants.ts`
- ✅ Use explicit file naming: `events.schemas.ts`, `events.actions.ts`, `events.repository.ts`
- ✅ Barrel exports in every folder: `index.ts` re-exports all contents
- ✅ Public API (`index.ts`) exports ONLY: components, hooks, types
- ❌ Do NOT export: actions (use direct imports), schemas (internal), repositories (server-only)

### 2. Validation (`standards/global/validation.md`)

**Rules**:
- ✅ **Zod v4 validators**: Use `z.url()`, `z.email()` NOT `z.string().url()` or `z.string().email()`
- ✅ **Firestore-safe optional fields**: `.nullable().optional().default(null)` (all three!)
- ✅ **Extract nested schemas**: Named schemas, not inline objects
- ✅ **Constants for constraints**: No magic numbers in validation
- ✅ **camelCase schema names**: `eventSchema` not `EventSchema`
- ✅ **Server-side validation**: Always validate in actions with Zod
- ✅ **Type inference**: `type Event = z.infer<typeof eventSchema>`

### 3. Firebase (`standards/backend/firebase.md`)

**Rules**:
- ✅ **Admin SDK for all writes**: Use `db` from `@/lib/firebase/admin`
- ✅ **Trust Firebase**: Don't check existence before `.update()`, catch `NOT_FOUND` (code 5)
- ✅ **Dynamic field mapping**: Use `Object.entries()` not manual if-statements
- ✅ **Dot notation for nested updates**: `"theme.button.backgroundColor"` not object replacement
- ✅ **Descriptive validation errors**: Include field paths from `error.issues`
- ✅ **Structured error responses**: `{ code, message, issues? }` format
- ✅ **Repository pattern**: Data operations in `repositories/`

### 4. Error Handling (`standards/global/error-handling.md`)

**Rules**:
- ✅ **Type-safe errors**: `error instanceof z.ZodError`
- ✅ **Structured responses**: `{ success: false, error: { code, message, issues? } }`
- ✅ **Field paths in errors**: `error.issues.map(i => \`\${i.path.join('.')}: \${i.message}\`)`
- ✅ **Error codes**: `PERMISSION_DENIED`, `VALIDATION_ERROR`, `INTERNAL_ERROR`, `EVENT_NOT_FOUND`

### 5. React Components

**Rules**:
- ✅ **useReducer for complex state**: Use for ThemeEditor config management (not multiple useState)
- ✅ **Keyboard shortcuts**: Implement Cmd+S/Ctrl+S for save actions
- ✅ **Loading states**: Use `useTransition()` for async operations
- ✅ **Toast notifications**: Success/error feedback with `sonner`
- ✅ **Type-safe props**: Interface for component props

---

## Schema Changes Reference

### Field Changes

| Current | New | Change Type |
|---------|-----|-------------|
| `title` | `name` | Renamed |
| `companyId` | `ownerId` | Renamed |
| `status: "live"` | `status: "published"` | Enum value changed |
| `welcome` | ❌ Removed | Breaking |
| `ending` | ❌ Removed | Breaking |
| `share` | ❌ Removed | Breaking |
| `experiencesCount`, `sessionsCount`, `readyCount`, `sharesCount` | ❌ Removed | Breaking |
| N/A | `activeJourneyId` | Added (nullable) |

### Theme Structure Change

**Before (flat)**:
```typescript
theme?: {
  buttonColor?: string;
  buttonTextColor?: string;
  backgroundColor?: string;
  backgroundImage?: string;
}
```

**After (nested)**:
```typescript
theme: {
  logoUrl?: string | null;
  fontFamily?: string;
  primaryColor: string; // NEW: anchor color
  text: {
    color: string;
    alignment: "left" | "center" | "right";
  };
  button: {
    backgroundColor?: string; // inherits primaryColor if undefined
    textColor: string;
    radius: "none" | "sm" | "md" | "full";
  };
  background: {
    color: string;
    image?: string | null;
    overlayOpacity: number; // 0-1
  };
}
```

---

## Phase 0: Standards Compliance Fixes ⚡

**Duration**: 1-2 hours | **Breaking**: NO

### Goals
Fix existing standards violations before schema migration.

### Tasks

#### 0.1: Restructure Schemas Folder
- Move `lib/schemas.ts` → `schemas/events.schemas.ts`
- Create `schemas/index.ts` barrel export
- Update all imports across module

#### 0.2: Create Constants File
- Create `constants.ts`
- Extract all magic numbers (lengths, defaults)
- Define `COLOR_REGEX` constant
- Add `THEME_DEFAULTS` object

#### 0.3: Fix Firestore-Safe Patterns
**Target**: All optional fields in schemas
**Pattern**: `.nullable().optional().default(null)`
- Apply to theme fields
- Apply to optional top-level fields

#### 0.4: Extract Nested Schemas
**Target**: `schemas/events.schemas.ts`
- Extract `eventThemeSchema`
- Extract `eventWelcomeSchema`
- Extract `eventEndingSchema`
- Extract `eventShareConfigSchema`
- Use in main schema

#### 0.5: Improve Error Messages
**Target**: All action error handlers
**Pattern**:
```typescript
if (error instanceof z.ZodError) {
  return {
    success: false,
    error: {
      code: "VALIDATION_ERROR",
      message: error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', '),
      issues: error.issues,
    },
  };
}
```
- Apply to all 7 update action error handlers

#### 0.6: Remove Unnecessary Existence Checks
**Target**: All update actions in `actions/events.ts`
**Pattern**:
```typescript
// Remove: await eventRef.get(); if (!exists) ...
// Replace with: try { await eventRef.update(...) } catch (error) { if (error.code === 5) ... }
```
- Apply to 4 update actions

#### 0.7: Dynamic Field Mapping
**Target**: All update actions with nested objects
**Pattern**:
```typescript
const fieldMappings: Record<string, string> = {
  buttonColor: "theme.buttonColor",
  // ...
};
Object.entries(validatedData).forEach(([key, value]) => {
  if (value !== undefined && fieldMappings[key]) {
    updateData[fieldMappings[key]] = value;
  }
});
```
- Apply to theme/welcome/ending/share update actions

#### 0.8: Standardize Error Responses
**Target**: All actions
**Format**: `{ success: false, error: { code: string, message: string, issues?: z.ZodIssue[] } }`
- Update all actions to use structured error objects (not plain strings)

### Critical Rules for Phase 0
- ❌ NO breaking changes to schema or API
- ✅ All changes are pure refactoring
- ✅ Tests must still pass after this phase

---

## Phase 1: Schema Update to V4 🏗️

**Duration**: 2-3 hours | **Breaking**: YES

### Goals
Implement new schema structure from `events-schema-update.md`.

### Tasks

#### 1.1: Update Event Schema
**Target**: `schemas/events.schemas.ts`

**Changes**:
1. **Status enum**: `["draft", "live", "archived"]` → `["draft", "published", "archived"]`
2. **Field renames**: `title` → `name`, `companyId` → `ownerId`
3. **New fields**: `activeJourneyId: z.string().nullable().default(null)`
4. **Remove fields**: `welcome`, `ending`, `share`, all counters
5. **Theme restructure**:
   - Create sub-schemas: `eventThemeTextSchema`, `eventThemeButtonSchema`, `eventThemeBackgroundSchema`
   - New theme structure with `primaryColor`, `text`, `button`, `background`
   - Add logo, font family fields
6. **Use Zod v4 validators**: `z.url()` not `z.string().url()`

#### 1.2: Update Type Definitions
**Target**: `types/event.types.ts`
- Match new schema with `z.infer`
- Remove old interfaces: `EventWelcome`, `EventEnding`, `EventShareConfig`, `ShareSocial`
- Add new interfaces: `EventThemeText`, `EventThemeButton`, `EventThemeBackground`

#### 1.3: Update Constants
**Target**: `constants.ts`
- Rename `TITLE_LENGTH` → `NAME_LENGTH`
- Remove welcome/ending constraints
- Add `THEME_DEFAULTS` with all default values

### Critical Rules for Phase 1
- ✅ Use Zod v4 validators (`z.url()`, not `z.string().url()`)
- ✅ All optional fields use `.nullable().optional().default(null)`
- ✅ Extract nested schemas (don't inline)
- ✅ Use constants for all validation constraints

---

## Phase 2: Delete Content Code 🗑️

**Duration**: 30 mins | **Breaking**: YES

### Goals
Remove all welcome/ending/share code and components.

### Tasks

#### 2.1: Delete Component Files (4 files)
- `components/designer/WelcomeEditor.tsx`
- `components/designer/WelcomeEditor.test.tsx`
- `components/designer/EndingEditor.tsx`
- `components/designer/EndingEditor.test.tsx`

#### 2.2: Update or Remove DesignSubTabs
**Target**: `components/shared/DesignSubTabs.tsx`
- Remove welcome/ending tabs
- Consider deleting entirely if only one tab remains

#### 2.3: Delete Actions (3 functions)
**Target**: `actions/events.ts`
- `updateEventWelcome()`
- `updateEventEnding()`
- `updateEventShare()`

#### 2.4: Delete Test Suites (3 describe blocks)
**Target**: `actions/events.test.ts`
- Remove test suites for deleted actions

#### 2.5: Update Public API
**Target**: `index.ts`
- Remove exports for deleted components and actions

---

## Phase 3: Repository Layer 🔧

**Duration**: 1 hour | **Breaking**: YES

### Goals
Update data layer for new schema.

### Tasks

#### 3.1: Update createEvent()
**Target**: `repositories/events.ts`
- Parameters: `name`, `ownerId`, `primaryColor` (renamed from `title`, `companyId`, `buttonColor`)
- Initialize full theme structure using `THEME_DEFAULTS`
- Add `activeJourneyId: null`
- Remove: counters, share config initialization

#### 3.2: Update listEvents()
**Target**: `repositories/events.ts`
- Filter parameter: `companyId` → `ownerId`
- Update Firestore query field name

#### 3.3: Rename updateEventTitle()
**Target**: `repositories/events.ts`
- Rename function: `updateEventTitle` → `updateEventName`
- Update field: `title` → `name`

#### 3.4: Update updateEventStatus()
**Target**: `repositories/events.ts`
- Type signature: `"live"` → `"published"`

#### 3.5: Update Repository Tests
**Target**: `repositories/events.test.ts`
- Update all mock Event objects with new schema

---

## Phase 4: Actions Layer ⚙️

**Duration**: 2-3 hours | **Breaking**: YES

### Goals
Update server actions for new schema.

### Tasks

#### 4.1: Update createEventAction()
**Target**: `actions/events.ts`
- Input schema: `name`, `ownerId`, `primaryColor`
- Validate owner (company) exists and is active
- Call updated `createEvent()` with new parameters
- Use structured error responses

#### 4.2: Update listEventsAction()
**Target**: `actions/events.ts`
- Filter parameter: `companyId` → `ownerId`

#### 4.3: Rename updateEventTitleAction()
**Target**: `actions/events.ts`
- Rename: `updateEventTitleAction` → `updateEventNameAction`
- Update validation schema
- Call renamed repository function

#### 4.4: Update updateEventStatusAction()
**Target**: `actions/events.ts`
- Type signature: `"live"` → `"published"`

#### 4.5: Refactor updateEventTheme()
**Target**: `actions/events.ts`
- Support new nested structure (text, button, background)
- **Use dynamic field mapping** (Object.entries, not manual if-statements)
- Use Firestore dot notation for nested updates: `"theme.button.backgroundColor"`
- Remove existence check, catch code 5 error instead

#### 4.6: Create updateEventSwitchboardAction()
**Target**: `actions/events.ts` (new function)
- Parameter: `activeJourneyId: string | null`
- Validate input with Zod
- Update event document
- Revalidate paths

### Critical Rules for Phase 4
- ✅ All validation uses Zod with proper error handling
- ✅ Dynamic field mapping (no manual if-statements for each field)
- ✅ Remove existence checks (trust Firebase)
- ✅ Structured error responses with field paths

---

## Phase 5: UI Components 🎨

**Duration**: 3-4 hours | **Breaking**: YES

### Goals
Update components for new schema and theme structure.

### Tasks

#### 5.1: Refactor ThemeEditor
**Target**: `components/designer/ThemeEditor.tsx`

**Requirements**:
- **Use `useReducer`** for managing theme config state (not multiple `useState`)
- Implement 7 sections:
  1. Identity (logo, font)
  2. Primary Color
  3. Text (color, alignment)
  4. Button (backgroundColor, textColor, radius)
  5. Background (color, image, overlayOpacity)
- Update preview to show all new settings
- Keyboard shortcuts (Cmd+S/Ctrl+S)
- Loading states with `useTransition()`
- Toast notifications

**State Management Pattern**:
```typescript
type ThemeState = Event['theme'];
type ThemeAction =
  | { type: 'UPDATE_PRIMARY_COLOR', payload: string }
  | { type: 'UPDATE_TEXT', payload: Partial<EventThemeText> }
  | { type: 'UPDATE_BUTTON', payload: Partial<EventThemeButton> }
  | { type: 'UPDATE_BACKGROUND', payload: Partial<EventThemeBackground> }
  // ...

const themeReducer = (state: ThemeState, action: ThemeAction): ThemeState => {
  // Implementation
};

const [theme, dispatch] = useReducer(themeReducer, event.theme);
```

#### 5.2: Update EventForm
**Target**: `components/studio/EventForm.tsx`
- Rename form fields: `title` → `name`, `companyId` → `ownerId`, `buttonColor` → `primaryColor`
- Remove counter displays

#### 5.3: Simplify DesignSubTabs
**Target**: `components/shared/DesignSubTabs.tsx`
- Simplify or remove (only one tab remains)

### Critical Rules for Phase 5
- ✅ Use `useReducer` for complex state (ThemeEditor)
- ✅ Type-safe actions and reducer
- ✅ Keyboard shortcuts for save
- ✅ Loading states and error handling

---

## Phase 6: Tests ✅

**Duration**: 3-4 hours | **Breaking**: NO

### Goals
Update all tests to work with new schema.

### Tasks

#### 6.1: Update Action Tests
**Target**: `actions/events.test.ts`
- Update all mock Event objects with new schema
- Update test cases for renamed actions
- Add test suite for `updateEventSwitchboardAction()`
- Verify dynamic field mapping in theme update tests

#### 6.2: Update Repository Tests
**Target**: `repositories/events.test.ts`
- Update mock Event objects
- Test renamed functions

#### 6.3: Update ThemeEditor Tests
**Target**: `components/designer/ThemeEditor.test.tsx`
- Test with new theme structure
- Test reducer actions
- Test all 7 sections

#### 6.4: Run Full Test Suite
```bash
cd web
pnpm test src/features/events
```

---

## Phase 7: Public API & Documentation 📚

**Duration**: 30 mins | **Breaking**: NO

### Goals
Update exports and document changes.

### Tasks

#### 7.1: Update Public API Exports
**Target**: `index.ts`
- Remove: WelcomeEditor, EndingEditor, welcome/ending actions
- Add: updateEventSwitchboardAction, new theme types
- Rename: updateEventTitleAction → updateEventNameAction
- Export: `EVENT_CONSTRAINTS`, `THEME_DEFAULTS`

#### 7.2: Update Component Barrel Exports
**Target**: `components/designer/index.ts`, `components/shared/index.ts`
- Remove deleted component exports

#### 7.3: Create Migration Documentation
**Target**: `MIGRATION.md` (new file)
- Document all breaking changes
- Schema comparison table
- API changes reference
- No backward compatibility notes

---

## Implementation Notes

### Data Migration
- ❌ No backward compatibility
- ❌ No automatic content migration (welcome/ending/share ignored)
- ✅ Existing Firestore documents need manual migration
- ✅ Document data migration requirements in MIGRATION.md

### Testing Strategy
- Run tests after each phase
- Manual QA after Phase 5 (ThemeEditor)
- Full integration test after Phase 7

### Risk Mitigation
- **High Risk**: Theme structure change → Comprehensive ThemeEditor refactor
- **Medium Risk**: Field renames → Search codebase for hardcoded field names
- **Low Risk**: Status enum → Update all status filters

---

## Success Criteria

- [ ] All tests pass
- [ ] TypeScript compiles without errors
- [ ] Can create new event with V4 schema
- [ ] Can update all theme settings (7 sections working)
- [ ] Theme preview renders correctly
- [ ] No console errors in dev server
- [ ] All standards compliance issues resolved
- [ ] Code follows all standards (Zod v4, dynamic mapping, useReducer, etc.)

---

## References

- **Schema Specification**: `features/events-schema-update.md`
- **Implementation Checklist**: `features/events-refactor-checklist.md`
- **Standards**:
  - `standards/global/feature-modules.md`
  - `standards/global/validation.md`
  - `standards/backend/firebase.md`
  - `standards/global/error-handling.md`
