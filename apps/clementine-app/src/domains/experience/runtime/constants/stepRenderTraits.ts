import type { ExperienceStepType } from '@clementine/shared'
import type { Surface } from '@/shared/theming'

/** Declarative per-step rendering characteristics */
export type StepRenderTraits = {
  layout: 'scroll' | 'full-height'
  surface: Surface
  navigation: 'default' | 'custom'
}

const DEFAULT_TRAITS: StepRenderTraits = {
  layout: 'scroll',
  surface: 'auto',
  navigation: 'default',
}

const STEP_RENDER_TRAITS: Partial<
  Record<ExperienceStepType, Partial<StepRenderTraits>>
> = {
  'capture.photo': {
    layout: 'full-height',
    surface: 'dark',
    navigation: 'custom',
  },
}

/** Resolve render traits for a given step type, falling back to defaults.
 *  When completing, forces auto surface (themed loading/error, not dark camera). */
export function getStepRenderTraits(
  stepType: ExperienceStepType | undefined,
  isCompleting = false,
): StepRenderTraits {
  if (!stepType) return DEFAULT_TRAITS
  const traits = { ...DEFAULT_TRAITS, ...STEP_RENDER_TRAITS[stepType] }
  if (isCompleting) traits.surface = 'auto'
  return traits
}
