// Types for AI Preset Preview Panel

import type { MediaReference as SharedMediaReference } from '@clementine/shared'

/**
 * Test input value type
 * - string for text variables
 * - MediaReference for image variables (uploaded images)
 * - null for empty/unset values
 *
 * Note: MediaReference is JSON-serializable and can be stored in localStorage
 */
export type TestInputValue = string | SharedMediaReference | null

/**
 * Test input state mapping variable names to their values
 */
export type TestInputState = {
  [variableName: string]: TestInputValue
}

export type ResolvedPrompt = {
  text: string
  characterCount: number
  hasUnresolved: boolean
  unresolvedRefs: {
    type: 'text' | 'input' | 'ref'
    name: string
  }[]
}

export type MediaReference = {
  name: string
  url: string
  source: 'registry' | 'test'
  type: 'ref' | 'input'
}

export type MediaReferenceList = MediaReference[]

export type ValidationError = {
  field: string
  message: string
}

export type ValidationWarning = {
  type: 'undefined-variable' | 'undefined-media' | 'unmapped-value'
  message: string
  reference?: string
}

export type ValidationState = {
  status: 'valid' | 'invalid' | 'incomplete'
  errors: ValidationError[]
  warnings: ValidationWarning[]
}
