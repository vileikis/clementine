"use client";

import { useState } from "react";
import { Countdown } from "./Countdown";
import { capturePhoto } from "@/lib/camera/capture";

interface CaptureButtonProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  onCapture: (blob: Blob) => void;
  disabled?: boolean;
}

export function CaptureButton({
  videoRef,
  onCapture,
  disabled,
}: CaptureButtonProps) {
  const [counting, setCounting] = useState(false);

  const handleClick = () => {
    if (disabled || counting) return;
    setCounting(true);
  };

  const handleCountdownComplete = async () => {
    if (!videoRef.current) {
      setCounting(false);
      return;
    }

    try {
      const blob = await capturePhoto(videoRef.current);
      onCapture(blob);
    } catch (error) {
      console.error("Capture failed:", error);
      setCounting(false);
    }
  };

  return (
    <>
      {counting && <Countdown onComplete={handleCountdownComplete} />}
      <button
        onClick={handleClick}
        disabled={disabled || counting}
        className="relative h-20 w-20 rounded-full border-4 border-white bg-white/20 backdrop-blur-sm transition-all hover:scale-110 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
        style={{
          borderColor: counting ? "var(--brand, #0EA5E9)" : "white",
        }}
      >
        <div
          className="absolute inset-2 rounded-full transition-all"
          style={{
            backgroundColor: counting
              ? "var(--brand, #0EA5E9)"
              : "rgba(255, 255, 255, 0.9)",
          }}
        />
      </button>
    </>
  );
}
