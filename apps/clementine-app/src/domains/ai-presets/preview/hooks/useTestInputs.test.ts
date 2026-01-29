// Tests for useTestInputs hook

import { beforeEach, describe, expect, it } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import { useAIPresetPreviewStore } from '../store/useAIPresetPreviewStore'
import { useTestInputs } from './useTestInputs'
import type { PresetVariable } from '@clementine/shared'

describe('useTestInputs', () => {
  beforeEach(() => {
    // Reset store before each test
    useAIPresetPreviewStore.setState({ presets: {} })
  })

  it('should initialize with default values from variables', async () => {
    const variables: PresetVariable[] = [
      {
        id: '550e8400-e29b-41d4-a716-446655440011',
        name: 'userName',
        type: 'text',
        defaultValue: 'Guest',
        valueMap: null,
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440012',
        name: 'style',
        type: 'text',
        defaultValue: 'modern',
        valueMap: null,
      },
    ]

    const { result } = renderHook(() => useTestInputs('preset-1', variables))

    await waitFor(() => {
      expect(result.current.testInputs).toEqual({
        userName: 'Guest',
        style: 'modern',
      })
    })
  })

  it('should initialize with empty state when no default value', async () => {
    const variables: PresetVariable[] = [
      {
        id: '550e8400-e29b-41d4-a716-446655440013',
        name: 'userName',
        type: 'text',
        defaultValue: null,
        valueMap: null,
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440014',
        name: 'userPhoto',
        type: 'image',
      },
    ]

    // Initialize preset in store first to avoid infinite loop
    useAIPresetPreviewStore.getState().resetTestInputs('preset-2')

    const { result } = renderHook(() => useTestInputs('preset-2', variables))

    // When no default value, inputs are not initialized (remain empty in store)
    await waitFor(() => {
      expect(result.current.testInputs).toEqual({})
    })
  })

  it('should update input value', async () => {
    const variables: PresetVariable[] = [
      {
        id: '550e8400-e29b-41d4-a716-446655440015',
        name: 'userName',
        type: 'text',
        defaultValue: null,
        valueMap: null,
      },
    ]

    // Initialize preset in store first
    useAIPresetPreviewStore.getState().resetTestInputs('preset-3')

    const { result } = renderHook(() => useTestInputs('preset-3', variables))

    await waitFor(() => {
      expect(result.current.testInputs).toBeDefined()
    })

    act(() => {
      result.current.updateInput('userName', 'Alice')
    })

    expect(result.current.testInputs.userName).toBe('Alice')
  })

  it('should update file input value', async () => {
    const variables: PresetVariable[] = [
      {
        id: '550e8400-e29b-41d4-a716-446655440016',
        name: 'userPhoto',
        type: 'image',
      },
    ]

    // Initialize preset in store first
    useAIPresetPreviewStore.getState().resetTestInputs('preset-4')

    const { result } = renderHook(() => useTestInputs('preset-4', variables))

    await waitFor(() => {
      expect(result.current.testInputs).toBeDefined()
    })

    const mockMediaReference = {
      mediaAssetId: 'test-asset-id',
      url: 'https://example.com/test.jpg',
      filePath: 'uploads/test.jpg',
      displayName: 'Test Media',
    }

    act(() => {
      result.current.updateInput('userPhoto', mockMediaReference)
    })

    expect(result.current.testInputs.userPhoto).toBe(mockMediaReference)
  })

  it('should reset to default values', async () => {
    const variables: PresetVariable[] = [
      {
        id: '550e8400-e29b-41d4-a716-446655440017',
        name: 'userName',
        type: 'text',
        defaultValue: 'Guest',
        valueMap: null,
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440018',
        name: 'style',
        type: 'text',
        defaultValue: 'modern',
        valueMap: null,
      },
    ]

    const { result } = renderHook(() => useTestInputs('preset-5', variables))

    await waitFor(() => {
      expect(result.current.testInputs).toEqual({
        userName: 'Guest',
        style: 'modern',
      })
    })

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

    await waitFor(() => {
      expect(result.current.testInputs).toEqual({
        userName: 'Guest',
        style: 'modern',
      })
    })
  })

  it('should handle empty variables array', async () => {
    const variables: PresetVariable[] = []

    // Initialize preset in store first
    useAIPresetPreviewStore.getState().resetTestInputs('preset-6')

    const { result } = renderHook(() => useTestInputs('preset-6', variables))

    await waitFor(() => {
      expect(result.current.testInputs).toEqual({})
    })
  })

  it('should update multiple inputs independently', async () => {
    const variables: PresetVariable[] = [
      {
        id: '550e8400-e29b-41d4-a716-446655440019',
        name: 'field1',
        type: 'text',
        defaultValue: null,
        valueMap: null,
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440020',
        name: 'field2',
        type: 'text',
        defaultValue: null,
        valueMap: null,
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440021',
        name: 'field3',
        type: 'text',
        defaultValue: null,
        valueMap: null,
      },
    ]

    // Initialize preset in store first
    useAIPresetPreviewStore.getState().resetTestInputs('preset-7')

    const { result } = renderHook(() => useTestInputs('preset-7', variables))

    await waitFor(() => {
      expect(result.current.testInputs).toBeDefined()
    })

    act(() => {
      result.current.updateInput('field1', 'value1')
    })

    expect(result.current.testInputs.field1).toBe('value1')
    expect(result.current.testInputs.field2).toBeUndefined()
    expect(result.current.testInputs.field3).toBeUndefined()

    act(() => {
      result.current.updateInput('field3', 'value3')
    })

    expect(result.current.testInputs.field1).toBe('value1')
    expect(result.current.testInputs.field2).toBeUndefined()
    expect(result.current.testInputs.field3).toBe('value3')
  })
})
