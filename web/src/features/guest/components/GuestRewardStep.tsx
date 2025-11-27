"use client";

import { useState, useEffect } from "react";
import type { StepReward } from "@/features/steps";
import type { Session } from "@/features/sessions";
import { getSessionAction } from "@/features/sessions/actions";
import { Button } from "@/components/ui/button";
import { Download, Share2 } from "lucide-react";

interface GuestRewardStepProps {
  step: StepReward;
  eventId: string;
  sessionId: string;
}

/**
 * Guest-facing reward step component
 * Displays AI-transformed result with download and share options
 */
export function GuestRewardStep({
  step,
  eventId,
  sessionId,
}: GuestRewardStepProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  // Load session to get result image
  useEffect(() => {
    const loadSession = async () => {
      try {
        setIsLoading(true);
        const result = await getSessionAction(eventId, sessionId);
        setSession(result);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to load result";
        setError(message);
        console.error("[GuestRewardStep] Failed to load session:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadSession();
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

  // No result image yet
  if (!session.resultImagePath) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black px-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="text-6xl">⏳</div>
          <h2 className="text-2xl font-bold text-white">
            Result Not Ready
          </h2>
          <p className="text-gray-300">
            Your result is still being processed. Please check back in a moment.
          </p>
        </div>
      </div>
    );
  }

  // Success state - show result with actions
  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Header with title/description */}
      {(step.title || step.description) && (
        <div className="p-6 bg-gradient-to-b from-black/80 to-transparent">
          {step.title && (
            <h1 className="text-2xl font-bold text-white mb-2 text-center">
              {step.title}
            </h1>
          )}
          {step.description && (
            <p className="text-gray-200 text-center">{step.description}</p>
          )}
        </div>
      )}

      {/* Result image */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="relative max-w-2xl w-full">
          <img
            src={session.resultImagePath}
            alt="AI-transformed result"
            className="w-full h-auto rounded-lg shadow-2xl"
          />
        </div>
      </div>

      {/* Action buttons */}
      <div className="p-6 bg-gradient-to-t from-black/80 to-transparent space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {/* Download button */}
          {step.config.allowDownload && (
            <Button
              onClick={handleDownload}
              disabled={isDownloading}
              size="lg"
              variant="outline"
              className="bg-white/10 text-white border-white/20 hover:bg-white/20"
            >
              <Download className="mr-2 h-5 w-5" />
              {isDownloading ? "Downloading..." : "Download"}
            </Button>
          )}

          {/* Share button */}
          {step.config.allowSystemShare && (
            <Button
              onClick={handleShare}
              size="lg"
              className="bg-white text-black hover:bg-gray-100"
            >
              <Share2 className="mr-2 h-5 w-5" />
              Share
            </Button>
          )}
        </div>

        {/* Social sharing buttons */}
        {step.config.socials.length > 0 && (
          <div className="flex justify-center gap-2 flex-wrap">
            {step.config.socials.map((social) => (
              <Button
                key={social}
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/10"
                onClick={() => {
                  // TODO: Implement social-specific sharing
                  console.log(`Share to ${social}`);
                }}
              >
                {social}
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
