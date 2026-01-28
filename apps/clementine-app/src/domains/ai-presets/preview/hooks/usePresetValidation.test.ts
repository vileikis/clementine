// Tests for usePresetValidation hook

import { describe, expect, it } from 'vitest'
import { renderHook } from '@testing-library/react'
import { usePresetValidation } from './usePresetValidation'
import type { ResolvedPrompt, TestInputState } from '../types'
import type { PresetVariable } from '@clementine/shared'

describe('usePresetValidation', () => {
  it('should return valid status when all inputs are provided', () => {
    const variables: PresetVariable[] = [
      { name: 'userName', type: 'text', defaultValue: '' },
    ]
    const testInputs: TestInputState = { userName: 'Alice' }
    const resolvedPrompt: ResolvedPrompt = {
      text: 'Hello Alice!',
      characterCount: 12,
      hasUnresolved: false,
      unresolvedRefs: [],
    }

    const { result } = renderHook(() =>
      usePresetValidation(variables, testInputs, resolvedPrompt),
    )

    expect(result.current.status).toBe('valid')
    expect(result.current.errors).toHaveLength(0)
    expect(result.current.warnings).toHaveLength(0)
  })

  it('should return incomplete status when required input is missing', () => {
    const variables: PresetVariable[] = [
      { name: 'userPhoto', type: 'image', defaultValue: '' },
    ]
    const testInputs: TestInputState = { userPhoto: null }
    const resolvedPrompt: ResolvedPrompt = {
      text: '[Image: userPhoto (missing)]',
      characterCount: 28,
      hasUnresolved: false,
      unresolvedRefs: [],
    }

    const { result } = renderHook(() =>
      usePresetValidation(variables, testInputs, resolvedPrompt),
    )

    expect(result.current.status).toBe('incomplete')
    expect(result.current.errors).toHaveLength(1)
  })

  it('should memoize result when dependencies do not change', () => {
    const variables: PresetVariable[] = [
      { name: 'userName', type: 'text', defaultValue: '' },
    ]
    const testInputs: TestInputState = { userName: 'Alice' }
    const resolvedPrompt: ResolvedPrompt = {
      text: 'Hello Alice!',
      characterCount: 12,
      hasUnresolved: false,
      unresolvedRefs: [],
    }

    const { result, rerender } = renderHook(() =>
      usePresetValidation(variables, testInputs, resolvedPrompt),
    )

    const firstResult = result.current

    // Rerender without changing dependencies
    rerender()

    // Should return same object reference (memoized)
    expect(result.current).toBe(firstResult)
  })

  it('should recompute when testInputs change', () => {
    const variables: PresetVariable[] = [
      { name: 'userPhoto', type: 'image', defaultValue: '' },
    ]
    const resolvedPrompt: ResolvedPrompt = {
      text: '[Image: userPhoto]',
      characterCount: 18,
      hasUnresolved: false,
      unresolvedRefs: [],
    }

    const { result, rerender } = renderHook(
      ({ testInputs }) =>
        usePresetValidation(variables, testInputs, resolvedPrompt),
      { initialProps: { testInputs: { userPhoto: null } } },
    )

    expect(result.current.status).toBe('incomplete')

    // Provide the image
    const mockFile = new File([''], 'test.jpg', { type: 'image/jpeg' })
    rerender({ testInputs: { userPhoto: mockFile } })

    expect(result.current.status).toBe('valid')
  })

  it('should return invalid status for undefined references', () => {
    const variables: PresetVariable[] = []
    const testInputs: TestInputState = {}
    const resolvedPrompt: ResolvedPrompt = {
      text: '[Undefined: deletedVar]',
      characterCount: 23,
      hasUnresolved: true,
      unresolvedRefs: [{ type: 'text', name: 'deletedVar' }],
    }

    const { result } = renderHook(() =>
      usePresetValidation(variables, testInputs, resolvedPrompt),
    )

    expect(result.current.status).toBe('invalid')
    expect(result.current.warnings).toHaveLength(1)
  })
})
