/**
 * PromptInput Component
 *
 * Multiline textarea for AI image prompt input.
 */

export interface PromptInputProps {
  /** Current prompt value */
  value: string
  /** Callback when prompt changes */
  onChange: (value: string) => void
  /** Whether the input is disabled */
  disabled?: boolean
}

/**
 * PromptInput - Multiline textarea for prompt
 */
export function PromptInput({ value, onChange, disabled }: PromptInputProps) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      placeholder="Enter your prompt... Use @{step:name} for step references and @{ref:mediaAssetId} for media references."
      className="field-sizing-content min-h-24 w-full resize-none border-0 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
      aria-label="AI image generation prompt"
    />
  )
}
