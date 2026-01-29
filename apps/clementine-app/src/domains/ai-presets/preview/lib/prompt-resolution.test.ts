// Tests for prompt resolution utilities

import { describe, expect, it } from 'vitest'
import {
  extractMediaReferences,
  parseReferences,
  resolvePrompt,
} from './prompt-resolution'
import type { TestInputState } from '../types'
import type { PresetMediaEntry, PresetVariable } from '@clementine/shared'

describe('resolvePrompt', () => {
  it('should substitute text variables without value mappings', () => {
    const promptTemplate = 'Hello @{text:userName}!'
    const testInputs: TestInputState = { userName: 'Alice' }
    const variables: PresetVariable[] = [
      {
        id: '550e8400-e29b-41d4-a716-446655440001',
        name: 'userName',
        type: 'text',
        defaultValue: '',
        valueMap: null,
      },
    ]
    const mediaRegistry: PresetMediaEntry[] = []

    const result = resolvePrompt(
      promptTemplate,
      testInputs,
      variables,
      mediaRegistry,
    )

    expect(result.text).toBe('Hello Alice!')
    expect(result.characterCount).toBe(12)
    expect(result.hasUnresolved).toBe(false)
  })

  it('should substitute text variables with value mappings', () => {
    const promptTemplate = 'Style: @{text:style}'
    const testInputs: TestInputState = { style: 'modern' }
    const variables: PresetVariable[] = [
      {
        id: '550e8400-e29b-41d4-a716-446655440002',
        name: 'style',
        type: 'text',
        defaultValue: 'modern',
        valueMap: [
          { value: 'modern', text: 'minimalist and clean' },
          { value: 'vintage', text: 'retro and nostalgic' },
        ],
      },
    ]
    const mediaRegistry: PresetMediaEntry[] = []

    const result = resolvePrompt(
      promptTemplate,
      testInputs,
      variables,
      mediaRegistry,
    )

    expect(result.text).toBe('Style: minimalist and clean')
  })

  it('should use default value when input is empty', () => {
    const promptTemplate = 'Name: @{text:userName}'
    const testInputs: TestInputState = { userName: null }
    const variables: PresetVariable[] = [
      {
        id: '550e8400-e29b-41d4-a716-446655440003',
        name: 'userName',
        type: 'text',
        defaultValue: 'Guest',
        valueMap: null,
      },
    ]
    const mediaRegistry: PresetMediaEntry[] = []

    const result = resolvePrompt(
      promptTemplate,
      testInputs,
      variables,
      mediaRegistry,
    )

    expect(result.text).toBe('Name: Guest')
  })

  it('should replace image placeholders for uploaded files', () => {
    const promptTemplate = 'Photo: @{input:userPhoto}'
    const mockMediaRef = {
      mediaAssetId: 'test-asset-id',
      url: 'https://example.com/test.jpg',
      filePath: 'uploads/test.jpg',
      displayName: 'Test Media',
    }
    const testInputs: TestInputState = { userPhoto: mockMediaRef }
    const variables: PresetVariable[] = [
      {
        id: '550e8400-e29b-41d4-a716-446655440004',
        name: 'userPhoto',
        type: 'image',
      },
    ]
    const mediaRegistry: PresetMediaEntry[] = []

    const result = resolvePrompt(
      promptTemplate,
      testInputs,
      variables,
      mediaRegistry,
    )

    expect(result.text).toBe('Photo: <userPhoto>')
  })

  it('should indicate missing image when not uploaded', () => {
    const promptTemplate = 'Photo: @{input:userPhoto}'
    const testInputs: TestInputState = { userPhoto: null }
    const variables: PresetVariable[] = [
      {
        id: '550e8400-e29b-41d4-a716-446655440005',
        name: 'userPhoto',
        type: 'image',
      },
    ]
    const mediaRegistry: PresetMediaEntry[] = []

    const result = resolvePrompt(
      promptTemplate,
      testInputs,
      variables,
      mediaRegistry,
    )

    expect(result.text).toBe('Photo: <userPhoto> (missing)')
  })

  it('should replace media registry references', () => {
    const promptTemplate = 'Reference: @{ref:styleRef}'
    const testInputs: TestInputState = {}
    const variables: PresetVariable[] = []
    const mediaRegistry: PresetMediaEntry[] = [
      {
        name: 'styleRef',
        url: 'https://example.com/image.jpg',
        mediaAssetId: 'asset-1',
        filePath: 'uploads/styleRef.jpg',
        displayName: 'Test Media',
      },
    ]

    const result = resolvePrompt(
      promptTemplate,
      testInputs,
      variables,
      mediaRegistry,
    )

    expect(result.text).toBe('Reference: <styleRef>')
  })

  it('should indicate missing media from registry', () => {
    const promptTemplate = 'Reference: @{ref:missingRef}'
    const testInputs: TestInputState = {}
    const variables: PresetVariable[] = []
    const mediaRegistry: PresetMediaEntry[] = []

    const result = resolvePrompt(
      promptTemplate,
      testInputs,
      variables,
      mediaRegistry,
    )

    expect(result.text).toBe('Reference: <missingRef> (missing)')
    expect(result.hasUnresolved).toBe(true)
    expect(result.unresolvedRefs).toEqual([{ type: 'ref', name: 'missingRef' }])
  })

  it('should track undefined variables', () => {
    const promptTemplate = 'Hello @{text:deletedVar}!'
    const testInputs: TestInputState = {}
    const variables: PresetVariable[] = []
    const mediaRegistry: PresetMediaEntry[] = []

    const result = resolvePrompt(
      promptTemplate,
      testInputs,
      variables,
      mediaRegistry,
    )

    expect(result.text).toBe('Hello [Undefined: deletedVar]!')
    expect(result.hasUnresolved).toBe(true)
    expect(result.unresolvedRefs).toEqual([
      { type: 'text', name: 'deletedVar' },
    ])
  })

  it('should handle empty prompt template', () => {
    const result = resolvePrompt('', {}, [], [])
    expect(result.text).toBe('')
    expect(result.characterCount).toBe(0)
    expect(result.hasUnresolved).toBe(false)
  })

  it('should resolve media references within value mappings', () => {
    const promptTemplate = 'Character is holding @{text:weapon}'
    const testInputs: TestInputState = { weapon: 'hammer' }
    const variables: PresetVariable[] = [
      {
        id: '550e8400-e29b-41d4-a716-446655440006',
        name: 'weapon',
        type: 'text',
        defaultValue: 'sword',
        valueMap: [
          { value: 'sword', text: 'They should be holding @{ref:sword_ref}' },
          { value: 'hammer', text: 'They should be holding @{ref:hammer}' },
        ],
      },
    ]
    const mediaRegistry: PresetMediaEntry[] = [
      {
        name: 'hammer',
        url: 'https://example.com/hammer.jpg',
        mediaAssetId: 'asset-1',
        filePath: 'uploads/hammer.jpg',
        displayName: 'Test Media',
      },
    ]

    const result = resolvePrompt(
      promptTemplate,
      testInputs,
      variables,
      mediaRegistry,
    )

    expect(result.text).toBe(
      'Character is holding They should be holding <hammer>',
    )
    expect(result.hasUnresolved).toBe(false)
  })

  it('should resolve missing media references within value mappings', () => {
    const promptTemplate = 'Character is holding @{text:weapon}'
    const testInputs: TestInputState = { weapon: 'hammer' }
    const variables: PresetVariable[] = [
      {
        id: '550e8400-e29b-41d4-a716-446655440007',
        name: 'weapon',
        type: 'text',
        defaultValue: 'sword',
        valueMap: [
          { value: 'hammer', text: 'They should be holding @{ref:hammer}' },
        ],
      },
    ]
    const mediaRegistry: PresetMediaEntry[] = []

    const result = resolvePrompt(
      promptTemplate,
      testInputs,
      variables,
      mediaRegistry,
    )

    expect(result.text).toBe(
      'Character is holding They should be holding <hammer> (missing)',
    )
    expect(result.hasUnresolved).toBe(true)
    expect(result.unresolvedRefs).toEqual([{ type: 'ref', name: 'hammer' }])
  })

  it('should resolve input references within value mappings', () => {
    const promptTemplate = 'Using style @{text:artStyle}'
    const mockMediaRef = {
      mediaAssetId: 'test-asset-id',
      url: 'https://example.com/fantasy.jpg',
      filePath: 'uploads/fantasy.jpg',
      displayName: 'Test Media',
    }
    const testInputs: TestInputState = {
      artStyle: 'fantasy',
      fantasyRef: mockMediaRef,
    }
    const variables: PresetVariable[] = [
      {
        id: '550e8400-e29b-41d4-a716-446655440008',
        name: 'artStyle',
        type: 'text',
        defaultValue: 'realistic',
        valueMap: [
          {
            value: 'fantasy',
            text: 'Use @{input:fantasyRef} as the reference',
          },
        ],
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440009',
        name: 'fantasyRef',
        type: 'image',
      },
    ]
    const mediaRegistry: PresetMediaEntry[] = []

    const result = resolvePrompt(
      promptTemplate,
      testInputs,
      variables,
      mediaRegistry,
    )

    expect(result.text).toBe('Using style Use <fantasyRef> as the reference')
    expect(result.hasUnresolved).toBe(false)
  })
})

