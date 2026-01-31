# Quick Start: Strongly Typed Step Validation and Simplified Answer Schema

**Feature**: 051-step-validation-types
**Branch**: `051-step-validation-types`
**Estimated Time**: 2-3 hours

## What This Feature Does

This refactor improves type safety and consistency in the step validation system:

1. **Strongly typed validators**: Replace `Record<string, unknown>` with specific config types for full TypeScript autocomplete
2. **Simplified answer values**: Use only `string | string[]` instead of `string | number | boolean | string[]`
3. **Consistent renderers**: Update renderers to save answers in uniform string format

**Benefits**:
- ✅ Full IDE autocomplete for config properties
- ✅ Compile-time error detection for invalid property access
- ✅ Consistent data model across all step types
- ✅ Simpler analytics (no type-specific handling)

---

## Implementation Order

### Phase 1: Schema Update (Shared Package)

**File**: `packages/shared/src/schemas/session/session.schema.ts`

**Step 1**: Create `answerValueSchema` and `AnswerValue` type (add before `answerSchema`, around line 40)

```typescript
/**
 * Answer value schema
 * Defines valid answer value types (simplified from 4 types to 2)
 */
export const answerValueSchema = z.union([
  z.string(),          // Text, yes/no ("yes"/"no"), scale ("1"-"5")
  z.array(z.string()), // Multi-select
])

/**
 * Answer value type inferred from schema
 */
export type AnswerValue = z.infer<typeof answerValueSchema>
```

**Step 2**: Update `answerSchema` to use `answerValueSchema`

```typescript
// Find this section (around line 51-68)
export const answerSchema = z.object({
  stepId: z.string(),
  stepType: z.string(),
  value: z.union([
    z.string(),
    z.number(),      // ❌ REMOVE inline union
    z.boolean(),     // ❌ REMOVE
    z.array(z.string()),
  ]),
  context: z.unknown().nullable().default(null),
  answeredAt: z.number(),
})

// Replace with
export const answerSchema = z.object({
  stepId: z.string(),
  stepType: z.string(),
  value: answerValueSchema,  // ✅ Use extracted schema
  context: z.unknown().nullable().default(null),
  answeredAt: z.number(),
})
```

**Step 3**: Add `AnswerValue` to exports (at bottom of file, around line 219)

```typescript
// Find the export section
export type Answer = z.infer<typeof answerSchema>
export type CapturedMedia = z.infer<typeof capturedMediaSchema>
export type SessionResultMedia = z.infer<typeof sessionResultMediaSchema>

// Add AnswerValue export
export type { AnswerValue }  // ✅ Export for app usage
```

**Verify**: Run `pnpm --filter @clementine/shared build` to ensure schema compiles

**Time**: 10 minutes

---

### Phase 2: Validator Types (App)

**File**: `apps/clementine-app/src/domains/experience/steps/registry/step-validation.ts`

**Step 1**: Import specific config types (top of file)

```typescript
import type {
  ExperienceInputScaleStepConfig,
  ExperienceInputYesNoStepConfig,
  ExperienceInputMultiSelectStepConfig,
  ExperienceInputShortTextStepConfig,
  ExperienceInputLongTextStepConfig,
} from '@clementine/shared'
```

**Step 2**: Update validator function signatures

```typescript
// validateScaleInput (around line 85)
function validateScaleInput(
  config: ExperienceInputScaleStepConfig,  // ✅ Changed from StepConfig
  input: unknown,
  isRequired: boolean,
): StepValidationResult {
  // Function body stays the same
}

// validateYesNoInput (around line 120)
function validateYesNoInput(
  config: ExperienceInputYesNoStepConfig,  // ✅ Changed
  input: unknown,
  isRequired: boolean,
): StepValidationResult {
  // Function body stays the same
}

// validateMultiSelectInput (around line 142)
function validateMultiSelectInput(
  config: ExperienceInputMultiSelectStepConfig,  // ✅ Changed
  input: unknown,
  isRequired: boolean,
): StepValidationResult {
  // Function body stays the same
}

// validateTextInput (around line 194)
function validateTextInput(
  config: ExperienceInputShortTextStepConfig | ExperienceInputLongTextStepConfig,  // ✅ Changed
  input: unknown,
  isRequired: boolean,
): StepValidationResult {
  // Function body stays the same
}
```

