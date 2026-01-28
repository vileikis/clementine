import { useMemo } from 'react'
import type { PresetMediaEntry, PresetVariable } from '@clementine/shared'
import type { MediaReference, TestInputState } from '../types'

/**
 * Helper function to extract media references from text (including value mappings)
 */
function extractMediaReferencesFromText(
  text: string,
  testInputs: TestInputState,
  mediaRegistry: PresetMediaEntry[],
  references: MediaReference[],
  seen: Set<string>,
): void {
  const regex = /@\{(input|ref):([a-zA-Z_][a-zA-Z0-9_]*)\}/g
  let match: RegExpExecArray | null

  while ((match = regex.exec(text)) !== null) {
    const [, type, name] = match
    const key = `${type}:${name}`

    // Skip if already processed
    if (seen.has(key)) continue
    seen.add(key)

    if (type === 'input') {
      const inputValue = testInputs[name]
      // TestInputValue is MediaReference for images (not File)
      if (inputValue && typeof inputValue === 'object' && 'url' in inputValue) {
        references.push({
          name,
          url: inputValue.url,
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
}

export function useMediaReferences(
  promptTemplate: string,
  testInputs: TestInputState,
  variables: PresetVariable[],
  mediaRegistry: PresetMediaEntry[],
): MediaReference[] {
  return useMemo(() => {
    const references: MediaReference[] = []
    const seen = new Set<string>() // Prevent duplicate references

    // 1. Extract media references from the prompt template
    extractMediaReferencesFromText(
      promptTemplate,
      testInputs,
      mediaRegistry,
      references,
      seen,
    )

    // 2. Extract media references from value mappings of text variables
    // (This matches the behavior in resolvePrompt where mapped.text is resolved)
    for (const variable of variables) {
      if (variable.type === 'text' && variable.valueMap) {
        const inputValue = testInputs[variable.name]
        if (inputValue && typeof inputValue === 'string') {
          // Find the mapped value
          const mapped = variable.valueMap.find((m) => m.value === inputValue)
          if (mapped) {
            // Extract media references from the mapped text
            extractMediaReferencesFromText(
              mapped.text,
              testInputs,
              mediaRegistry,
              references,
              seen,
            )
          }
        }
      }
    }

    return references
  }, [promptTemplate, testInputs, variables, mediaRegistry])
}
