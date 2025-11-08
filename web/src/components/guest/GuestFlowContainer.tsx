"use client"

import { useState } from "react"
import { GreetingScreen } from "./GreetingScreen"
import { CameraView } from "./CameraView"

interface GuestFlowContainerProps {
  eventId: string
  eventTitle: string
  showTitleOverlay: boolean
}

/**
 * Container for guest flow state machine
 * Currently implements basic greeting -> camera flow
 * Will be expanded with full state machine in future tasks
 */
export function GuestFlowContainer({
  eventTitle,
  showTitleOverlay,
}: GuestFlowContainerProps) {
  const [step, setStep] = useState<"greeting" | "camera">("greeting")

  const handleGetStarted = () => {
    setStep("camera")
  }

  if (step === "greeting") {
    return (
      <GreetingScreen
        eventTitle={eventTitle}
        showTitleOverlay={showTitleOverlay}
        onGetStarted={handleGetStarted}
      />
    )
  }

  if (step === "camera") {
    return <CameraView onError={(error) => console.error("Camera error:", error)} />
  }

  return null
}
