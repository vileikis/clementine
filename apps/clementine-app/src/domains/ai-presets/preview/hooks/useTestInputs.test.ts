// Tests for useTestInputs hook

import { describe, expect, it } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useTestInputs } from './useTestInputs'
import type { PresetVariable } from '@clementine/shared'

describe('useTestInputs', () => {
  it('should initialize with default values from variables', () => {
    const variables: PresetVariable[] = [
      { name: 'userName', type: 'text', defaultValue: 'Guest' },
      { name: 'style', type: 'text', defaultValue: 'modern' },
    ]

    const { result } = renderHook(() => useTestInputs(variables))

    expect(result.current.testInputs).toEqual({
      userName: 'Guest',
      style: 'modern',
    })
  })

  it('should initialize with null when no default value', () => {
    const variables: PresetVariable[] = [
      { name: 'userName', type: 'text', defaultValue: '' },
      { name: 'userPhoto', type: 'image', defaultValue: '' },
    ]

    const { result } = renderHook(() => useTestInputs(variables))

    expect(result.current.testInputs).toEqual({
      userName: '',
      userPhoto: '',
    })
  })

  it('should update input value', () => {
    const variables: PresetVariable[] = [
      { name: 'userName', type: 'text', defaultValue: '' },
    ]

    const { result } = renderHook(() => useTestInputs(variables))

    act(() => {
      result.current.updateInput('userName', 'Alice')
    })

    expect(result.current.testInputs.userName).toBe('Alice')
  })

  it('should update file input value', () => {
    const variables: PresetVariable[] = [
      { name: 'userPhoto', type: 'image', defaultValue: '' },
    ]

    const { result } = renderHook(() => useTestInputs(variables))
    const mockFile = new File([''], 'test.jpg', { type: 'image/jpeg' })

    act(() => {
      result.current.updateInput('userPhoto', mockFile)
    })

    expect(result.current.testInputs.userPhoto).toBe(mockFile)
  })

  it('should reset to default values', () => {
    const variables: PresetVariable[] = [
      { name: 'userName', type: 'text', defaultValue: 'Guest' },
      { name: 'style', type: 'text', defaultValue: 'modern' },
    ]

    const { result } = renderHook(() => useTestInputs(variables))

    // Update values
    act(() => {
      result.current.updateInput('userName', 'Alice')
      result.current.updateInput('style', 'vintage')
    })

    expect(result.current.testInputs).toEqual({
      userName: 'Alice',
      style: 'vintage',
    })

    // Reset to defaults
    act(() => {
      result.current.resetToDefaults()
    })

    expect(result.current.testInputs).toEqual({
      userName: 'Guest',
      style: 'modern',
    })
  })

  it('should handle empty variables array', () => {
    const variables: PresetVariable[] = []

    const { result } = renderHook(() => useTestInputs(variables))

    expect(result.current.testInputs).toEqual({})
  })

  it('should update multiple inputs independently', () => {
    const variables: PresetVariable[] = [
      { name: 'field1', type: 'text', defaultValue: '' },
      { name: 'field2', type: 'text', defaultValue: '' },
      { name: 'field3', type: 'text', defaultValue: '' },
    ]

    const { result } = renderHook(() => useTestInputs(variables))

    act(() => {
      result.current.updateInput('field1', 'value1')
    })

    expect(result.current.testInputs.field1).toBe('value1')
    expect(result.current.testInputs.field2).toBe('')
    expect(result.current.testInputs.field3).toBe('')

    act(() => {
      result.current.updateInput('field3', 'value3')
    })

    expect(result.current.testInputs.field1).toBe('value1')
    expect(result.current.testInputs.field2).toBe('')
    expect(result.current.testInputs.field3).toBe('value3')
  })
})
