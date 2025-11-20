# Data Model: Survey Experience

**Date**: 2025-11-20  
**Feature**: Survey Experience Type  
**Purpose**: Define data structures for survey experiences and steps

---

## Entity Relationship Diagram

```
Event (existing)
  └── experiences/{experienceId} (subcollection)
        └── SurveyExperience (type: "survey")
              ├── config.stepsOrder: string[]        # Ordered step IDs
              ├── config.required: boolean           # Is survey mandatory?
              └── enabled: boolean                   # Is survey active?

  └── steps/{stepId} (NEW subcollection)
        └── SurveyStep (discriminated by type)
              ├── type: StepType                     # Discriminator field
              ├── config: StepConfig                 # Type-specific config
              ├── title: string
              ├── description?: string
              ├── required?: boolean | null
              ├── createdAt: number
              └── updatedAt: number
```

---

## Entities

### 1. SurveyExperience (Experience subtype)

**Location**: `/events/{eventId}/experiences/{experienceId}`

**Description**: An experience of type "survey" that contains configuration for survey behavior and references to survey steps.

**Schema**:
```typescript
interface SurveyExperience extends BaseExperience {
  type: 'survey';
  label: string;                    // Display name (e.g., "Guest Feedback Survey")
  enabled: boolean;                 // Whether survey is active
  config: {
    stepsOrder: string[];           // Ordered array of step IDs
    required: boolean;              // Whether survey is mandatory for guests
  };
  createdAt: number;                // Unix timestamp (ms)
  updatedAt: number;                // Unix timestamp (ms)
}
```

**Zod Schema**:
```typescript
import { z } from 'zod';
import { baseExperienceSchema } from './experiences';

export const surveyExperienceConfigSchema = z.object({
  stepsOrder: z.array(z.string()).max(10, 'Maximum 10 steps allowed'),
  required: z.boolean().default(false),
});

export const surveyExperienceSchema = baseExperienceSchema.extend({
  type: z.literal('survey'),
  config: surveyExperienceConfigSchema,
});

export type SurveyExperience = z.infer<typeof surveyExperienceSchema>;
```

**Validation Rules**:
- `stepsOrder` array must contain max 10 step IDs
- `label` must be 1-100 characters (inherited from BaseExperience)
- Step IDs in `stepsOrder` should reference existing documents in `/events/{eventId}/steps/`

**Indexes**:
None required (queries by document ID only)

---

### 2. SurveyStep (Base)

**Location**: `/events/{eventId}/steps/{stepId}`

**Description**: A question or informational step within a survey experience. Steps are type-discriminated with type-specific configuration.

**Base Schema**:
```typescript
interface StepBase {
  id: string;                       // Firestore document ID
  title: string;                    // Question or statement text
  description?: string;             // Optional explanation/subtitle
  required: boolean | null;         // null = inherit from experience, true/false = override
  helperText?: string;              // Optional hint/explainer
  ctaLabel?: string;                // Optional custom CTA (default: "Continue")
  mediaUrl?: string;                // Optional image/video URL
  createdAt: number;                // Unix timestamp (ms)
  updatedAt: number;                // Unix timestamp (ms)
}
```

**Zod Base Schema**:
```typescript
export const stepBaseSchema = z.object({
  id: z.string(),
  title: z.string().min(1, 'Title required').max(200, 'Max 200 characters'),
  description: z.string().max(500, 'Max 500 characters').optional(),
  required: z.boolean().nullable().default(null),
  helperText: z.string().max(200, 'Max 200 characters').optional(),
  ctaLabel: z.string().min(1).max(50, 'Max 50 characters').optional(),
  mediaUrl: z.string().url().optional(),
  createdAt: z.number(),
  updatedAt: z.number(),
});
```

**Validation Rules**:
- `title`: 1-200 characters (required)
- `description`: 0-500 characters (optional)
- `helperText`: 0-200 characters (optional)
- `ctaLabel`: 1-50 characters (optional)
- `mediaUrl`: Valid URL (optional)

---

### 3. Step Types (Discriminated Union)

#### 3.1 Multiple Choice Step

**Type Discriminator**: `type: "multiple_choice"`

**Description**: Allows guests to select one or multiple options from a list.

**Schema**:
```typescript
interface MultipleChoiceStep extends StepBase {
  type: 'multiple_choice';
  config: {
    options: string[];              // List of choice options (min 1)
    allowMultiple: boolean;         // Allow multiple selections?
  };
}
```

**Zod Schema**:
```typescript
export const multipleChoiceStepSchema = stepBaseSchema.extend({
  type: z.literal('multiple_choice'),
  config: z.object({
    options: z.array(
      z.string().min(1, 'Option cannot be empty').max(100, 'Max 100 characters')
    ).min(1, 'At least 1 option required').max(10, 'Max 10 options'),
    allowMultiple: z.boolean().default(false),
  }),
});

export type MultipleChoiceStep = z.infer<typeof multipleChoiceStepSchema>;
```

**Validation Rules**:
- `options`: Minimum 1, maximum 10 options
- Each option: 1-100 characters
- `allowMultiple`: Defaults to `false`

