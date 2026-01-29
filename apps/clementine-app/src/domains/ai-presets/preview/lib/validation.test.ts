// Tests for validation utilities

import { describe, expect, it } from 'vitest'
import { validatePresetInputs } from './validation'
import type { ResolvedPrompt, TestInputState } from '../types'
import type { PresetVariable } from '@clementine/shared'

describe('validatePresetInputs', () => {
  it('should return valid status when all inputs are provided', () => {
    const variables: PresetVariable[] = [
      {
        id: '550e8400-e29b-41d4-a716-44665544000b',
        name: 'userName',
        type: 'text',
        defaultValue: '',
        valueMap: null,
      },
      {
        id: '550e8400-e29b-41d4-a716-44665544000c',
        name: 'userPhoto',
        type: 'image',
      },
    ]
    const testInputs: TestInputState = {
      userName: 'Alice',
      userPhoto: {
        mediaAssetId: 'test-asset-id',
        url: 'https://example.com/test.jpg',
        filePath: 'uploads/test.jpg',
        displayName: 'Test Media',
      },
    }
    const resolvedPrompt: ResolvedPrompt = {
      text: 'Hello Alice! <userPhoto>',
      characterCount: 32,
      hasUnresolved: false,
      unresolvedRefs: [],
    }

    const result = validatePresetInputs(variables, testInputs, resolvedPrompt)

    expect(result.status).toBe('valid')
    expect(result.errors).toHaveLength(0)
    expect(result.warnings).toHaveLength(0)
  })

  it('should return incomplete status when image is missing', () => {
    const variables: PresetVariable[] = [
      {
        id: '550e8400-e29b-41d4-a716-44665544000d',
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

    const result = validatePresetInputs(variables, testInputs, resolvedPrompt)

    expect(result.status).toBe('incomplete')
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0].field).toBe('userPhoto')
    expect(result.errors[0].message).toBe('Image required for: userPhoto')
  })

  it('should return incomplete status when required text input is missing', () => {
    const variables: PresetVariable[] = [
      {
        id: '550e8400-e29b-41d4-a716-44665544000e',
        name: 'userName',
        type: 'text',
        defaultValue: '',
        valueMap: null,
      }, // No default
    ]
    const testInputs: TestInputState = { userName: null }
    const resolvedPrompt: ResolvedPrompt = {
      text: '[No value: userName]',
      characterCount: 20,
      hasUnresolved: false,
      unresolvedRefs: [],
    }

    const result = validatePresetInputs(variables, testInputs, resolvedPrompt)

    expect(result.status).toBe('incomplete')
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0].field).toBe('userName')
    expect(result.errors[0].message).toBe('Value required for: userName')
  })

  it('should not error when text variable has default value', () => {
    const variables: PresetVariable[] = [
      {
        id: '550e8400-e29b-41d4-a716-44665544000f',
        name: 'userName',
        type: 'text',
        defaultValue: 'Guest',
        valueMap: null,
      },
    ]
    const testInputs: TestInputState = { userName: null }
    const resolvedPrompt: ResolvedPrompt = {
      text: 'Hello Guest!',
      characterCount: 12,
      hasUnresolved: false,
      unresolvedRefs: [],
    }

    const result = validatePresetInputs(variables, testInputs, resolvedPrompt)

    expect(result.status).toBe('valid')
    expect(result.errors).toHaveLength(0)
  })

  it('should return invalid status for undefined variables', () => {
    const variables: PresetVariable[] = []
    const testInputs: TestInputState = {}
    const resolvedPrompt: ResolvedPrompt = {
      text: '[Undefined: deletedVar]',
      characterCount: 23,
      hasUnresolved: true,
      unresolvedRefs: [{ type: 'text', name: 'deletedVar' }],
    }

    const result = validatePresetInputs(variables, testInputs, resolvedPrompt)

    expect(result.status).toBe('invalid')
    expect(result.errors).toHaveLength(0)
    expect(result.warnings).toHaveLength(1)
    expect(result.warnings[0].type).toBe('undefined-variable')
    expect(result.warnings[0].message).toBe(
      'Undefined variable: @{text:deletedVar}',
    )
    expect(result.warnings[0].reference).toBe('deletedVar')
  })

  it('should return invalid status for undefined media', () => {
    const variables: PresetVariable[] = []
    const testInputs: TestInputState = {}
    const resolvedPrompt: ResolvedPrompt = {
      text: '<missingRef> (missing)',
      characterCount: 29,
      hasUnresolved: true,
      unresolvedRefs: [{ type: 'ref', name: 'missingRef' }],
    }

    const result = validatePresetInputs(variables, testInputs, resolvedPrompt)

    expect(result.status).toBe('invalid')
    expect(result.errors).toHaveLength(0)
    expect(result.warnings).toHaveLength(1)
    expect(result.warnings[0].type).toBe('undefined-media')
    expect(result.warnings[0].message).toBe(
      'Undefined media: @{ref:missingRef}',
    )
    expect(result.warnings[0].reference).toBe('missingRef')
  })

  it('should prioritize incomplete over invalid status', () => {
    const variables: PresetVariable[] = [
      {
        id: '550e8400-e29b-41d4-a716-446655440010',
        name: 'userPhoto',
        type: 'image',
      },
    ]
    const testInputs: TestInputState = { userPhoto: null }
    const resolvedPrompt: ResolvedPrompt = {
      text: '<userPhoto> (missing) [Undefined: deletedVar]',
      characterCount: 53,
      hasUnresolved: true,
      unresolvedRefs: [{ type: 'text', name: 'deletedVar' }],
    }

    const result = validatePresetInputs(variables, testInputs, resolvedPrompt)

    expect(result.status).toBe('incomplete')
    expect(result.errors).toHaveLength(1)
    expect(result.warnings).toHaveLength(1)
  })

  it('should handle empty variables and inputs', () => {
    const variables: PresetVariable[] = []
    const testInputs: TestInputState = {}
    const resolvedPrompt: ResolvedPrompt = {
      text: 'Just plain text',
      characterCount: 15,
      hasUnresolved: false,
      unresolvedRefs: [],
    }

    const result = validatePresetInputs(variables, testInputs, resolvedPrompt)

    expect(result.status).toBe('valid')
    expect(result.errors).toHaveLength(0)
    expect(result.warnings).toHaveLength(0)
  })
})
