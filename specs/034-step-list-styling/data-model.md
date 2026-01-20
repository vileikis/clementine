# Data Model: Step List Styling Updates

**Feature**: 034-step-list-styling
**Date**: 2026-01-20

## Overview

This feature is UI-only and does not introduce new data entities or modify existing data schemas. The styling changes leverage existing data structures.

## Existing Entities (Reference)

### Step

**Source**: `apps/clementine-app/src/domains/experience/steps/schemas/step.schema.ts`

```typescript
interface Step {
  id: string
  type: StepType
  config: StepConfig
}
```

### StepCategory

**Source**: `apps/clementine-app/src/domains/experience/steps/schemas/step.schema.ts`

```typescript
type StepCategory = 'info' | 'input' | 'capture' | 'transform'
```

### StepDefinition

**Source**: `apps/clementine-app/src/domains/experience/steps/registry/step-registry.ts`

```typescript
interface StepDefinition {
  type: StepType
  category: StepCategory  // ← Used for color mapping
  label: string
  description: string
  icon: LucideIcon
  configSchema: z.ZodSchema
  defaultConfig: () => StepConfig
}
```

## New Types (Added)

### CategoryColorClasses

**Location**: `apps/clementine-app/src/domains/experience/steps/registry/step-utils.ts`

```typescript
/**
 * Color classes for step category styling
 */
interface CategoryColorClasses {
  /** Background class for the icon wrapper */
  wrapper: string
  /** Foreground/text class for the icon */
  icon: string
}
```

## Data Flow

```
Step → StepDefinition.category → getCategoryColorClasses() → Tailwind classes
```

1. Component receives `Step` with `type` property
2. Lookup `StepDefinition` via `getStepDefinition(step.type)`
3. Get `category` from definition
4. Call `getCategoryColorClasses(category)` to get Tailwind classes
5. Apply classes to icon wrapper and icon elements

## No API Contracts

This feature is purely client-side UI changes. No API contracts are needed.
