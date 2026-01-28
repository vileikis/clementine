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
      { name: 'userName', type: 'text', defaultValue: '' },
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
      { name: 'userName', type: 'text', defaultValue: 'Guest' },
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
    const mockFile = new File([''], 'test.jpg', { type: 'image/jpeg' })
    const testInputs: TestInputState = { userPhoto: mockFile }
    const variables: PresetVariable[] = [
      { name: 'userPhoto', type: 'image', defaultValue: '' },
    ]
    const mediaRegistry: PresetMediaEntry[] = []

    const result = resolvePrompt(
      promptTemplate,
      testInputs,
      variables,
      mediaRegistry,
    )

    expect(result.text).toBe('Photo: [Image: userPhoto]')
  })

  it('should indicate missing image when not uploaded', () => {
    const promptTemplate = 'Photo: @{input:userPhoto}'
    const testInputs: TestInputState = { userPhoto: null }
    const variables: PresetVariable[] = [
      { name: 'userPhoto', type: 'image', defaultValue: '' },
    ]
    const mediaRegistry: PresetMediaEntry[] = []

    const result = resolvePrompt(
      promptTemplate,
      testInputs,
      variables,
      mediaRegistry,
    )

    expect(result.text).toBe('Photo: [Image: userPhoto (missing)]')
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
      },
    ]

    const result = resolvePrompt(
      promptTemplate,
      testInputs,
      variables,
      mediaRegistry,
    )

    expect(result.text).toBe('Reference: [Media: styleRef]')
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

    expect(result.text).toBe('Reference: [Media: missingRef (missing)]')
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
})

describe('extractMediaReferences', () => {
  it('should extract image input references', () => {
    const promptTemplate = 'Photo: @{input:userPhoto}'
    const mockFile = new File([''], 'test.jpg', { type: 'image/jpeg' })
    const testInputs: TestInputState = { userPhoto: mockFile }
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
    expect(result[0].url).toContain('blob:')
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
    const mockFile1 = new File([''], 'test1.jpg', { type: 'image/jpeg' })
    const mockFile2 = new File([''], 'test2.jpg', { type: 'image/jpeg' })
    const testInputs: TestInputState = { photo1: mockFile1, photo2: mockFile2 }
    const variables: PresetVariable[] = []
    const mediaRegistry: PresetMediaEntry[] = [
      {
        name: 'ref1',
        url: 'https://example.com/ref1.jpg',
        mediaAssetId: 'asset-1',
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
