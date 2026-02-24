/**
 * Step Utilities
 *
 * Helper functions for working with the step registry.
 *
 * @see specs/081-experience-type-flattening — maps ExperienceType to allowed categories
 */
import { generateStepName } from './step-name.helpers'
import { stepRegistry } from './step-registry'
import type {
  Step,
  StepCategory,
  StepDefinition,
  StepType,
} from './step-registry'
import type { ExperienceType } from '@clementine/shared'

/**
 * Type-to-allowed-categories mapping
 * survey → info/input/capture; all others → info/input/capture/transform
 */
const TYPE_ALLOWED_CATEGORIES: Record<ExperienceType, StepCategory[]> = {
  survey: ['info', 'input', 'capture'],
  photo: ['info', 'input', 'capture', 'transform'],
  gif: ['info', 'input', 'capture', 'transform'],
  video: ['info', 'input', 'capture', 'transform'],
  'ai.image': ['info', 'input', 'capture', 'transform'],
  'ai.video': ['info', 'input', 'capture', 'transform'],
}

/**
 * Get a step definition by type
 */
export function getStepDefinition(type: StepType): StepDefinition | undefined {
  return stepRegistry[type]
}

/**
 * Get all step types allowed for a specific experience type
 */
export function getStepTypesForType(
  experienceType: ExperienceType,
): StepType[] {
  const allowedCategories = TYPE_ALLOWED_CATEGORIES[experienceType]

  return Object.values(stepRegistry)
    .filter((def) => allowedCategories.includes(def.category))
    .map((def) => def.type)
}

/**
 * Get step definitions allowed for a specific experience type
 */
export function getStepDefinitionsForType(
  experienceType: ExperienceType,
): StepDefinition[] {
  const allowedCategories = TYPE_ALLOWED_CATEGORIES[experienceType]

  return Object.values(stepRegistry).filter((def) =>
    allowedCategories.includes(def.category),
  )
}

/**
 * Get all step definitions grouped by category
 */
export function getStepsByCategory(): Record<StepCategory, StepDefinition[]> {
  const grouped: Record<StepCategory, StepDefinition[]> = {
    info: [],
    input: [],
    capture: [],
    transform: [],
  }

  for (const definition of Object.values(stepRegistry)) {
    grouped[definition.category].push(definition)
  }

  return grouped
}

/**
 * Get step definitions grouped by category, filtered by experience type
 */
export function getStepsByCategoryForType(
  experienceType: ExperienceType,
): Record<StepCategory, StepDefinition[]> {
  const allowedCategories = TYPE_ALLOWED_CATEGORIES[experienceType]
  const grouped: Record<StepCategory, StepDefinition[]> = {
    info: [],
    input: [],
    capture: [],
    transform: [],
  }

  for (const definition of Object.values(stepRegistry)) {
    if (allowedCategories.includes(definition.category)) {
      grouped[definition.category].push(definition)
    }
  }

  return grouped
}

/**
 * Create a new step with a unique ID, auto-generated name, and default config
 *
 * @param type - The type of step to create
 * @param existingSteps - Current steps in the experience (for name generation)
 *
 * Note: Type assertion is required because TypeScript can't infer
 * which discriminated union variant we're creating at compile time.
 * The registry guarantees the type and config are correctly paired.
 */
export function createStep(
  type: StepType,
  existingSteps: Pick<Step, 'type'>[] = [],
): Step {
  const definition = stepRegistry[type]
  if (!definition) {
    throw new Error(`Unknown step type: ${type}`)
  }

  return {
    id: crypto.randomUUID(),
    type,
    name: generateStepName(existingSteps, type),
    config: definition.defaultConfig(),
  } as Step
}

/**
 * Check if a step type is allowed for an experience type
 */
export function isStepTypeAllowedForType(
  type: StepType,
  experienceType: ExperienceType,
): boolean {
  const allowedTypes = getStepTypesForType(experienceType)
  return allowedTypes.includes(type)
}

/**
 * Get category label for display
 */
export function getCategoryLabel(category: StepCategory): string {
  const labels: Record<StepCategory, string> = {
    info: 'Information',
    input: 'Input',
    capture: 'Capture',
    transform: 'Transform',
  }
  return labels[category]
}

/**
 * Get the display label for a step
 * Returns step.name if present and non-empty, otherwise default label
 */
export function getStepDisplayLabel(
  step: Step,
  definition: StepDefinition,
): string {
  // Use step.name if present and non-empty
  if (step.name && step.name.trim()) {
    return step.name.trim()
  }

  // Fallback to definition label
  return definition.label
}

/**
 * Color classes for step category styling
 */
export interface CategoryColorClasses {
  /** Background class for the icon wrapper */
  wrapper: string
  /** Foreground/text class for the icon */
  icon: string
}

/**
 * Get Tailwind color classes for a step category
 */
export function getCategoryColorClasses(
  category: StepCategory,
): CategoryColorClasses {
  const colorMap: Record<StepCategory, CategoryColorClasses> = {
    info: { wrapper: 'bg-muted', icon: 'text-muted-foreground' },
    input: { wrapper: 'bg-info/10', icon: 'text-info' },
    capture: { wrapper: 'bg-success/10', icon: 'text-success' },
    transform: { wrapper: 'bg-destructive/10', icon: 'text-destructive' },
  }
  return colorMap[category]
}