describe('extractMediaReferences', () => {
  it('should extract image input references', () => {
    const promptTemplate = 'Photo: @{input:userPhoto}'
    const mockMediaRef = {
      mediaAssetId: 'test-asset-id',
      url: 'https://example.com/test.jpg',
      filePath: 'uploads/test.jpg',
      displayName: 'Test Media',
    }
    const testInputs: TestInputState = { userPhoto: mockMediaRef }
    const variables: PresetVariable[] = []
    const mediaRegistry: PresetMediaEntry[] = []

    const result = extractMediaReferences(
      promptTemplate,
      testInputs,
      variables,
      mediaRegistry,
    )

    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('userPhoto')
    expect(result[0].source).toBe('test')
    expect(result[0].type).toBe('input')
    expect(result[0].url).toBe('https://example.com/test.jpg')
  })

  it('should extract media registry references', () => {
    const promptTemplate = 'Reference: @{ref:styleRef}'
    const testInputs: TestInputState = {}
    const variables: PresetVariable[] = []
    const mediaRegistry: PresetMediaEntry[] = [
      {
        name: 'styleRef',
        url: 'https://example.com/image.jpg',
        mediaAssetId: 'asset-1',
        filePath: 'uploads/styleRef.jpg',
        displayName: 'Test Media',
      },
    ]

    const result = extractMediaReferences(
      promptTemplate,
      testInputs,
      variables,
      mediaRegistry,
    )

    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('styleRef')
    expect(result[0].url).toBe('https://example.com/image.jpg')
    expect(result[0].source).toBe('registry')
    expect(result[0].type).toBe('ref')
  })

  it('should handle missing media gracefully', () => {
    const promptTemplate = '@{input:missing} @{ref:alsoMissing}'
    const testInputs: TestInputState = { missing: null }
    const variables: PresetVariable[] = []
    const mediaRegistry: PresetMediaEntry[] = []

    const result = extractMediaReferences(
      promptTemplate,
      testInputs,
      variables,
      mediaRegistry,
    )

    expect(result).toHaveLength(0)
  })

  it('should extract multiple media references', () => {
    const promptTemplate = '@{input:photo1} @{ref:ref1} @{input:photo2}'
    const mockMediaRef1 = {
      mediaAssetId: 'test-asset-id-1',
      url: 'https://example.com/test1.jpg',
      filePath: 'uploads/test1.jpg',
      displayName: 'Test Media',
    }
    const mockMediaRef2 = {
      mediaAssetId: 'test-asset-id-2',
      url: 'https://example.com/test2.jpg',
      filePath: 'uploads/test2.jpg',
      displayName: 'Test Media',
    }
    const testInputs: TestInputState = {
      photo1: mockMediaRef1,
      photo2: mockMediaRef2,
    }
    const variables: PresetVariable[] = []
    const mediaRegistry: PresetMediaEntry[] = [
      {
        name: 'ref1',
        url: 'https://example.com/ref1.jpg',
        mediaAssetId: 'asset-1',
        filePath: 'uploads/ref1.jpg',
        displayName: 'Test Media',
      },
    ]

    const result = extractMediaReferences(
      promptTemplate,
      testInputs,
      variables,
      mediaRegistry,
    )

    expect(result).toHaveLength(3)
  })
})

describe('parseReferences', () => {
  it('should parse all reference types', () => {
    const promptTemplate = '@{text:name} @{input:photo} @{ref:styleRef}'

    const result = parseReferences(promptTemplate)

    expect(result).toEqual([
      { type: 'text', name: 'name' },
      { type: 'input', name: 'photo' },
      { type: 'ref', name: 'styleRef' },
    ])
  })

  it('should handle empty template', () => {
    const result = parseReferences('')
    expect(result).toEqual([])
  })

  it('should handle template with no references', () => {
    const result = parseReferences('Just plain text')
    expect(result).toEqual([])
  })
})
