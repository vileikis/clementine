"use client";

import { useState } from "react";
import Image from "next/image";
import { Copy, Check, Download, Link as LinkIcon, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import type { Project } from "../types/project.types";

interface ProjectDistributeTabProps {
  project: Project;
}

/**
 * Project Distribute Tab component.
 *
 * Features:
 * - Display share link with copy button
 * - Display QR code image with download button
 * - Mobile-first design with 44x44px touch targets
 *
 * @param project - The project to display distribution info for
 */
export function ProjectDistributeTab({ project }: ProjectDistributeTabProps) {
  const [copied, setCopied] = useState(false);

  // Build the full share URL
  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}${project.sharePath}`
      : project.sharePath;

  // Copy share link to clipboard
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  // Download QR code image
  const handleDownloadQR = async () => {
    if (!project.qrPngPath) {
      toast.error("QR code not available");
      return;
    }

    try {
      const response = await fetch(project.qrPngPath);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `${project.name.replace(/\s+/g, "-").toLowerCase()}-qr.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);
      toast.success("QR code downloaded");
    } catch {
      toast.error("Failed to download QR code");
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Share Link Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-medium">
            <LinkIcon className="h-4 w-4" />
            Share Link
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Share this link with guests to access your experience.
          </p>
          <div className="flex gap-2">
            <Input
              readOnly
              value={shareUrl}
              className="flex-1 text-sm"
              onClick={(e) => (e.target as HTMLInputElement).select()}
            />
            <Button
              variant="outline"
              size="icon"
              className="h-11 w-11 shrink-0"
              onClick={handleCopyLink}
              aria-label={copied ? "Link copied" : "Copy link"}
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* QR Code Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-medium">
            <QrCode className="h-4 w-4" />
            QR Code
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Guests can scan this QR code to access your experience.
          </p>

          {/* QR Code Display */}
          <div className="flex flex-col items-center gap-4">
            {project.qrPngPath ? (
              <div className="relative w-48 h-48 md:w-64 md:h-64 bg-white rounded-lg p-4 border">
                <Image
                  src={project.qrPngPath}
                  alt={`QR code for ${project.name}`}
                  fill
                  className="object-contain p-2"
                />
              </div>
            ) : (
              <div className="w-48 h-48 md:w-64 md:h-64 bg-muted rounded-lg flex items-center justify-center">
                <p className="text-sm text-muted-foreground">
                  QR code not available
                </p>
              </div>
            )}

            {/* Download Button */}
            <Button
              variant="outline"
              className="min-h-[44px] min-w-[44px]"
              onClick={handleDownloadQR}
              disabled={!project.qrPngPath}
            >
              <Download className="h-4 w-4 mr-2" />
              Download QR Code
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
