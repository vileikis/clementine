/**
 * Unit Tests: resolvePromptMentions
 *
 * Tests for prompt mention resolution utility.
 * Verifies @{step:stepName} and @{ref:displayName} patterns are resolved correctly.
 */
import { describe, it, expect } from 'vitest'
import { resolvePromptMentions } from '../resolvePromptMentions'
import type { SessionResponse, MediaReference, SessionResponseData } from '@clementine/shared'

// =============================================================================
// Test Fixtures
// =============================================================================

const createResponse = (
  stepId: string,
  stepName: string,
  stepType: string,
  data: SessionResponseData | null,
): SessionResponse => ({
  stepId,
  stepName,
  stepType,
  data,
  createdAt: Date.now(),
  updatedAt: Date.now(),
})

const createMediaRef = (
  displayName: string,
  assetId: string = `asset-${displayName}`,
): MediaReference => ({
  mediaAssetId: assetId,
  url: `https://storage.example.com/${assetId}.jpg`,
  filePath: `media/${assetId}.jpg`,
  displayName,
})

// =============================================================================
// Tests
// =============================================================================

describe('resolvePromptMentions', () => {
  describe('basic text resolution (@{step:...})', () => {
    it('resolves a single step mention', () => {
      const responses: SessionResponse[] = [
        createResponse('step-1', 'userName', 'input.shortText', 'John'),
      ]

      const result = resolvePromptMentions(
        'Hello @{step:userName}!',
        responses,
        [],
      )

      expect(result.text).toBe('Hello John!')
      expect(result.mediaRefs).toHaveLength(0)
    })

    it('resolves multiple step mentions', () => {
      const responses: SessionResponse[] = [
        createResponse('step-1', 'firstName', 'input.shortText', 'John'),
        createResponse('step-2', 'lastName', 'input.shortText', 'Doe'),
      ]

      const result = resolvePromptMentions(
        'Name: @{step:firstName} @{step:lastName}',
        responses,
        [],
      )

      expect(result.text).toBe('Name: John Doe')
    })

    it('preserves unresolved step mentions', () => {
      const responses: SessionResponse[] = []

      const result = resolvePromptMentions(
        'Hello @{step:unknownStep}!',
        responses,
        [],
      )

      expect(result.text).toBe('Hello @{step:unknownStep}!')
    })

    it('handles empty prompt', () => {
      const result = resolvePromptMentions('', [], [])

      expect(result.text).toBe('')
      expect(result.mediaRefs).toHaveLength(0)
    })
  })

  describe('input step types', () => {
    it('resolves input.scale step', () => {
      const responses: SessionResponse[] = [
        createResponse('step-1', 'rating', 'input.scale', '5'),
      ]

      const result = resolvePromptMentions(
        'Rating: @{step:rating}/5',
        responses,
        [],
      )

      expect(result.text).toBe('Rating: 5/5')
    })

    it('resolves input.yesNo step', () => {
      const responses: SessionResponse[] = [
        createResponse('step-1', 'likesFood', 'input.yesNo', 'yes'),
      ]

      const result = resolvePromptMentions(
        'Likes food: @{step:likesFood}',
        responses,
        [],
      )

      expect(result.text).toBe('Likes food: yes')
    })

    it('resolves input.longText step', () => {
      const responses: SessionResponse[] = [
        createResponse('step-1', 'bio', 'input.longText', 'A longer text here.'),
      ]

      const result = resolvePromptMentions(
        'Bio: @{step:bio}',
        responses,
        [],
      )

      expect(result.text).toBe('Bio: A longer text here.')
    })
  })

  describe('multi-select step resolution', () => {
    it('resolves multi-select as comma-separated values', () => {
      const responses: SessionResponse[] = [
        createResponse('step-1', 'colors', 'input.multiSelect', [
          { value: 'red', promptFragment: null, promptMedia: null },
          { value: 'blue', promptFragment: null, promptMedia: null },
          { value: 'green', promptFragment: null, promptMedia: null },
        ]),
      ]

      const result = resolvePromptMentions(
        'Favorite colors: @{step:colors}',
        responses,
        [],
      )

      expect(result.text).toBe('Favorite colors: red, blue, green')
    })

    it('resolves single multi-select option', () => {
      const responses: SessionResponse[] = [
        createResponse('step-1', 'mood', 'input.multiSelect', [
          { value: 'happy', promptFragment: null, promptMedia: null },
        ]),
      ]

      const result = resolvePromptMentions(
        'Mood: @{step:mood}',
        responses,
        [],
      )

      expect(result.text).toBe('Mood: happy')
    })

    it('handles empty multi-select array', () => {
      const responses: SessionResponse[] = [
        createResponse('step-1', 'options', 'input.multiSelect', []),
      ]

      const result = resolvePromptMentions(
        'Selected: @{step:options}',
        responses,
        [],
      )

      expect(result.text).toBe('Selected: ')
    })
  })

  describe('capture step resolution', () => {
    it('resolves capture step with placeholder and collects media', () => {
      const selfieRef = createMediaRef('selfie.jpg', 'selfie-123')
      const responses: SessionResponse[] = [
        createResponse('step-1', 'selfie', 'capture.photo', [selfieRef]),
      ]

      const result = resolvePromptMentions(
        'Transform @{step:selfie} into art',
        responses,
        [],
      )

      expect(result.text).toBe('Transform [IMAGE: selfie] into art')
      expect(result.mediaRefs).toHaveLength(1)
      expect(result.mediaRefs[0]).toEqual(selfieRef)
    })

    it('handles multiple capture media references', () => {
      const photo1 = createMediaRef('photo1.jpg', 'photo-1')
      const photo2 = createMediaRef('photo2.jpg', 'photo-2')
      const responses: SessionResponse[] = [
        createResponse('step-1', 'photos', 'capture.photo', [photo1, photo2]),
      ]

      const result = resolvePromptMentions(
        'Use @{step:photos}',
        responses,
        [],
      )

      expect(result.text).toBe('Use [IMAGE: photos]')
      expect(result.mediaRefs).toHaveLength(2)
    })

    it('handles empty capture media array', () => {
      const responses: SessionResponse[] = [
        createResponse('step-1', 'photo', 'capture.photo', []),
      ]

      const result = resolvePromptMentions(
        'Use @{step:photo}',
        responses,
        [],
      )

      expect(result.text).toBe('Use [IMAGE: photo]')
      expect(result.mediaRefs).toHaveLength(0)
    })
  })

  describe('reference media resolution (@{ref:...})', () => {
    it('resolves reference media mention', () => {
      const refMedia: MediaReference[] = [
        createMediaRef('style-guide.png', 'ref-style'),
      ]

      const result = resolvePromptMentions(
        'Use style from @{ref:style-guide.png}',
        [],
        refMedia,
      )

      expect(result.text).toBe('Use style from [IMAGE: style-guide.png]')
      expect(result.mediaRefs).toHaveLength(1)
    })

    it('resolves multiple reference media mentions', () => {
      const refMedia: MediaReference[] = [
        createMediaRef('style1.png', 'ref-1'),
        createMediaRef('style2.png', 'ref-2'),
      ]

      const result = resolvePromptMentions(
        'Combine @{ref:style1.png} and @{ref:style2.png}',
        [],
        refMedia,
      )

      expect(result.text).toBe('Combine [IMAGE: style1.png] and [IMAGE: style2.png]')
      expect(result.mediaRefs).toHaveLength(2)
    })

    it('preserves unresolved reference mentions', () => {
      const result = resolvePromptMentions(
        'Use @{ref:missing.png}',
        [],
        [],
      )

      expect(result.text).toBe('Use @{ref:missing.png}')
      expect(result.mediaRefs).toHaveLength(0)
    })
  })

  describe('mixed resolution', () => {
    it('resolves both step and ref mentions', () => {
      const selfieRef = createMediaRef('selfie.jpg', 'selfie-123')
      const styleRef = createMediaRef('anime-style.png', 'style-anime')

      const responses: SessionResponse[] = [
        createResponse('step-1', 'name', 'input.shortText', 'Alice'),
        createResponse('step-2', 'selfie', 'capture.photo', [selfieRef]),
      ]

      const result = resolvePromptMentions(
        'Transform @{step:name} using @{step:selfie} in style @{ref:anime-style.png}',
        responses,
        [styleRef],
      )

      expect(result.text).toBe(
        'Transform Alice using [IMAGE: selfie] in style [IMAGE: anime-style.png]',
      )
      expect(result.mediaRefs).toHaveLength(2)
    })
  })

  describe('edge cases', () => {
    it('handles null data gracefully', () => {
      const responses: SessionResponse[] = [
        createResponse('step-1', 'empty', 'input.shortText', null),
      ]

      const result = resolvePromptMentions(
        'Value: @{step:empty}',
        responses,
        [],
      )

      expect(result.text).toBe('Value: ')
    })

    it('handles step name with special characters', () => {
      const responses: SessionResponse[] = [
        createResponse('step-1', 'my-name', 'input.shortText', 'Test'),
      ]

      const result = resolvePromptMentions(
        'Name: @{step:my-name}',
        responses,
        [],
      )

      expect(result.text).toBe('Name: Test')
    })

    it('is case-sensitive for step names', () => {
      const responses: SessionResponse[] = [
        createResponse('step-1', 'userName', 'input.shortText', 'Alice'),
      ]

      const result = resolvePromptMentions(
        '@{step:UserName} vs @{step:userName}',
        responses,
        [],
      )

      // UserName doesn't match (case-sensitive)
      expect(result.text).toBe('@{step:UserName} vs Alice')
    })

    it('does not double-collect duplicate media references', () => {
      const ref = createMediaRef('photo.jpg', 'photo-1')
      const responses: SessionResponse[] = [
        createResponse('step-1', 'photo', 'capture.photo', [ref]),
      ]

      const result = resolvePromptMentions(
        '@{step:photo} and again @{step:photo}',
        responses,
        [],
      )

      // Media should only appear once in the array
      expect(result.text).toBe('[IMAGE: photo] and again [IMAGE: photo]')
      expect(result.mediaRefs).toHaveLength(1)
    })
  })
})
