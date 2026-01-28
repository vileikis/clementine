// Types for AI Preset Preview Panel

export type TestInputState = {
  [variableName: string]: string | File | null
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
