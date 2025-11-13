"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, Copy } from "lucide-react";

interface CopyLinkButtonProps {
  joinPath: string;
}

/**
 * Button to copy event join link to clipboard
 * Part of Phase 3 (User Story 0) - Base Events UI Navigation Shell
 */
export function CopyLinkButton({ joinPath }: CopyLinkButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const url = `${window.location.origin}${joinPath}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleCopy}
      className="min-h-[44px] min-w-[44px]"
      aria-label={copied ? "Link copied" : "Copy event link"}
    >
      {copied ? (
        <>
          <Check className="h-4 w-4 mr-2" aria-hidden="true" />
          Copied
        </>
      ) : (
        <>
          <Copy className="h-4 w-4 mr-2" aria-hidden="true" />
          Copy Link
        </>
      )}
    </Button>
  );
}
