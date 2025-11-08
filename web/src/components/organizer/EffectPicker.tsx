"use client"

import { useState } from "react"
import { Sparkles, Users } from "lucide-react"
import { cn } from "@/lib/utils"
import { updateSceneAction } from "@/app/actions/scenes"
import type { EffectType } from "@/lib/types/firestore"

interface EffectPickerProps {
  currentEffect: EffectType
  eventId: string
  sceneId: string
}

const effects = [
  {
    value: "background_swap" as const,
    label: "Background Swap",
    icon: Sparkles,
    description: "Replace background with AI-generated scene",
    example: "Transform to beach, studio, or custom backdrop",
    defaultPrompt: "Apply clean studio background with brand color accents.",
  },
  {
    value: "deep_fake" as const,
    label: "Deep Fake",
    icon: Users,
    description: "Face swap with reference image",
    example: "Swap face with celebrity, character, or custom reference",
    defaultPrompt: "Swap the face in the photo with the reference image face, maintaining natural lighting and expressions.",
  },
]

export function EffectPicker({
  currentEffect,
  eventId,
  sceneId,
}: EffectPickerProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [selectedEffect, setSelectedEffect] = useState(currentEffect)

  const handleEffectChange = async (effect: EffectType) => {
    if (effect === selectedEffect || isLoading) return

    setIsLoading(true)
    setSelectedEffect(effect)

    // Always apply the default prompt for the selected effect
    const selectedEffectConfig = effects.find((e) => e.value === effect)
    const defaultPrompt = selectedEffectConfig?.defaultPrompt || ""

    try {
      const result = await updateSceneAction(eventId, sceneId, {
        effect,
        prompt: defaultPrompt,
        defaultPrompt: defaultPrompt,
      })
      if (!result.success) {
        // Revert on error
        setSelectedEffect(currentEffect)
        console.error("Failed to update effect:", result.error)
      }
    } catch (error) {
      setSelectedEffect(currentEffect)
      console.error("Failed to update effect:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {effects.map((effect) => {
        const Icon = effect.icon
        const isActive = selectedEffect === effect.value

        return (
          <button
            key={effect.value}
            onClick={() => handleEffectChange(effect.value)}
            disabled={isLoading}
            className={cn(
              "relative flex flex-col gap-4 p-6 rounded-lg border-2 transition-all text-left",
              isActive
                ? "border-foreground bg-accent"
                : "border-border bg-background hover:border-muted-foreground",
              isLoading && "opacity-50 cursor-not-allowed"
            )}
          >
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  "p-3 rounded-lg",
                  isActive ? "bg-foreground text-background" : "bg-muted"
                )}
              >
                <Icon className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{effect.label}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {effect.description}
                </p>
              </div>
              {isActive && (
                <div className="w-3 h-3 bg-foreground rounded-full" />
              )}
            </div>
            <div className="text-sm text-muted-foreground pl-14">
              <span className="font-medium">Example: </span>
              {effect.example}
            </div>
          </button>
        )
      })}
    </div>
  )
}
