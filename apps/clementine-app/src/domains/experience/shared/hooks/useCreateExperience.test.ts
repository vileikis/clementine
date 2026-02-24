/**
 * useCreateExperience Hook Tests
 *
 * Tests that buildDefaultDraft produces correct defaults for each experience type.
 *
 * Note: Full integration testing of the mutation requires Firebase emulators.
 */
import { describe, expect, it } from 'vitest'
import { buildDefaultDraft } from './useCreateExperience'
import type { ExperienceConfig } from '@clementine/shared'

/** Cast WithFieldValue<ExperienceConfig> to plain ExperienceConfig for assertions */
function getDraft(type: Parameters<typeof buildDefaultDraft>[0]) {
  return buildDefaultDraft(type) as ExperienceConfig
}

describe('buildDefaultDraft', () => {
  it('ai.image type initializes with default aiImage config', () => {
    const draft = getDraft('ai.image')
    expect(draft.aiImage).not.toBeNull()
    expect(draft.aiImage!.task).toBe('text-to-image')
    expect(draft.aiImage!.imageGeneration.model).toBe('gemini-2.5-flash-image')
    expect(draft.aiImage!.imageGeneration.prompt).toBe('')
    expect(draft.aiImage!.imageGeneration.refMedia).toEqual([])
    expect(draft.aiImage!.aspectRatio).toBe('1:1')
    expect(draft.aiImage!.captureStepId).toBeNull()
  })

  it('ai.image type leaves other configs null', () => {
    const draft = getDraft('ai.image')
    expect(draft.photo).toBeNull()
    expect(draft.gif).toBeNull()
    expect(draft.video).toBeNull()
    expect(draft.aiVideo).toBeNull()
  })

  it('ai.video type initializes with default aiVideo config', () => {
    const draft = getDraft('ai.video')
    expect(draft.aiVideo).not.toBeNull()
    expect(draft.aiVideo!.task).toBe('image-to-video')
    expect(draft.aiVideo!.videoGeneration.prompt).toBe('')
    expect(draft.aiVideo!.aspectRatio).toBe('9:16')
  })

  it('ai.video type leaves other configs null', () => {
    const draft = getDraft('ai.video')
    expect(draft.photo).toBeNull()
    expect(draft.gif).toBeNull()
    expect(draft.video).toBeNull()
    expect(draft.aiImage).toBeNull()
  })

  it('photo type initializes with default photo config', () => {
    const draft = getDraft('photo')
    expect(draft.photo).not.toBeNull()
    expect(draft.photo!.aspectRatio).toBe('1:1')
    expect(draft.photo!.captureStepId).toBe('')
  })

  it('photo type leaves other configs null', () => {
    const draft = getDraft('photo')
    expect(draft.aiImage).toBeNull()
    expect(draft.aiVideo).toBeNull()
    expect(draft.gif).toBeNull()
    expect(draft.video).toBeNull()
  })

  it('survey type creates draft with all null config fields', () => {
    const draft = getDraft('survey')
    expect(draft.photo).toBeNull()
    expect(draft.gif).toBeNull()
    expect(draft.video).toBeNull()
    expect(draft.aiImage).toBeNull()
    expect(draft.aiVideo).toBeNull()
  })

  it('all types initialize with empty steps array', () => {
    for (const type of ['ai.image', 'ai.video', 'photo', 'survey'] as const) {
      const draft = getDraft(type)
      expect(draft.steps).toEqual([])
    }
  })
})
