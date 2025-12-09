"use client";

/**
 * CallbackLog Component
 *
 * Displays timestamped log of callback invocations with JSON payloads.
 */

import { Button } from "@/components/ui/button";

export interface LogEntry {
  id: string;
  timestamp: Date;
  callback: string;
  payload: unknown;
}

interface CallbackLogProps {
  entries: LogEntry[];
  onClear: () => void;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    fractionalSecondDigits: 3,
  });
}

function formatPayload(payload: unknown): string {
  if (payload === undefined) return "undefined";
  if (payload === null) return "null";

  try {
    // For CapturedPhoto, show a summary instead of full object URL
    if (typeof payload === "object" && payload !== null) {
      const obj = payload as Record<string, unknown>;
      if ("previewUrl" in obj && "file" in obj) {
        return JSON.stringify(
          {
            method: obj.method,
            width: obj.width,
            height: obj.height,
            fileName: (obj.file as File)?.name ?? "unknown",
            fileSize: (obj.file as File)?.size ?? 0,
          },
          null,
          2
        );
      }
    }
    return JSON.stringify(payload, null, 2);
  } catch {
    return String(payload);
  }
}

export function CallbackLog({ entries, onClear }: CallbackLogProps) {
  return (
    <div className="border rounded-lg bg-card">
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-semibold">Callback Log</h3>
        <Button variant="outline" size="sm" onClick={onClear}>
          Clear
        </Button>
      </div>

      <div className="max-h-[400px] overflow-y-auto">
        {entries.length === 0 ? (
          <p className="p-4 text-muted-foreground text-sm">
            No callbacks fired yet. Interact with the component to see events.
          </p>
        ) : (
          <div className="divide-y">
            {entries.map((entry) => (
              <div key={entry.id} className="p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground font-mono">
                    {formatTime(entry.timestamp)}
                  </span>
                  <span className="font-medium text-primary">
                    {entry.callback}
                  </span>
                </div>
                <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                  {formatPayload(entry.payload)}
                </pre>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
