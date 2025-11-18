"use client"

import { Camera, Video, Image as ImageIcon, Repeat } from "lucide-react"
import { cn } from "@/lib/utils"
import type { CaptureMode } from "@/lib/types/firestore"

interface ModeSelectorProps {
  currentMode: CaptureMode
  eventId: string
  sceneId: string
}

const modes = [
  {
    value: "photo" as const,
    label: "Photo",
    icon: Camera,
    enabled: true,
    description: "Single photo capture",
  },
  {
    value: "video" as const,
    label: "Video",
    icon: Video,
    enabled: false,
    description: "Short video recording",
  },
  {
    value: "gif" as const,
    label: "GIF",
    icon: ImageIcon,
    enabled: false,
    description: "Animated GIF",
  },
  {
    value: "boomerang" as const,
    label: "Boomerang",
    icon: Repeat,
    enabled: false,
    description: "Loop video effect",
  },
]

export function ModeSelector({
  currentMode,
}: ModeSelectorProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {modes.map((mode) => {
        const Icon = mode.icon
        const isActive = currentMode === mode.value
        const isDisabled = !mode.enabled

        return (
          <button
            key={mode.value}
            disabled={isDisabled}
            className={cn(
              "relative flex flex-col items-center gap-3 p-6 rounded-lg border-2 transition-all",
              isActive && mode.enabled
                ? "border-foreground bg-accent"
                : "border-border bg-background",
              !isDisabled && !isActive && "hover:border-muted-foreground",
              isDisabled && "opacity-50 cursor-not-allowed"
            )}
          >
            <Icon className="w-8 h-8" />
            <div className="text-center">
              <div className="font-medium">{mode.label}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {mode.description}
              </div>
            </div>
            {isDisabled && (
              <span className="absolute top-2 right-2 text-xs px-2 py-1 bg-muted rounded">
                Coming Soon
              </span>
            )}
            {isActive && (
              <div className="absolute top-2 left-2 w-2 h-2 bg-foreground rounded-full" />
            )}
          </button>
        )
      })}
    </div>
  )
}
