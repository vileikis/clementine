# Sessions Feature Module - Compliance Report

**Assessment Date:** 2024-11-27
**Assessed Against:** Clementine Technical Standards v1.0
**Overall Status:** ⚠️ NEEDS REFACTORING - Module structure issues

---

## Executive Summary

The sessions feature module has **structural compliance violations** that need addressing:
1. **Directory structure** - Uses deprecated `lib/` folder pattern
2. **File naming** - Does not follow `[domain].[purpose].[ext]` convention
3. **Public API** - Exports server actions from index.ts (forbidden)

The **data model is mostly preserved** - only minimal additions needed for journey support.

---

## Detailed Findings

### 1. Directory Structure ❌ CRITICAL

**Standard:** `standards/global/feature-modules.md`

**Current Structure:**
```
sessions/
├── components/          # Empty
├── index.ts
├── lib/                 # ❌ DEPRECATED - should not exist
│   ├── validation.ts
│   ├── repository.ts
│   ├── actions.ts
│   └── repository.test.ts
└── types/
    └── session.types.ts
```

**Expected Structure:**
```
sessions/
├── components/
│   └── index.ts
├── actions/
│   ├── sessions.actions.ts
│   ├── sessions.actions.test.ts
│   └── index.ts
├── repositories/
│   ├── sessions.repository.ts
│   ├── sessions.repository.test.ts
│   └── index.ts
├── schemas/
│   ├── sessions.schemas.ts
│   └── index.ts
├── types/
│   ├── sessions.types.ts
│   └── index.ts
└── index.ts
```

**Issues:**
- Uses `lib/` folder which is explicitly listed as an anti-pattern
- Missing `actions/`, `repositories/`, `schemas/` folders
- Missing barrel exports (`index.ts`) in folders
- Files not named with `[domain].[purpose].[ext]` pattern

---

### 2. File Naming ❌ HIGH

**Standard:** `standards/global/feature-modules.md` (Section 2)

| Current | Expected | Issue |
|---------|----------|-------|
| `lib/validation.ts` | `schemas/sessions.schemas.ts` | Wrong folder + name |
| `lib/repository.ts` | `repositories/sessions.repository.ts` | Wrong folder + name |
| `lib/actions.ts` | `actions/sessions.actions.ts` | Wrong folder + name |
| `lib/repository.test.ts` | `repositories/sessions.repository.test.ts` | Wrong folder + name |
| `types/session.types.ts` | `types/sessions.types.ts` | Singular instead of plural |

---

### 3. Public API (index.ts) ❌ HIGH

**Standard:** `standards/global/feature-modules.md` (Section 5)

**Current index.ts:**
```typescript
// ❌ VIOLATES STANDARD - Server actions exported
export {
  startSessionAction,
  saveCaptureAction,
  getSessionAction,
  triggerTransformAction,
} from './lib/actions';

export type { Session, SessionState } from './types/session.types';
```

**Expected index.ts:**
```typescript
// ✅ Only export types
export type { Session, SessionState, SessionData } from './types';

// ❌ Actions should NOT be exported (import directly: @/features/sessions/actions)
```

---

### 4. Missing Barrel Exports ❌ MEDIUM

**Standard:** `standards/global/feature-modules.md` (Section 3)

Missing `index.ts` barrel exports in:
- `types/` folder (no index.ts)

---

### 5. Data Model ✅ PRESERVE + EXTEND

**Current Session schema is preserved.** Only add minimal fields for journey support:

**Current (KEEP):**
```typescript
interface Session {
  id: string;
  eventId: string;
  state: SessionState;  // ✅ Keep as-is
  inputImagePath?: string;
  resultImagePath?: string;
  error?: string;
  createdAt: number;
  updatedAt: number;
}

type SessionState = "created" | "captured" | "transforming" | "ready" | "error";
```

**Add only:**
```typescript
interface Session {
  // ... existing fields preserved ...

  // NEW: Journey support
  journeyId?: string;           // Optional - for journey-based sessions
  currentStepIndex?: number;    // Current position in journey
  data?: SessionData;           // Dynamic data from steps
}

interface SessionData {
  selected_experience_id?: string;
  [key: string]: any;
}
```

---

### 6. Firestore Collection Path ✅ KEEP

**Current path is fine for now:**
```
/events/{eventId}/sessions/{sessionId}  ✅ Keep subcollection
```

This maintains backward compatibility with existing code.

---

### 7. Server Action Patterns ⚠️ MEDIUM

**Standard:** `standards/backend/firebase.md`

Some actions throw errors instead of returning typed results. This is acceptable for now but should be improved incrementally.

---

## Compliance Checklist

| Requirement | Status | Notes |
|-------------|--------|-------|
| Feature module structure | ❌ | Uses deprecated `lib/` pattern |
| File naming convention | ❌ | Missing `[domain].[purpose].[ext]` |
| Barrel exports | ❌ | Missing in types/ |
| Public API (index.ts) | ❌ | Exports server actions (forbidden) |
| Data model | ✅ | Preserve existing + add journey fields |
| Firestore collection path | ✅ | Keep as subcollection |
| Server action pattern | ⚠️ | Acceptable, improve later |
| Test file location | ⚠️ | Move with other files |

**Legend:** ❌ Must fix | ⚠️ Improve later | ✅ Compliant/Keep

---

## Recommendation

**Incremental refactor focusing on structure, not data model:**

1. Reorganize files into proper folder structure
2. Rename files to follow naming convention
3. Add barrel exports
4. Fix public API (remove action exports)
5. Add minimal new fields (journeyId, currentStepIndex, data)
6. Keep existing Firestore path and state values

**Next Steps:** See `REFACTOR_PLAN.md` for implementation tasks.