---

#### 3.2 Yes/No Step

**Type Discriminator**: `type: "yes_no"`

**Description**: Binary choice question with customizable labels.

**Schema**:
```typescript
interface YesNoStep extends StepBase {
  type: 'yes_no';
  config?: {
    yesLabel?: string;              // Custom label for "Yes" (default: "Yes")
    noLabel?: string;               // Custom label for "No" (default: "No")
  };
}
```

**Zod Schema**:
```typescript
export const yesNoStepSchema = stepBaseSchema.extend({
  type: z.literal('yes_no'),
  config: z.object({
    yesLabel: z.string().min(1).max(50, 'Max 50 characters').optional(),
    noLabel: z.string().min(1).max(50, 'Max 50 characters').optional(),
  }).optional(),
});

export type YesNoStep = z.infer<typeof yesNoStepSchema>;
```

**Validation Rules**:
- `yesLabel`: 1-50 characters (optional, defaults to "Yes")
- `noLabel`: 1-50 characters (optional, defaults to "No")

---

#### 3.3 Opinion Scale Step

**Type Discriminator**: `type: "opinion_scale"`

**Description**: Numeric scale for rating or opinion questions.

**Schema**:
```typescript
interface OpinionScaleStep extends StepBase {
  type: 'opinion_scale';
  config: {
    scaleMin: number;               // Minimum scale value (e.g., 0, 1)
    scaleMax: number;               // Maximum scale value (e.g., 5, 10)
    minLabel?: string;              // Label for minimum (e.g., "Not likely")
    maxLabel?: string;              // Label for maximum (e.g., "Very likely")
  };
}
```

**Zod Schema**:
```typescript
export const opinionScaleStepSchema = stepBaseSchema.extend({
  type: z.literal('opinion_scale'),
  config: z.object({
    scaleMin: z.number().int('Must be an integer'),
    scaleMax: z.number().int('Must be an integer'),
    minLabel: z.string().max(50, 'Max 50 characters').optional(),
    maxLabel: z.string().max(50, 'Max 50 characters').optional(),
  }).refine(
    (data) => data.scaleMin < data.scaleMax,
    {
      message: 'Min value must be less than max value',
      path: ['scaleMin'],
    }
  ),
});

export type OpinionScaleStep = z.infer<typeof opinionScaleStepSchema>;
```

**Validation Rules**:
- `minValue` and `maxValue`: Integers, `minValue < maxValue`
- `minLabel` and `maxLabel`: 0-50 characters (optional)
- Common scales: 0-5, 1-5, 0-10, 1-10

---

#### 3.4 Short Text Step

**Type Discriminator**: `type: "short_text"`

**Description**: Single-line text input for brief responses.

**Schema**:
```typescript
interface ShortTextStep extends StepBase {
  type: 'short_text';
  config?: {
    placeholder?: string;           // Placeholder text
    maxLength?: number;             // Maximum character count
  };
}
```

**Zod Schema**:
```typescript
export const shortTextStepSchema = stepBaseSchema.extend({
  type: z.literal('short_text'),
  config: z.object({
    placeholder: z.string().max(100, 'Max 100 characters').optional(),
    maxLength: z.number().int().positive().max(500, 'Max 500 characters').optional(),
  }).optional(),
});

export type ShortTextStep = z.infer<typeof shortTextStepSchema>;
```

**Validation Rules**:
- `placeholder`: 0-100 characters (optional)
- `maxLength`: Positive integer, max 500 (optional)

---

#### 3.5 Long Text Step

**Type Discriminator**: `type: "long_text"`

**Description**: Multi-line text input for detailed responses.

**Schema**:
```typescript
interface LongTextStep extends StepBase {
  type: 'long_text';
  config?: {
    placeholder?: string;           // Placeholder text
    maxLength?: number;             // Maximum character count
  };
}
```

**Zod Schema**:
```typescript
export const longTextStepSchema = stepBaseSchema.extend({
  type: z.literal('long_text'),
  config: z.object({
    placeholder: z.string().max(100, 'Max 100 characters').optional(),
    maxLength: z.number().int().positive().max(2000, 'Max 2000 characters').optional(),
  }).optional(),
});

export type LongTextStep = z.infer<typeof longTextStepSchema>;
```

**Validation Rules**:
- `placeholder`: 0-100 characters (optional)
- `maxLength`: Positive integer, max 2000 (optional)

---

#### 3.6 Email Step

**Type Discriminator**: `type: "email"`

**Description**: Email input with built-in validation.

**Schema**:
```typescript
interface EmailStep extends StepBase {
  type: 'email';
  config?: {
    placeholder?: string;           // Placeholder text
  };
}
```

**Zod Schema**:
```typescript
export const emailStepSchema = stepBaseSchema.extend({
  type: z.literal('email'),
  config: z.object({
    placeholder: z.string().max(100, 'Max 100 characters').optional(),
  }).optional(),
});

export type EmailStep = z.infer<typeof emailStepSchema>;
```

**Validation Rules**:
- `placeholder`: 0-100 characters (optional)
- Email validation: RFC-compliant email format (enforced at guest response time)

