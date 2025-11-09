"use client"

import { useRef, useEffect } from "react"
import { GreetingScreen } from "./GreetingScreen"
import { CaptureButton } from "./CaptureButton"
import { useGuestFlow } from "@/hooks/useGuestFlow"

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
  const { state, dispatch, handleCapture } = useGuestFlow(eventId)
  const videoRef = useRef<HTMLVideoElement>(null)

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

  // Greeting screen
  if (state.step === "greeting") {
    return (
      <GreetingScreen
        eventTitle={eventTitle}
        showTitleOverlay={showTitleOverlay}
        onGetStarted={() => {
          // Camera permission request happens automatically in useGuestFlow
        }}
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
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center relative">
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
            disabled={state.step === "countdown"}
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

  // Transforming
  if (state.step === "transforming") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center space-y-4">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-r-transparent"></div>
          <p className="text-white text-lg">Creating your AI photo...</p>
          <p className="text-gray-400 text-sm">This may take up to a minute</p>
        </div>
      </div>
    )
  }

  // Review ready
  if (state.step === "review_ready") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black px-4">
        <div className="text-center space-y-6">
          <h2 className="text-2xl font-bold text-white">Your AI Photo is Ready!</h2>
          <p className="text-gray-400">Session ID: {state.session.id}</p>
          <div className="space-x-4">
            <button
              onClick={() => dispatch({ type: "RETAKE" })}
              className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
            >
              Retake
            </button>
            <button
              onClick={() => dispatch({ type: "NEXT" })}
              className="px-6 py-3 text-white rounded-lg hover:opacity-90"
              style={{ backgroundColor: "var(--brand, #0EA5E9)" }}
            >
              Next
            </button>
          </div>
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

  // Error
  if (state.step === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black px-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="text-6xl">⚠️</div>
          <h2 className="text-2xl font-bold text-white">Something went wrong</h2>
          <p className="text-gray-300">{state.message}</p>
          <button
            onClick={() => dispatch({ type: "CLOSE" })}
            className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return null
}
