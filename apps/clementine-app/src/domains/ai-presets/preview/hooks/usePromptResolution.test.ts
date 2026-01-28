// Tests for usePromptResolution hook

import { describe, expect, it } from 'vitest'
import { renderHook } from '@testing-library/react'
import { usePromptResolution } from './usePromptResolution'
import type { TestInputState } from '../types'
import type { PresetMediaEntry, PresetVariable } from '@clementine/shared'

describe('usePromptResolution', () => {
  it('should resolve prompt template with test inputs', () => {
    const promptTemplate = 'Hello @{text:userName}!'
    const testInputs: TestInputState = { userName: 'Alice' }
    const variables: PresetVariable[] = [
      { name: 'userName', type: 'text', defaultValue: '' },
    ]
    const mediaRegistry: PresetMediaEntry[] = []

    const { result } = renderHook(() =>
      usePromptResolution(promptTemplate, testInputs, variables, mediaRegistry),
    )

    expect(result.current.text).toBe('Hello Alice!')
    expect(result.current.hasUnresolved).toBe(false)
  })

  it('should memoize result when dependencies do not change', () => {
    const promptTemplate = 'Hello @{text:userName}!'
    const testInputs: TestInputState = { userName: 'Alice' }
    const variables: PresetVariable[] = [
      { name: 'userName', type: 'text', defaultValue: '' },
    ]
    const mediaRegistry: PresetMediaEntry[] = []

    const { result, rerender } = renderHook(() =>
      usePromptResolution(promptTemplate, testInputs, variables, mediaRegistry),
    )

    const firstResult = result.current

    // Rerender without changing dependencies
    rerender()

    // Should return same object reference (memoized)
    expect(result.current).toBe(firstResult)
  })

  it('should recompute when promptTemplate changes', () => {
    const testInputs: TestInputState = { userName: 'Alice' }
    const variables: PresetVariable[] = [
      { name: 'userName', type: 'text', defaultValue: '' },
    ]
    const mediaRegistry: PresetMediaEntry[] = []

    const { result, rerender } = renderHook(
      ({ promptTemplate }) =>
        usePromptResolution(
          promptTemplate,
          testInputs,
          variables,
          mediaRegistry,
        ),
      { initialProps: { promptTemplate: 'Hello @{text:userName}!' } },
    )

    expect(result.current.text).toBe('Hello Alice!')

    // Change prompt template
    rerender({ promptTemplate: 'Goodbye @{text:userName}!' })

    expect(result.current.text).toBe('Goodbye Alice!')
  })

  it('should recompute when testInputs change', () => {
    const promptTemplate = 'Hello @{text:userName}!'
    const variables: PresetVariable[] = [
      { name: 'userName', type: 'text', defaultValue: '' },
    ]
    const mediaRegistry: PresetMediaEntry[] = []

    const { result, rerender } = renderHook(
      ({ testInputs }) =>
        usePromptResolution(
          promptTemplate,
          testInputs,
          variables,
          mediaRegistry,
        ),
      { initialProps: { testInputs: { userName: 'Alice' } } },
    )

    expect(result.current.text).toBe('Hello Alice!')

    // Change test inputs
    rerender({ testInputs: { userName: 'Bob' } })

    expect(result.current.text).toBe('Hello Bob!')
  })

  it('should track character count', () => {
    const promptTemplate = 'A @{text:style} portrait of @{text:userName}.'
    const testInputs: TestInputState = { style: 'modern', userName: 'Alice' }
    const variables: PresetVariable[] = [
      {
        name: 'style',
        type: 'text',
        defaultValue: '',
        valueMap: [{ value: 'modern', text: 'minimalist' }],
      },
      { name: 'userName', type: 'text', defaultValue: '' },
    ]
    const mediaRegistry: PresetMediaEntry[] = []

    const { result } = renderHook(() =>
      usePromptResolution(promptTemplate, testInputs, variables, mediaRegistry),
    )

    expect(result.current.text).toBe('A minimalist portrait of Alice.')
    expect(result.current.characterCount).toBe(32)
  })
})
