"use client";

interface CaptureButtonProps {
  onStartCountdown: () => void;
  disabled?: boolean;
  isCounting?: boolean;
}

export function CaptureButton({
  onStartCountdown,
  disabled,
  isCounting = false,
}: CaptureButtonProps) {
  const handleClick = () => {
    if (disabled || isCounting) return;
    onStartCountdown();
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled || isCounting}
      className="relative h-20 w-20 rounded-full border-4 border-white bg-white/20 backdrop-blur-sm transition-all hover:scale-110 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 z-50"
      style={{
        borderColor: isCounting ? "var(--brand, #0EA5E9)" : "white",
      }}
    >
      <div
        className="absolute inset-2 rounded-full transition-all"
        style={{
          backgroundColor: isCounting
            ? "var(--brand, #0EA5E9)"
            : "rgba(255, 255, 255, 0.9)",
        }}
      />
    </button>
  );
}
