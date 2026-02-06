/**
 * InitializePlugin - Load initial prompt value into Lexical editor
 *
 * Deserializes the initial prompt value (with @{step:name} and @{ref:name} syntax)
 * and loads it into the editor on mount only.
 *
 * This plugin only initializes once. For external value changes (like parent
 * resetting the prompt), the LexicalPromptInput component should remount
 * with a new key.
 */
import { useEffect, useRef } from 'react'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { deserializeFromPlainText } from '../utils/serialization'
import type { MediaOption, StepOption } from '../utils/types'

export interface InitializePluginProps {
  /** Initial prompt value with mention syntax */
  value: string
  /** Available steps for mention resolution */
  steps: StepOption[]
  /** Available media for mention resolution */
  media: MediaOption[]
}

/**
 * InitializePlugin
 *
 * Loads the initial prompt value into the editor on mount only.
 * Does not re-initialize on subsequent value changes to avoid cursor issues.
 */
export function InitializePlugin({
  value,
  steps,
  media,
}: InitializePluginProps): null {
  const [editor] = useLexicalComposerContext()
  const isInitialized = useRef(false)

  // Capture initial values in refs to avoid dependency issues
  const initialValueRef = useRef(value)
  const initialStepsRef = useRef(steps)
  const initialMediaRef = useRef(media)

  useEffect(() => {
    // Only initialize once on mount
    if (isInitialized.current) {
      return
    }
    isInitialized.current = true

    const initialValue = initialValueRef.current
    if (initialValue) {
      deserializeFromPlainText(
        editor,
        initialValue,
        initialStepsRef.current,
        initialMediaRef.current,
      )
    }
  }, [editor])

  return null
}
