import { getCurrentSceneAction } from "@/app/actions/events"
import { notFound } from "next/navigation"
import { ModeSelector } from "@/components/organizer/ModeSelector"
import { EffectPicker } from "@/components/organizer/EffectPicker"
import { PromptEditor } from "@/components/organizer/PromptEditor"

interface ScenePageProps {
  params: Promise<{ eventId: string }>
}

export default async function ScenePage({ params }: ScenePageProps) {
  const { eventId } = await params
  const result = await getCurrentSceneAction(eventId)

  if (!result.success || !result.scene) {
    notFound()
  }

  const scene = result.scene

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-xl font-semibold mb-4">Capture Mode</h2>
        <ModeSelector currentMode={scene.mode} eventId={eventId} sceneId={scene.id} />
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">AI Effect</h2>
        <EffectPicker
          currentEffect={scene.effect}
          eventId={eventId}
          sceneId={scene.id}
        />
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">Prompt Configuration</h2>
        <PromptEditor
          currentPrompt={scene.prompt}
          defaultPrompt={scene.defaultPrompt}
          eventId={eventId}
          sceneId={scene.id}
        />
      </section>
    </div>
  )
}
