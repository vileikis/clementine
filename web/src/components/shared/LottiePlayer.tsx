"use client";

import { useEffect, useState } from "react";
import Lottie from "lottie-react";
import { cn } from "@/lib/utils";

interface LottiePlayerProps {
  /** URL to fetch Lottie JSON from */
  url: string;
  /** Optional className for the container */
  className?: string;
  /** Whether to loop the animation (default: true) */
  loop?: boolean;
  /** Whether to autoplay the animation (default: true) */
  autoplay?: boolean;
}

/**
 * Lottie animation player that fetches JSON from a URL
 *
 * Fetches the Lottie JSON from the provided URL and renders
 * it using lottie-react. Includes loading and error states.
 */
export function LottiePlayer({
  url,
  className,
  loop = true,
  autoplay = true,
}: LottiePlayerProps) {
  const [animationData, setAnimationData] = useState<object | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchLottie() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to fetch Lottie: ${response.statusText}`);
        }
        const data = await response.json();

        if (!cancelled) {
          setAnimationData(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load animation");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    fetchLottie();

    return () => {
      cancelled = true;
    };
  }, [url]);

  if (isLoading) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-muted/50",
          className
        )}
      >
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-destructive/10 text-destructive text-sm",
          className
        )}
      >
        {error}
      </div>
    );
  }

  if (!animationData) {
    return null;
  }

  return (
    <Lottie
      animationData={animationData}
      loop={loop}
      autoplay={autoplay}
      className={className}
    />
  );
}
