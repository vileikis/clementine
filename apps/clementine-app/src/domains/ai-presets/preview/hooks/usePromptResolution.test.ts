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
      {
        id: '550e8400-e29b-41d4-a716-446655440005',
        name: 'userName',
        type: 'text',
        defaultValue: '',
        valueMap: null,
      },
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
      {
        id: '550e8400-e29b-41d4-a716-446655440006',
        name: 'userName',
        type: 'text',
        defaultValue: '',
        valueMap: null,
      },
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
      {
        id: '550e8400-e29b-41d4-a716-446655440007',
        name: 'userName',
        type: 'text',
        defaultValue: '',
        valueMap: null,
      },
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
      {
        id: '550e8400-e29b-41d4-a716-446655440008',
        name: 'userName',
        type: 'text',
        defaultValue: '',
        valueMap: null,
      },
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
        id: '550e8400-e29b-41d4-a716-446655440009',
        name: 'style',
        type: 'text',
        defaultValue: '',
        valueMap: [{ value: 'modern', text: 'minimalist' }],
      },
      {
        id: '550e8400-e29b-41d4-a716-44665544000a',
        name: 'userName',
        type: 'text',
        defaultValue: '',
        valueMap: null,
      },
    ]
    const mediaRegistry: PresetMediaEntry[] = []

    const { result } = renderHook(() =>
      usePromptResolution(promptTemplate, testInputs, variables, mediaRegistry),
    )

    expect(result.current.text).toBe('A minimalist portrait of Alice.')
    expect(result.current.characterCount).toBe(31)
  })
})
