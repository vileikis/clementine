"use client";

import { useEffect, useState } from "react";

interface CountdownProps {
  onComplete: () => void;
}

export function Countdown({ onComplete }: CountdownProps) {
  const [count, setCount] = useState<3 | 2 | 1>(3);

  useEffect(() => {
    const timer = setInterval(() => {
      setCount((prev) => {
        if (prev === 1) {
          clearInterval(timer);
          setTimeout(onComplete, 300); // Small delay before capture
          return 1;
        }
        return (prev - 1) as 3 | 2 | 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div
        className="text-[20rem] font-bold text-white animate-in zoom-in-50 fade-in duration-300"
        style={{ color: "var(--brand, #0EA5E9)" }}
        key={count}
      >
        {count}
      </div>
    </div>
  );
}