**Step 3**: Update `validateStepInput` to use type assertions

```typescript
export function validateStepInput(
  step: ExperienceStep,
  input: unknown,
): StepValidationResult {
  const config = step.config as StepConfig
  const isRequired = config.required === true

  switch (step.type) {
    case 'info':
      return { isValid: true }

    case 'input.scale':
      return validateScaleInput(
        config as ExperienceInputScaleStepConfig,  // ✅ Type assertion
        input,
        isRequired
      )

    case 'input.yesNo':
      return validateYesNoInput(
        config as ExperienceInputYesNoStepConfig,  // ✅ Type assertion
        input,
        isRequired
      )

    case 'input.multiSelect':
      return validateMultiSelectInput(
        config as ExperienceInputMultiSelectStepConfig,  // ✅ Type assertion
        input,
        isRequired
      )

    case 'input.shortText':
    case 'input.longText':
      return validateTextInput(
        config as ExperienceInputShortTextStepConfig | ExperienceInputLongTextStepConfig,  // ✅ Type assertion
        input,
        isRequired
      )

    // ... rest stays the same
  }
}
```

**Step 4**: Remove `type StepConfig` definition (no longer needed)

```typescript
// ❌ DELETE this line (around line 22)
type StepConfig = Record<string, unknown>
```

**Verify**:
- Run `pnpm app:type-check` - should pass with full type safety
- Open validator file in IDE and type `config.` inside `validateScaleInput` - should see autocomplete for `min`, `max`, `minLabel`, `maxLabel`, `required`

**Time**: 15 minutes

---

### Phase 3: Update Renderers (App)

#### 3A. InputYesNoRenderer

**File**: `apps/clementine-app/src/domains/experience/steps/renderers/InputYesNoRenderer.tsx`

**Change**: Convert boolean to "yes"/"no" string at save boundary

```typescript
// Find the selectedValue logic (around line 32)
const selectedValue = typeof answer === 'boolean' ? answer : undefined

// Replace with (parse "yes"/"no" string back to boolean for UI)
const selectedValue =
  answer === 'yes' ? true :
  answer === 'no' ? false :
  undefined

// Find handleSelect (around line 35)
const handleSelect = useCallback(
  (value: boolean) => {
    if (mode === 'run' && onAnswer) {
      onAnswer(value)  // ❌ OLD: saves boolean
    }
  },
  [mode, onAnswer],
)

// Replace with (convert boolean to string)
const handleSelect = useCallback(
  (value: boolean) => {
    if (mode === 'run' && onAnswer) {
      onAnswer(value ? 'yes' : 'no')  // ✅ NEW: saves string
    }
  },
  [mode, onAnswer],
)
```

**Verify**:
- TypeScript compiles without errors
- UI still works (boolean state for buttons, string for save)

**Time**: 5 minutes

---

#### 3B. InputScaleRenderer

**File**: `apps/clementine-app/src/domains/experience/steps/renderers/InputScaleRenderer.tsx`

**Change**: Convert number to string at save boundary

```typescript
// Find the selectedValue logic (around line 35)
const selectedValue = typeof answer === 'number' ? answer : undefined

// Replace with (parse string back to number for UI)
const selectedValue = typeof answer === 'string' ? Number(answer) : undefined

// Find handleSelect (around line 38)
const handleSelect = useCallback(
  (value: number) => {
    if (mode === 'run' && onAnswer) {
      onAnswer(value)  // ❌ OLD: saves number
    }
  },
  [mode, onAnswer],
)

// Replace with (convert number to string)
const handleSelect = useCallback(
  (value: number) => {
    if (mode === 'run' && onAnswer) {
      onAnswer(String(value))  // ✅ NEW: saves string
    }
  },
  [mode, onAnswer],
)
```

**Verify**:
- TypeScript compiles without errors
- UI still works (number state for buttons, string for save)

