/**
 * MentionValidationPlugin - Validate mentions against current steps/media
 *
 * Monitors the editor for mention nodes and validates them against the current
 * available steps and media. If a mention references a name that no longer
 * exists (e.g., step was renamed or deleted), the mention is marked as invalid.
 *
 * This plugin runs validation:
 * - On mount (initial validation)
 * - When steps or media props change
 * - Uses a debounced update (100ms) to batch validation
 *
 * Features:
 * - Validates StepMentionNode against available steps
 * - Validates MediaMentionNode against available media
 * - Marks invalid mentions with red styling and strikethrough
 * - Non-destructive: preserves invalid mentions for user to fix
 */
import { useEffect, useRef } from 'react'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $getRoot, $isParagraphNode } from 'lexical'
import { $isStepMentionNode } from '../nodes/StepMentionNode'
import { $isMediaMentionNode } from '../nodes/MediaMentionNode'
import type { StepMentionNode } from '../nodes/StepMentionNode'
import type { MediaMentionNode } from '../nodes/MediaMentionNode'
import type { MediaOption, StepOption } from '../utils/types'

/** Debounce delay for validation (ms) */
const VALIDATION_DEBOUNCE_MS = 100

export interface MentionValidationPluginProps {
  /** Available steps for validation */
  steps: StepOption[]
  /** Available media for validation */
  media: MediaOption[]
}

/**
 * MentionValidationPlugin
 *
 * Validates mention nodes against current steps and media.
 * Marks mentions as invalid if their referenced name no longer exists.
 */
export function MentionValidationPlugin({
  steps,
  media,
}: MentionValidationPluginProps): null {
  const [editor] = useLexicalComposerContext()
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    // Clear any pending validation
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Debounce validation to batch rapid changes
    timeoutRef.current = setTimeout(() => {
      editor.update(() => {
        const root = $getRoot()
        if (!root) return

        // Create sets for O(1) lookup
        const stepNames = new Set(steps.map((s) => s.name))
        const mediaNames = new Set(media.map((m) => m.name))

        // Collect mention nodes by traversing the tree
        const stepMentions: StepMentionNode[] = []
        const mediaMentions: MediaMentionNode[] = []

        for (const paragraph of root.getChildren()) {
          if (!$isParagraphNode(paragraph)) continue

          for (const child of paragraph.getChildren()) {
            if ($isStepMentionNode(child)) {
              stepMentions.push(child)
            } else if ($isMediaMentionNode(child)) {
              mediaMentions.push(child)
            }
          }
        }

        // Validate all StepMentionNodes
        for (const mention of stepMentions) {
          const stepName = mention.getStepName()
          const isValid = stepNames.has(stepName)
          const wasInvalid = mention.getIsInvalid()

          // Only update if validity changed
          if (isValid && wasInvalid) {
            mention.setInvalid(false)
          } else if (!isValid && !wasInvalid) {
            mention.setInvalid(true)
          }
        }

        // Validate all MediaMentionNodes
        for (const mention of mediaMentions) {
          const mediaName = mention.getMediaName()
          const isValid = mediaNames.has(mediaName)
          const wasInvalid = mention.getIsInvalid()

          // Only update if validity changed
          if (isValid && wasInvalid) {
            mention.setInvalid(false)
          } else if (!isValid && !wasInvalid) {
            mention.setInvalid(true)
          }
        }
      })
    }, VALIDATION_DEBOUNCE_MS)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [editor, steps, media])

  return null
}
