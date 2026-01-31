/**
 * PromptComposer Component
 *
 * Unified bordered container for AI Image node configuration.
 * Contains prompt input, model/aspect ratio selectors, and reference media.
 */
import { useEffect, useState } from 'react'

import { updateNodePrompt } from '../../lib/transform-operations'
import { ControlRow } from './ControlRow'
import { PromptInput } from './PromptInput'
import type { AIImageNode, TransformConfig } from '@clementine/shared'
import { useDebounce } from '@/shared/utils/useDebounce'


export interface PromptComposerProps {
  /** AI Image node being edited */
  node: AIImageNode
  /** Current transform configuration */
  transform: TransformConfig
  /** Callback to update transform configuration */
  onUpdate: (transform: TransformConfig) => void
  /** Whether the composer is disabled */
  disabled?: boolean
}

/** Debounce delay for prompt changes (ms) */
const PROMPT_DEBOUNCE_DELAY = 2000

/**
 * PromptComposer - Main container for AI Image node settings
 */
export function PromptComposer({
  node,
  transform,
  onUpdate,
  disabled,
}: PromptComposerProps) {
  const { config } = node

  // Local state for prompt to enable debouncing
  const [localPrompt, setLocalPrompt] = useState(config.prompt)

  // Debounce the local prompt value
  const debouncedPrompt = useDebounce(localPrompt, PROMPT_DEBOUNCE_DELAY)

  // Update transform when debounced prompt changes
  useEffect(() => {
    // Only update if the debounced value differs from the config
    if (debouncedPrompt !== config.prompt) {
      const newTransform = updateNodePrompt(transform, node.id, debouncedPrompt)
      onUpdate(newTransform)
    }
  }, [debouncedPrompt])

  // Sync local prompt with config when it changes externally
  useEffect(() => {
    if (config.prompt !== localPrompt) {
      setLocalPrompt(config.prompt)
    }
  }, [config.prompt])

  return (
    <div className="flex flex-col overflow-hidden rounded-lg border">
      {/* Prompt Input */}
      <PromptInput
        value={localPrompt}
        onChange={setLocalPrompt}
        disabled={disabled}
      />

      {/* Control Row */}
      <ControlRow
        node={node}
        transform={transform}
        onUpdate={onUpdate}
        disabled={disabled}
      />
    </div>
  )
}