**Time**: 5 minutes

---

### Phase 4: Update Step Registry (App)

**File**: `apps/clementine-app/src/domains/experience/steps/registry/step-registry.ts`

**Step 1**: Import `AnswerValue` from shared package (add to imports at top of file)

```typescript
import type {
  ExperienceStep,
  ExperienceStepCategory,
  ExperienceStepConfig,
  ExperienceStepType,
  AnswerValue,  // ✅ ADD: Import from shared
} from '@clementine/shared'
```

**Step 2**: Remove local `AnswerValue` type definition

```typescript
// ❌ DELETE this line (around line 60)
export type AnswerValue = string | number | boolean | string[]
```

**Step 3**: Re-export `AnswerValue` for convenience (optional, but recommended)

```typescript
// Add after removing local definition
export type { AnswerValue }  // ✅ Re-export from shared
```

**Verify**:
- TypeScript compiles without errors
- No duplicate type definition errors
- `AnswerValue` is imported from `@clementine/shared`

**Time**: 3 minutes

---

### Phase 5: Verification

**Run validation loop**:

```bash
# From monorepo root
pnpm app:type-check  # Should pass with no errors
pnpm app:lint        # Should pass
pnpm app:test        # Existing tests should still pass
```

**Manual testing** (if needed):

1. Start dev server: `pnpm app:dev`
2. Navigate to experience runtime
3. Test yes/no step - verify answer saves as "yes"/"no"
4. Test scale step - verify answer saves as "3" (string)
5. Check Firestore - verify answer values are strings

**Time**: 10 minutes

---

## Total Time Estimate

- Phase 1 (Schema + AnswerValue): 10 min
- Phase 2 (Validators): 15 min
- Phase 3A (YesNo Renderer): 5 min
- Phase 3B (Scale Renderer): 5 min
- Phase 4 (Registry): 3 min
- Phase 5 (Verification): 10 min

**Total**: ~48 minutes active work

---

## Testing Checklist

After implementation, verify:

- [ ] `pnpm app:type-check` passes
- [ ] `pnpm app:lint` passes
- [ ] `pnpm app:test` passes (existing tests)
- [ ] TypeScript autocomplete works in validators (`config.min`, `config.max`, etc.)
- [ ] Invalid property access shows TypeScript error (`config.invalidProp`)
- [ ] Yes/No renderer saves "yes"/"no" strings
- [ ] Scale renderer saves number as string ("3")
- [ ] Text renderers unchanged (already use strings)
- [ ] Multi-select renderer unchanged (already uses string[])

---

## Common Issues & Solutions

### Issue: TypeScript error "Type 'boolean' is not assignable to type 'string | string[]'"

**Cause**: Renderer still calling `onAnswer(true)` instead of `onAnswer('yes')`

**Solution**: Update renderer to convert boolean to string at save boundary

---

### Issue: TypeScript can't find property on config

**Cause**: Config type still using `Record<string, unknown>` instead of specific type

**Solution**: Verify validator function signature uses specific config type (e.g., `ExperienceInputScaleStepConfig`)

---

### Issue: Existing tests failing

**Cause**: Tests may be asserting on old answer value types (number, boolean)

**Solution**: Update test assertions to expect string format

---

## Next Steps

After completing implementation:

1. Run full validation loop (`pnpm app:check`)
2. Manual testing in dev environment
3. Create PR with changes
4. Reference this spec in PR description
5. Verify all checklist items before requesting review

---

## Files Changed Summary

**packages/shared/**
- `src/schemas/session/session.schema.ts` - Simplify answer value union

**apps/clementine-app/**
- `src/domains/experience/steps/registry/step-validation.ts` - Add specific config types
- `src/domains/experience/steps/registry/step-registry.ts` - Update AnswerValue type
- `src/domains/experience/steps/renderers/InputYesNoRenderer.tsx` - Save "yes"/"no" strings
- `src/domains/experience/steps/renderers/InputScaleRenderer.tsx` - Save number as string

**Total**: 5 files modified, 0 files added, 0 files deleted
