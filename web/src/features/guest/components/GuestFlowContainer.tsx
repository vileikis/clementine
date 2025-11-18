"use client"

import { useRef, useEffect, useState } from "react"
import { GreetingScreen } from "./GreetingScreen"
import { CaptureButton } from "./CaptureButton"
import { Countdown } from "./Countdown"
import { ResultViewer } from "./ResultViewer"
import { RetakeButton } from "./RetakeButton"
import { ErrorBanner } from "./ErrorBanner"
import { Button } from "@/components/ui/button"
import { useGuestFlow } from "../hooks/useGuestFlow"
import { capturePhoto } from "../lib/capture"
import { getImageUrlAction } from "@/features/events/actions/scenes"

interface GuestFlowContainerProps {
  eventId: string
  eventTitle: string
  showTitleOverlay: boolean
}

/**
 * Container for guest flow state machine
 * Orchestrates the full guest experience from greeting to share
 */
export function GuestFlowContainer({
  eventId,
  eventTitle,
  showTitleOverlay,
}: GuestFlowContainerProps) {
  const { state, dispatch, handleCapture, requestCamera } = useGuestFlow(eventId)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isCounting, setIsCounting] = useState(false)
  const [resultImageUrl, setResultImageUrl] = useState<string | undefined>()

  // Set video stream when ready
  useEffect(() => {
    if (
      (state.step === "ready_to_capture" || state.step === "countdown") &&
      videoRef.current &&
      state.stream
    ) {
      if (videoRef.current.srcObject !== state.stream) {
        videoRef.current.srcObject = state.stream
      }
    }
  }, [state])

  // Fetch result image URL when session is ready
  useEffect(() => {
    if (
      (state.step === "review_ready" || state.step === "share") &&
      state.session.resultImagePath &&
      !resultImageUrl
    ) {
      console.log("[GuestFlow] Fetching result image URL:", state.session.resultImagePath)
      getImageUrlAction(state.session.resultImagePath).then((result) => {
        if (result.success) {
          console.log("[GuestFlow] Result image URL fetched:", result.url)
          setResultImageUrl(result.url)
        } else {
          console.error("[GuestFlow] Failed to fetch result URL:", result.error)
        }
      })
    } else if (state.step === "review_ready" || state.step === "share") {
      console.log("[GuestFlow] Session state:", {
        step: state.step,
        hasResultImagePath: !!state.session.resultImagePath,
        resultImagePath: state.session.resultImagePath,
        hasResultUrl: !!resultImageUrl,
      })
    }
  }, [state, resultImageUrl])

  // Greeting screen
  if (state.step === "greeting") {
    return (
      <GreetingScreen
        eventTitle={eventTitle}
        showTitleOverlay={showTitleOverlay}
        onGetStarted={requestCamera}
      />
    )
  }

  // Camera permission error
  if (state.step === "camera_permission_error") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black px-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="text-6xl">📷</div>
          <h2 className="text-2xl font-bold text-white">Camera Access Required</h2>
          <p className="text-gray-300">
            Camera permission was denied. Please allow camera access to continue.
          </p>
          <div className="text-sm text-gray-400 space-y-2">
            <p>To use this photobooth, please:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Check your browser settings</li>
              <li>Allow camera permission for this site</li>
              <li>Reload the page</li>
            </ol>
          </div>
        </div>
      </div>
    )
  }

  // Ready to capture - show camera with capture button
  if (state.step === "ready_to_capture" || state.step === "countdown") {
    const handleStartCountdown = () => {
      setIsCounting(true)
    }

    const handleCountdownComplete = async () => {
      setIsCounting(false)

      if (!videoRef.current) {
        return
      }

      try {
        const blob = await capturePhoto(videoRef.current)
        handleCapture(blob)
      } catch (error) {
        console.error("Capture failed:", error)
      }
    }

    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center relative">
        {isCounting && <Countdown onComplete={handleCountdownComplete} />}
        <div className="relative w-full h-screen">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-cover"
            style={{ transform: "scaleX(-1)" }}
          />
        </div>
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-40">
          <CaptureButton
            videoRef={videoRef}
            onCapture={handleCapture}
            onStartCountdown={handleStartCountdown}
            disabled={isCounting}
            isCounting={isCounting}
          />
        </div>
      </div>
    )
  }

  // Uploading
  if (state.step === "uploading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center space-y-4">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-white border-r-transparent"></div>
          <p className="text-white text-lg">Uploading your photo...</p>
        </div>
      </div>
    )
  }

  // Transforming - show loading state via ResultViewer
  if (state.step === "transforming") {
    // Create a minimal session object for loading state
    const transformingSession = {
      id: state.sessionId,
      eventId,
      sceneId: "",
      state: "transforming" as const,
      createdAt: 0,
      updatedAt: 0,
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <ResultViewer session={transformingSession} />
      </div>
    )
  }

  // Review ready - show result with retake and next buttons
  if (state.step === "review_ready") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 py-8 gap-6">
        <ResultViewer
          session={state.session}
          resultImageUrl={resultImageUrl}
        />
        <div className="flex gap-4 w-full max-w-md">
          <RetakeButton
            onRetake={() => {
              dispatch({ type: "RETAKE" })
              // Auto-request camera after retake
              requestCamera()
            }}
          />
          <Button
            onClick={() => dispatch({ type: "NEXT" })}
            className="flex-1"
            style={{ backgroundColor: "var(--brand, #0EA5E9)" }}
          >
            Next
          </Button>
        </div>
      </div>
    )
  }

  // Share
  if (state.step === "share") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black px-4">
        <div className="text-center space-y-6">
          <h2 className="text-2xl font-bold text-white">Share Your Photo</h2>
          <p className="text-gray-400">Session ID: {state.session.id}</p>
          <button
            onClick={() => dispatch({ type: "CLOSE" })}
            className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
          >
            Close
          </button>
        </div>
      </div>
    )
  }

  // Error - show error banner with retry option
  if (state.step === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <ErrorBanner
          message={state.message}
          onClose={() => dispatch({ type: "CLOSE" })}
        />
      </div>
    )
  }

  return null
}
