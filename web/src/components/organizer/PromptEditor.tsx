"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { updateSceneAction } from "@/app/actions/scenes"

interface PromptEditorProps {
  currentPrompt: string | null
  eventId: string
  sceneId: string
}

const MAX_CHARS = 600

export function PromptEditor({
  currentPrompt,
  eventId,
  sceneId,
}: PromptEditorProps) {
  const [prompt, setPrompt] = useState(currentPrompt || "")
  const [isLoading, setIsLoading] = useState(false)
  const [isSaved, setIsSaved] = useState(true)
  const charCount = prompt.length
  const isOverLimit = charCount > MAX_CHARS

  // Track unsaved changes
  useEffect(() => {
    setIsSaved(prompt === currentPrompt)
  }, [prompt, currentPrompt])

  const handleSave = async () => {
    if (isLoading || prompt === currentPrompt || isOverLimit) return

    setIsLoading(true)

    try {
      const result = await updateSceneAction(eventId, sceneId, { prompt })
      if (result.success) {
        setIsSaved(true)
      } else {
        console.error("Failed to save prompt:", result.error)
      }
    } catch (error) {
      console.error("Failed to save prompt:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <label
            htmlFor="prompt"
            className="block text-sm font-medium mb-2"
          >
            AI Generation Prompt
          </label>
          <p className="text-sm text-muted-foreground mb-3">
            Describe how the AI should transform the photo. Be specific about
            style, lighting, and details. Leave empty to skip AI transformation (passthrough mode).
          </p>
        </div>
      </div>

      <div className="relative">
        <textarea
          id="prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onBlur={handleSave}
          disabled={isLoading}
          rows={6}
          className={cn(
            "w-full px-4 py-3 rounded-lg border-2 transition-colors resize-none",
            "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-foreground",
            isOverLimit
              ? "border-red-500 focus:border-red-500"
              : "border-border",
            isLoading && "opacity-50 cursor-not-allowed"
          )}
          placeholder="Enter your AI generation prompt..."
        />
        <div className="absolute bottom-3 right-3 flex items-center gap-3">
          {!isSaved && !isLoading && (
            <span className="text-xs text-muted-foreground">Unsaved</span>
          )}
          {isLoading && (
            <span className="text-xs text-muted-foreground">Saving...</span>
          )}
          <span
            className={cn(
              "text-xs tabular-nums",
              isOverLimit ? "text-red-500 font-medium" : "text-muted-foreground"
            )}
          >
            {charCount}/{MAX_CHARS}
          </span>
        </div>
      </div>

      {isOverLimit && (
        <p className="text-sm text-red-500">
          Prompt exceeds maximum length. Please shorten to {MAX_CHARS}{" "}
          characters or less.
        </p>
      )}

      {isSaved && !isLoading && prompt !== currentPrompt && (
        <p className="text-sm text-green-600">✓ Prompt saved successfully</p>
      )}
    </div>
  )
}
