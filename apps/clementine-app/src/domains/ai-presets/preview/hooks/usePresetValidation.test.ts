// Tests for usePresetValidation hook

import { describe, expect, it } from 'vitest'
import { renderHook } from '@testing-library/react'
import { usePresetValidation } from './usePresetValidation'
import type { ResolvedPrompt, TestInputState } from '../types'
import type { PresetVariable } from '@clementine/shared'

describe('usePresetValidation', () => {
  it('should return valid status when all inputs are provided', () => {
    const variables: PresetVariable[] = [
      {
        id: '550e8400-e29b-41d4-a716-446655440001',
        name: 'userName',
        type: 'text',
        defaultValue: '',
        valueMap: null,
      },
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
      {
        id: '550e8400-e29b-41d4-a716-446655440002',
        name: 'userPhoto',
        type: 'image',
      },
    ]
    const testInputs: TestInputState = { userPhoto: null }
    const resolvedPrompt: ResolvedPrompt = {
      text: '<userPhoto> (missing)',
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
      {
        id: '550e8400-e29b-41d4-a716-446655440003',
        name: 'userName',
        type: 'text',
        defaultValue: '',
        valueMap: null,
      },
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
      {
        id: '550e8400-e29b-41d4-a716-446655440004',
        name: 'userPhoto',
        type: 'image',
      },
    ]
    const resolvedPrompt: ResolvedPrompt = {
      text: '<userPhoto>',
      characterCount: 18,
      hasUnresolved: false,
      unresolvedRefs: [],
    }

    const mockMediaRef = {
      mediaAssetId: 'test-asset-id',
      url: 'https://example.com/test.jpg',
      filePath: 'uploads/test.jpg',
      displayName: 'Test Media',
    }

    const { result, rerender } = renderHook(
      ({ testInputs }: { testInputs: TestInputState }) =>
        usePresetValidation(variables, testInputs, resolvedPrompt),
      { initialProps: { testInputs: { userPhoto: null } as TestInputState } },
    )

    expect(result.current.status).toBe('incomplete')

    // Provide the image (as MediaReference)
    rerender({ testInputs: { userPhoto: mockMediaRef } })

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