---

#### 3.7 Statement Step

**Type Discriminator**: `type: "statement"`

**Description**: Informational step with no input (display-only).

**Schema**:
```typescript
interface StatementStep extends StepBase {
  type: 'statement';
  config?: null;                    // No configuration needed
}
```

**Zod Schema**:
```typescript
export const statementStepSchema = stepBaseSchema.extend({
  type: z.literal('statement'),
  config: z.null().optional(),
});

export type StatementStep = z.infer<typeof statementStepSchema>;
```

**Validation Rules**:
- No type-specific validation (uses base schema only)

---

### 4. Complete Discriminated Union

**Combined Schema** (to replace existing flat schema):
```typescript
export const surveyStepSchema = z.discriminatedUnion('type', [
  multipleChoiceStepSchema,
  yesNoStepSchema,
  opinionScaleStepSchema,
  shortTextStepSchema,
  longTextStepSchema,
  emailStepSchema,
  statementStepSchema,
]);

export type SurveyStep = z.infer<typeof surveyStepSchema>;
export type StepType = SurveyStep['type'];
```

**Note on Existing Schema**: The current `surveyStepSchema` (lines 227-248 in schemas.ts) is flat with optional fields. The new discriminated union approach provides stronger type safety by ensuring only valid config fields exist per type.

**Type Guards**:
```typescript
export function isMultipleChoiceStep(step: SurveyStep): step is MultipleChoiceStep {
  return step.type === 'multiple_choice';
}

export function isYesNoStep(step: SurveyStep): step is YesNoStep {
  return step.type === 'yes_no';
}

export function isOpinionScaleStep(step: SurveyStep): step is OpinionScaleStep {
  return step.type === 'opinion_scale';
}

// ... similar for other types
```

---

## Firestore Collections Structure

```
/events/{eventId}
  └── experiences/{experienceId}        # Experience documents
        ├── type: "survey"
        ├── label: string
        ├── enabled: boolean
        └── config: {
              stepsOrder: string[],
              required: boolean
            }
  
  └── steps/{stepId}                    # NEW: Survey step documents
        ├── type: StepType (discriminator)
        ├── title: string
        ├── description?: string
        ├── required?: boolean | null
        ├── helperText?: string
        ├── ctaLabel?: string
        ├── mediaUrl?: string
        ├── config: StepConfig (type-specific)
        ├── createdAt: number
        └── updatedAt: number
```

**Key Design Decisions**:
1. **Flat Subcollection**: Steps stored in `/events/{eventId}/steps/` (not nested under experience)
2. **Order Array**: Step order maintained in `SurveyExperience.config.stepsOrder` (not in step documents)
3. **Discriminated Union**: Step type determined by `type` field (enables type-safe queries)
4. **Nullable Required**: `required: null` inherits from experience-level setting, `true`/`false` overrides

---

## Migration Considerations

**Existing Data**: No migration needed (this is a new feature)

**Future Compatibility**:
- Adding new step types: Extend discriminated union, add new literal to `StepType`
- Deprecating step types: Mark as deprecated in schema, prevent creation in UI
- Schema evolution: Use Zod's `.extend()` and `.omit()` for backward compatibility

---

## Validation Summary

| Field | Min | Max | Type | Required |
|-------|-----|-----|------|----------|
| `SurveyExperience.label` | 1 | 100 | string | Yes |
| `SurveyExperience.config.stepsOrder` | 0 | 10 | string[] | Yes |
| `SurveyStep.title` | 1 | 200 | string | Yes |
| `SurveyStep.description` | 0 | 500 | string | No |
| `SurveyStep.helperText` | 0 | 200 | string | No |
| `SurveyStep.ctaLabel` | 1 | 50 | string | No |
| Multiple Choice Option | 1 | 100 | string | Yes (per option) |
| Opinion Scale Labels | 0 | 50 | string | No |
| Text Placeholder | 0 | 100 | string | No |
| Short Text maxLength | 1 | 500 | number | No |
| Long Text maxLength | 1 | 2000 | number | No |

---

## File Locations

**Schemas**: `web/src/features/experiences/lib/schemas.ts` (modify existing survey schemas)  
**Types**: Exported from schemas (Zod inference)  
**Repositories**: `web/src/features/experiences/lib/repository.ts` (extend existing repository)  
**Actions**: `web/src/features/experiences/actions/` (new survey-steps.ts file)

---

## Migration from Existing Schemas

**Current State** (lines 99-103, 215-289 in `schemas.ts`):
- `surveyConfigSchema` uses `surveyStepIds` (need to rename to `stepsOrder`)
- `surveyStepSchema` is flat, not discriminated by type
- Step types use `snake_case` (e.g., `short_text`, `long_text`)
- No type-specific config validation

**Required Changes**:
1. Update `surveyConfigSchema.surveyStepIds` → `stepsOrder`
2. Convert `surveyStepSchema` to discriminated union pattern
3. Keep `snake_case` naming (already in codebase)
4. Add type-specific config schemas (MultipleChoiceConfig, OpinionScaleConfig, etc.)
5. Add `yes_no` type (missing from current schema)

