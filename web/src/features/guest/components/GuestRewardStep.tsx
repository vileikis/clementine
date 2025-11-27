"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { StepReward, ShareSocial } from "@/features/steps";
import type { Session } from "@/features/sessions";
import { useEventTheme } from "@/components/providers/EventThemeProvider";
import { Download, Share2, Mail } from "lucide-react";

interface GuestRewardStepProps {
  step: StepReward;
  eventId: string;
  sessionId: string;
}

/** Social media icon mapping */
const SOCIAL_ICONS: Record<ShareSocial, string> = {
  instagram: "📷",
  facebook: "📘",
  twitter: "𝕏",
  linkedin: "💼",
  tiktok: "🎵",
  whatsapp: "💬",
};

/** Social media labels */
const SOCIAL_LABELS: Record<ShareSocial, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  twitter: "X",
  linkedin: "LinkedIn",
  tiktok: "TikTok",
  whatsapp: "WhatsApp",
};

/**
 * Guest-facing reward step component
 * Displays AI-transformed result with download and share options
 * Matches the structure and styling of the preview RewardStep component
 */
export function GuestRewardStep({
  step,
  eventId,
  sessionId,
}: GuestRewardStepProps) {
  const { buttonBgColor, buttonTextColor, buttonRadius } = useEventTheme();
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  const config = step.config ?? {
    allowDownload: true,
    allowSystemShare: true,
    allowEmail: false,
    socials: [],
  };

  const hasShareOptions =
    config.allowDownload ||
    config.allowSystemShare ||
    config.allowEmail ||
    config.socials.length > 0;

  // Subscribe to session updates for real-time result availability
  useEffect(() => {
    const sessionRef = doc(db, `events/${eventId}/sessions/${sessionId}`);

    const unsubscribe = onSnapshot(
      sessionRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          setError("Session not found");
          setIsLoading(false);
          return;
        }

        const sessionData = {
          id: snapshot.id,
          ...snapshot.data(),
        } as Session;

        console.log("[GuestRewardStep] Session state:", sessionData.state);
        setSession(sessionData);
        setIsLoading(false);

        // If there's an error, show it
        if (sessionData.state === "error") {
          setError(sessionData.error || "Transform failed");
        }
      },
      (err) => {
        console.error("[GuestRewardStep] Subscription error:", err);
        setError("Failed to load result");
        setIsLoading(false);
      }
    );

    unsubscribeRef.current = unsubscribe;

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [eventId, sessionId]);

  /**
   * Download result image
   */
  const handleDownload = async () => {
    if (!session?.resultImagePath) return;

    setIsDownloading(true);

    try {
      const response = await fetch(session.resultImagePath);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `result-${sessionId}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("[GuestRewardStep] Download failed:", err);
      // Silent fail - user can try again
    } finally {
      setIsDownloading(false);
    }
  };

  /**
   * Share result using native share API or fallback
   */
  const handleShare = async () => {
    if (!session?.resultImagePath) return;

    // Check if native share is available
    if (navigator.share) {
      try {
        // Fetch image as blob
        const response = await fetch(session.resultImagePath);
        const blob = await response.blob();
        const file = new File([blob], `result-${sessionId}.jpg`, {
          type: "image/jpeg",
        });

        await navigator.share({
          title: step.title || "My AI Result",
          text: step.description || "Check out my AI-transformed photo!",
          files: [file],
        });
      } catch (err) {
        // User cancelled or share failed
        console.log("[GuestRewardStep] Share cancelled or failed:", err);
      }
    } else {
      // Fallback: Copy link to clipboard
      try {
        await navigator.clipboard.writeText(session.resultImagePath);
        alert("Link copied to clipboard!");
      } catch (err) {
        console.error("[GuestRewardStep] Clipboard write failed:", err);
        // Final fallback: Open in new tab
        window.open(session.resultImagePath, "_blank");
      }
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center space-y-4">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-white border-r-transparent"></div>
          <p className="text-white text-lg">Loading result...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black px-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="text-6xl">⚠️</div>
          <h2 className="text-2xl font-bold text-white">Result Not Found</h2>
          <p className="text-gray-300">{error || "Unable to load result"}</p>
        </div>
      </div>
    );
  }

  // Transform still in progress - show loading with real-time updates
  if (!session.resultImagePath && session.state === "transforming") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black px-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="inline-block h-16 w-16 animate-spin rounded-full border-4 border-solid border-white border-r-transparent"></div>
          <h2 className="text-2xl font-bold text-white">
            Creating Your Result
          </h2>
          <p className="text-gray-300">
            Your AI transformation is in progress. This will be ready in just a moment...
          </p>
        </div>
      </div>
    );
  }

  // No result image and not transforming - something went wrong
  if (!session.resultImagePath) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black px-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="text-6xl">⚠️</div>
          <h2 className="text-2xl font-bold text-white">
            Result Not Available
          </h2>
          <p className="text-gray-300">
            Your result couldn't be generated. Please try again or contact support.
          </p>
        </div>
      </div>
    );
  }

  // Success state - show result with actions
  return (
    <div className="min-h-screen bg-transparent flex flex-col p-6">
      <div className="flex-1 flex flex-col">
        {/* Title */}
        {step.title && (
          <h2 className="text-2xl font-bold mb-2">{step.title}</h2>
        )}

        {/* Description */}
        {step.description && (
          <p className="text-sm opacity-80 mb-4">{step.description}</p>
        )}

        {/* Result Image - responsive sizing to match preview */}
        <div className="flex-1 flex items-center justify-center py-4">
          <div
            className="w-[70%] lg:w-[50%] lg:max-w-[300px] aspect-[3/4] rounded-lg overflow-hidden relative shadow-lg"
          >
            <Image
              src={session.resultImagePath}
              alt="AI transformed result"
              fill
              className="object-cover"
              unoptimized
            />
          </div>
        </div>

        {/* Share Options */}
        {hasShareOptions && (
          <div className="mt-auto space-y-3">
            {/* Primary Share Buttons - grid on mobile, inline on desktop */}
            <div className="grid grid-cols-3 gap-2 lg:flex lg:justify-center lg:gap-3">
              {config.allowDownload && (
                <button
                  onClick={handleDownload}
                  disabled={isDownloading}
                  className="flex flex-col items-center justify-center p-3 rounded-lg bg-white/10 min-h-[60px] lg:min-h-0 lg:flex-row lg:gap-2 lg:px-4 lg:py-2"
                  style={{ borderRadius: buttonRadius }}
                >
                  <Download className="h-5 w-5 mb-1 lg:mb-0" />
                  <span className="text-xs">
                    {isDownloading ? "Downloading..." : "Download"}
                  </span>
                </button>
              )}
              {config.allowSystemShare && (
                <button
                  onClick={handleShare}
                  className="flex flex-col items-center justify-center p-3 rounded-lg bg-white/10 min-h-[60px] lg:min-h-0 lg:flex-row lg:gap-2 lg:px-4 lg:py-2"
                  style={{ borderRadius: buttonRadius }}
                >
                  <Share2 className="h-5 w-5 mb-1 lg:mb-0" />
                  <span className="text-xs">Share</span>
                </button>
              )}
              {config.allowEmail && (
                <button
                  className="flex flex-col items-center justify-center p-3 rounded-lg bg-white/10 min-h-[60px] lg:min-h-0 lg:flex-row lg:gap-2 lg:px-4 lg:py-2"
                  style={{ borderRadius: buttonRadius }}
                >
                  <Mail className="h-5 w-5 mb-1 lg:mb-0" />
                  <span className="text-xs">Email</span>
                </button>
              )}
            </div>

            {/* Social Media Buttons */}
            {config.socials.length > 0 && (
              <div className="flex flex-wrap gap-2 justify-center">
                {config.socials.map((social) => (
                  <button
                    key={social}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium"
                    style={{
                      backgroundColor: buttonBgColor,
                      color: buttonTextColor,
                      borderRadius: buttonRadius,
                    }}
                    onClick={() => {
                      // TODO: Implement social-specific sharing
                      console.log(`Share to ${social}`);
                    }}
                  >
                    <span>{SOCIAL_ICONS[social]}</span>
                    <span>{SOCIAL_LABELS[social]}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
