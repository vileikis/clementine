/**
 * Step Default Config Factories
 *
 * Factory functions for creating default step configurations.
 * These are UI-specific utilities that stay in the app layer.
 * The schemas themselves are in @clementine/shared.
 */
import type {
  ExperienceCapturePhotoStepConfig,
  ExperienceInfoStepConfig,
  ExperienceInputLongTextStepConfig,
  ExperienceInputMultiSelectStepConfig,
  ExperienceInputScaleStepConfig,
  ExperienceInputShortTextStepConfig,
  ExperienceInputYesNoStepConfig,
  ExperienceTransformPipelineStepConfig,
} from '@clementine/shared'

/**
 * Default config factory for info steps
 */
export function createDefaultInfoConfig(): ExperienceInfoStepConfig {
  return {
    title: '',
    description: '',
    media: null,
  }
}

/**
 * Default config factory for input scale steps
 * Note: Optional fields are omitted (not set to undefined) for Firestore compatibility
 */
export function createDefaultInputScaleConfig(): ExperienceInputScaleStepConfig {
  return {
    title: '',
    required: false,
    min: 1,
    max: 5,
    // minLabel and maxLabel are optional - omit them rather than setting to undefined
  }
}

/**
 * Default config factory for input yes/no steps
 */
export function createDefaultInputYesNoConfig(): ExperienceInputYesNoStepConfig {
  return {
    title: '',
    required: false,
  }
}

/**
 * Default config factory for input multi-select steps
 */
export function createDefaultInputMultiSelectConfig(): ExperienceInputMultiSelectStepConfig {
  return {
    title: '',
    required: false,
    options: [{ value: 'Option 1' }, { value: 'Option 2' }],
    multiSelect: false,
  }
}

/**
 * Default config factory for input short text steps
 */
export function createDefaultInputShortTextConfig(): ExperienceInputShortTextStepConfig {
  return {
    title: '',
    required: false,
    placeholder: '',
    maxLength: 100,
  }
}

/**
 * Default config factory for input long text steps
 */
export function createDefaultInputLongTextConfig(): ExperienceInputLongTextStepConfig {
  return {
    title: '',
    required: false,
    placeholder: '',
    maxLength: 500,
  }
}

/**
 * Default config factory for capture photo steps
 */
export function createDefaultCapturePhotoConfig(): ExperienceCapturePhotoStepConfig {
  return {
    aspectRatio: '1:1',
  }
}

/**
 * Default config factory for transform pipeline steps
 */
export function createDefaultTransformPipelineConfig(): ExperienceTransformPipelineStepConfig {
  return {}
}
