"use client";

import { useState, useEffect, useRef } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { StepProcessing } from "@/features/steps";
import type { Session } from "@/features/sessions";

interface GuestProcessingStepProps {
  step: StepProcessing;
  eventId: string;
  sessionId: string;
  onProcessingComplete: () => void;
}

/**
 * Guest-facing processing step component
 * Monitors session state via real-time subscription.
 * If transform is complete, advances immediately.
 * If still processing, shows loading animation until complete.
 */
export function GuestProcessingStep({
  step,
  eventId,
  sessionId,
  onProcessingComplete,
}: GuestProcessingStepProps) {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Rotate messages based on estimated duration
  useEffect(() => {
    const messages = step.config.messages;
    if (messages.length <= 1) return;

    const rotationInterval =
      (step.config.estimatedDuration * 1000) / messages.length;

    const interval = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % messages.length);
    }, rotationInterval);

    return () => clearInterval(interval);
  }, [step.config.messages, step.config.estimatedDuration]);

  // Subscribe to session updates for real-time transform status
  useEffect(() => {
    const sessionRef = doc(db, `events/${eventId}/sessions/${sessionId}`);

    const unsubscribe = onSnapshot(
      sessionRef,
      (snapshot) => {
        if (!snapshot.exists()) return;

        const session = {
          id: snapshot.id,
          ...snapshot.data(),
        } as Session;

        console.log("[GuestProcessingStep] Session state:", session.state);

        if (session.state === "ready") {
          // Transform complete - advance to next step
          onProcessingComplete();
        } else if (session.state === "error") {
          // Transform failed - show error
          setError(session.error || "Transform failed");
        }
      },
      (err) => {
        console.error("[GuestProcessingStep] Subscription error:", err);
        setError("Failed to monitor transform status");
      }
    );

    unsubscribeRef.current = unsubscribe;

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [eventId, sessionId, onProcessingComplete]);

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black px-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="text-6xl">⚠️</div>
          <h2 className="text-2xl font-bold text-white">
            Processing Failed
          </h2>
          <p className="text-gray-300">{error}</p>
          <div className="text-sm text-gray-400">
            Please try again or contact support if the problem persists.
          </div>
        </div>
      </div>
    );
  }

  // Processing state - show animated loading with rotating messages
  const currentMessage =
    step.config.messages[currentMessageIndex] || "Processing...";

  return (
    <div className="min-h-screen flex items-center justify-center bg-black px-4">
      <div className="max-w-md w-full text-center space-y-8">
        {/* Title */}
        {step.title && (
          <h1 className="text-3xl font-bold text-white">{step.title}</h1>
        )}

        {/* Animated spinner */}
        <div className="flex justify-center">
          <div className="inline-block h-16 w-16 animate-spin rounded-full border-4 border-solid border-white border-r-transparent"></div>
        </div>

        {/* Rotating message */}
        <div className="min-h-[60px] flex items-center justify-center">
          <p
            key={currentMessageIndex}
            className="text-xl text-white animate-fade-in"
          >
            {currentMessage}
          </p>
        </div>

        {/* Description */}
        {step.description && (
          <p className="text-gray-400 text-sm">{step.description}</p>
        )}
      </div>
    </div>
  );
}
