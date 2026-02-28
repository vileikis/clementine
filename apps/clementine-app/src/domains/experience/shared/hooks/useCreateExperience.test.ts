/**
 * useCreateExperience Hook Tests
 *
 * Tests that buildDefaultDraft produces correct discriminated union
 * config variants for each experience type.
 *
 * Note: Full integration testing of the mutation requires Firebase emulators.
 *
 * @see specs/083-config-discriminated-union
 */
import { describe, expect, it } from 'vitest'
import { buildDefaultDraft } from './useCreateExperience'
import type { ExperienceConfig } from '@clementine/shared'

/** Cast WithFieldValue<ExperienceConfig> to plain ExperienceConfig for assertions */
function getDraft(type: Parameters<typeof buildDefaultDraft>[0]) {
  return buildDefaultDraft(type) as ExperienceConfig
}

describe('buildDefaultDraft', () => {
  it('ai.image type returns discriminated variant with default aiImage config', () => {
    const draft = getDraft('ai.image')
    expect(draft.type).toBe('ai.image')
    if (draft.type !== 'ai.image') throw new Error('narrowing')
    expect(draft.aiImage.task).toBe('text-to-image')
    expect(draft.aiImage.imageGeneration.model).toBe('gemini-2.5-flash-image')
    expect(draft.aiImage.imageGeneration.prompt).toBe('')
    expect(draft.aiImage.imageGeneration.refMedia).toEqual([])
    expect(draft.aiImage.aspectRatio).toBe('1:1')
    expect(draft.aiImage.captureStepId).toBeNull()
  })

  it('ai.image variant does not include other type configs', () => {
    const draft = getDraft('ai.image')
    expect(draft.type).toBe('ai.image')
    expect('photo' in draft).toBe(false)
    expect('gif' in draft).toBe(false)
    expect('video' in draft).toBe(false)
    expect('aiVideo' in draft).toBe(false)
  })

  it('ai.video type returns discriminated variant with default aiVideo config', () => {
    const draft = getDraft('ai.video')
    expect(draft.type).toBe('ai.video')
    if (draft.type !== 'ai.video') throw new Error('narrowing')
    expect(draft.aiVideo.task).toBe('image-to-video')
    expect(draft.aiVideo.videoGeneration.prompt).toBe('')
    expect(draft.aiVideo.aspectRatio).toBe('9:16')
  })

  it('ai.video variant does not include other type configs', () => {
    const draft = getDraft('ai.video')
    expect(draft.type).toBe('ai.video')
    expect('photo' in draft).toBe(false)
    expect('gif' in draft).toBe(false)
    expect('video' in draft).toBe(false)
    expect('aiImage' in draft).toBe(false)
  })

  it('photo type returns discriminated variant with default photo config', () => {
    const draft = getDraft('photo')
    expect(draft.type).toBe('photo')
    if (draft.type !== 'photo') throw new Error('narrowing')
    expect(draft.photo.aspectRatio).toBe('1:1')
    expect(draft.photo.captureStepId).toBe('')
  })

  it('photo variant does not include other type configs', () => {
    const draft = getDraft('photo')
    expect(draft.type).toBe('photo')
    expect('aiImage' in draft).toBe(false)
    expect('aiVideo' in draft).toBe(false)
    expect('gif' in draft).toBe(false)
    expect('video' in draft).toBe(false)
  })

  it('survey type returns variant with no type-specific config', () => {
    const draft = getDraft('survey')
    expect(draft.type).toBe('survey')
    expect('photo' in draft).toBe(false)
    expect('gif' in draft).toBe(false)
    expect('video' in draft).toBe(false)
    expect('aiImage' in draft).toBe(false)
    expect('aiVideo' in draft).toBe(false)
  })

  it('all types initialize with empty steps array', () => {
    for (const type of ['ai.image', 'ai.video', 'photo', 'survey'] as const) {
      const draft = getDraft(type)
      expect(draft.steps).toEqual([])
    }
  })
})
