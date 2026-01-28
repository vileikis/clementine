// Prompt resolution utilities for AI Preset Preview

import type {
  MediaReferenceList,
  ResolvedPrompt,
  TestInputState,
} from '../types'
import type { PresetMediaEntry, PresetVariable } from '@clementine/shared'

/**
 * Resolves media and input references within text (helper function).
 * Used to resolve references in value mappings.
 *
 * @param text - Text that may contain @{ref:name} or @{input:name} references
 * @param variables - Array of preset variables
 * @param mediaRegistry - Array of preset media entries
 * @param testInputs - Current test input values
 * @param unresolved - Array to collect unresolved references
 * @returns Text with media/input references resolved to [Media: name] or [Image: name]
 */
function resolveMediaReferencesInText(
  text: string,
  variables: PresetVariable[],
  mediaRegistry: PresetMediaEntry[],
  testInputs: TestInputState,
  unresolved: { type: 'text' | 'input' | 'ref'; name: string }[],
): string {
  const regex = /@\{(input|ref):([a-zA-Z_][a-zA-Z0-9_]*)\}/g

  return text.replace(regex, (match, type, name) => {
    if (type === 'input') {
      const variable = variables.find(
        (v) => v.name === name && v.type === 'image',
      )
      if (!variable) {
        unresolved.push({ type, name })
        return `[Undefined: ${name}]`
      }
      const file = testInputs[name]
      return file ? `[Image: ${name}]` : `[Image: ${name} (missing)]`
    }

    if (type === 'ref') {
      const media = mediaRegistry.find((m) => m.name === name)
      if (!media) {
        unresolved.push({ type, name })
        return `[Media: ${name} (missing)]`
      }
      return `[Media: ${name}]`
    }

    return match
  })
}

/**
 * Resolves a prompt template by substituting all @{type:name} references
 * with their corresponding values from test inputs, value mappings, and media registry.
 *
 * @param promptTemplate - Template string with @{type:name} references
 * @param testInputs - Current test input values
 * @param variables - Array of preset variables (with value mappings and defaults)
 * @param mediaRegistry - Array of preset media entries
 * @returns Resolved prompt with substitutions and metadata
 */
export function resolvePrompt(
  promptTemplate: string,
  testInputs: TestInputState,
  variables: PresetVariable[],
  mediaRegistry: PresetMediaEntry[],
): ResolvedPrompt {
  const regex = /@\{(text|input|ref):([a-zA-Z_][a-zA-Z0-9_]*)\}/g
  let resolvedText = promptTemplate
  const unresolved: { type: 'text' | 'input' | 'ref'; name: string }[] = []

  // Replace all references
  resolvedText = resolvedText.replace(regex, (match, type, name) => {
    if (type === 'text') {
      const variable = variables.find(
        (v) => v.name === name && v.type === 'text',
      )
      if (!variable || variable.type !== 'text') {
        unresolved.push({ type, name })
        return `[Undefined: ${name}]`
      }
      const inputValue = testInputs[name]
      // Check value mapping
      if (variable.valueMap && inputValue && typeof inputValue === 'string') {
        const mapped = variable.valueMap.find(
          (m: { value: string; text: string }) => m.value === inputValue,
        )
        if (mapped) {
          // Resolve any media/input references within the mapped text
          return resolveMediaReferencesInText(
            mapped.text,
            variables,
            mediaRegistry,
            testInputs,
            unresolved,
          )
        }
        return variable.defaultValue || `[No mapping: ${name}]`
      }
      return (
        (typeof inputValue === 'string' ? inputValue : null) ||
        variable.defaultValue ||
        `[No value: ${name}]`
      )
    }

    if (type === 'input') {
      const variable = variables.find(
        (v) => v.name === name && v.type === 'image',
      )
      if (!variable) {
        unresolved.push({ type, name })
        return `[Undefined: ${name}]`
      }
      const file = testInputs[name]
      return file ? `[Image: ${name}]` : `[Image: ${name} (missing)]`
    }

    if (type === 'ref') {
      const media = mediaRegistry.find((m) => m.name === name)
      if (!media) {
        unresolved.push({ type, name })
        return `[Media: ${name} (missing)]`
      }
      return `[Media: ${name}]`
    }

    return match
  })

  return {
    text: resolvedText,
    characterCount: resolvedText.length,
    hasUnresolved: unresolved.length > 0,
    unresolvedRefs: unresolved,
  }
}

/**
 * Extracts all media references (@{ref:name} and @{input:name}) from a prompt template
 * and looks up their corresponding URLs from the media registry and test inputs.
 *
 * @param promptTemplate - Template string with @{type:name} references
 * @param testInputs - Current test input values (File objects for images)
 * @param variables - Array of preset variables
 * @param mediaRegistry - Array of preset media entries with URLs
 * @returns Array of media references with URLs for preview
 */
export function extractMediaReferences(
  promptTemplate: string,
  testInputs: TestInputState,
  _variables: PresetVariable[],
  mediaRegistry: PresetMediaEntry[],
): MediaReferenceList {
  const regex = /@\{(input|ref):([a-zA-Z_][a-zA-Z0-9_]*)\}/g
  const references: MediaReferenceList = []
  let match: RegExpExecArray | null

  while ((match = regex.exec(promptTemplate)) !== null) {
    const [, type, name] = match

    if (type === 'input') {
      const file = testInputs[name]
      if (file instanceof File) {
        references.push({
          name,
          url: URL.createObjectURL(file), // Create blob URL for preview
          source: 'test',
          type: 'input',
        })
      }
    }

    if (type === 'ref') {
      const media = mediaRegistry.find((m) => m.name === name)
      if (media) {
        references.push({
          name,
          url: media.url,
          source: 'registry',
          type: 'ref',
        })
      }
    }
  }

  return references
}

/**
 * Parses all @{type:name} references from a prompt template.
 * Used for validation and reference tracking.
 *
 * @param promptTemplate - Template string with @{type:name} references
 * @returns Array of parsed references with type and name
 */
export function parseReferences(promptTemplate: string): {
  type: 'text' | 'input' | 'ref'
  name: string
}[] {
  const regex = /@\{(text|input|ref):([a-zA-Z_][a-zA-Z0-9_]*)\}/g
  const references: { type: 'text' | 'input' | 'ref'; name: string }[] = []
  let match: RegExpExecArray | null

  while ((match = regex.exec(promptTemplate)) !== null) {
    const [, type, name] = match
    references.push({ type: type as 'text' | 'input' | 'ref', name })
  }

  return references
}
