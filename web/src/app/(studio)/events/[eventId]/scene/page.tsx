import { getCurrentSceneAction } from "@/lib/actions/events"
import { notFound } from "next/navigation"
import { ModeSelector } from "@/components/organizer/ModeSelector"
import { PromptEditor } from "@/components/organizer/PromptEditor"
import { RefImageUploader } from "@/components/organizer/RefImageUploader"

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
        <h2 className="text-xl font-semibold mb-4">AI Transformation Prompt</h2>
        <PromptEditor
          currentPrompt={scene.prompt}
          eventId={eventId}
          sceneId={scene.id}
        />
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">Reference Image (Optional)</h2>
        <RefImageUploader
          eventId={eventId}
          sceneId={scene.id}
          currentImagePath={scene.referenceImagePath}
        />
      </section>
    </div>
  )
}
