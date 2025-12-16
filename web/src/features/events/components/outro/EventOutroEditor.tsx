"use client";

import { useForm, useWatch } from "react-hook-form";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAutoSave } from "@/hooks/useAutoSave";
import { OutroSection } from "./OutroSection";
import { OutroPreview } from "./OutroPreview";
import { ShareOptionsSection } from "./ShareOptionsSection";
import { updateEventOutroAction, updateEventShareOptionsAction } from "../../actions/events.actions";
import { DEFAULT_EVENT_OUTRO, DEFAULT_EVENT_SHARE_OPTIONS } from "../../constants";
import type { Event, EventOutro, EventShareOptions } from "../../types/event.types";

interface EventOutroEditorProps {
  /** Event data with current outro and share options */
  event: Event;
  /** Project ID for server actions */
  projectId: string;
}

/**
 * EventOutroEditor component - Main outro configuration editor
 *
 * Features:
 * - Dual form management (outro + share options)
 * - Auto-save on blur with debouncing
 * - Two-column layout: forms on left, preview on right
 * - Mobile-first responsive (stacked on mobile)
 * - Real-time preview updates
 * - Error handling with toast notifications
 */
export function EventOutroEditor({ event, projectId }: EventOutroEditorProps) {
  const router = useRouter();

  // Initialize outro form with event outro or defaults
  const initialOutroValues: EventOutro = {
    title: event.outro?.title ?? DEFAULT_EVENT_OUTRO.title,
    description: event.outro?.description ?? DEFAULT_EVENT_OUTRO.description,
    ctaLabel: event.outro?.ctaLabel ?? DEFAULT_EVENT_OUTRO.ctaLabel,
    ctaUrl: event.outro?.ctaUrl ?? DEFAULT_EVENT_OUTRO.ctaUrl,
  };

  const outroForm = useForm<EventOutro>({
    defaultValues: initialOutroValues,
    mode: "onBlur",
  });

  // Initialize share options form with event shareOptions or defaults
  const initialShareValues: EventShareOptions = {
    allowDownload: event.shareOptions?.allowDownload ?? DEFAULT_EVENT_SHARE_OPTIONS.allowDownload,
    allowSystemShare: event.shareOptions?.allowSystemShare ?? DEFAULT_EVENT_SHARE_OPTIONS.allowSystemShare,
    allowEmail: event.shareOptions?.allowEmail ?? DEFAULT_EVENT_SHARE_OPTIONS.allowEmail,
    socials: event.shareOptions?.socials ?? DEFAULT_EVENT_SHARE_OPTIONS.socials,
  };

  const shareOptionsForm = useForm<EventShareOptions>({
    defaultValues: initialShareValues,
    mode: "onBlur",
  });

  // Watch all form fields for live preview
  const watchedOutro = useWatch({ control: outroForm.control });
  const watchedShareOptions = useWatch({ control: shareOptionsForm.control });

  // Merge watched values with defaults for preview
  const outroPreviewData: EventOutro = {
    ...DEFAULT_EVENT_OUTRO,
    ...watchedOutro,
  };

  const shareOptionsPreviewData: EventShareOptions = {
    ...DEFAULT_EVENT_SHARE_OPTIONS,
    ...watchedShareOptions,
  };

  // Auto-save handler for outro
  const handleOutroUpdate = async (updates: Partial<EventOutro>) => {
    const result = await updateEventOutroAction(projectId, event.id, updates);

    if (!result.success) {
      toast.error("Failed to save outro", {
        description: result.error.message,
      });
      return;
    }

    toast.success("Outro saved");
    router.refresh();
  };

  // Auto-save handler for share options
  const handleShareOptionsUpdate = async (updates: Partial<EventShareOptions>) => {
    const result = await updateEventShareOptionsAction(projectId, event.id, updates);

    if (!result.success) {
      toast.error("Failed to save share options", {
        description: result.error.message,
      });
      return;
    }

    toast.success("Share options saved");
    router.refresh();
  };

  // Set up auto-save for outro
  const { handleBlur: handleOutroBlur } = useAutoSave({
    form: outroForm,
    originalValues: initialOutroValues,
    onUpdate: handleOutroUpdate,
    fieldsToCompare: ["title", "description", "ctaLabel", "ctaUrl"],
    debounceMs: 500,
  });

  // Set up auto-save for share options
  const { handleBlur: handleShareOptionsBlur } = useAutoSave({
    form: shareOptionsForm,
    originalValues: initialShareValues,
    onUpdate: handleShareOptionsUpdate,
    fieldsToCompare: ["allowDownload", "allowSystemShare", "allowEmail", "socials"],
    debounceMs: 500,
  });

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_1fr] items-start">
      {/* Left column: Form */}
      <div className="space-y-6">
        <OutroSection form={outroForm} onBlur={handleOutroBlur} />
        <ShareOptionsSection form={shareOptionsForm} onBlur={handleShareOptionsBlur} />
      </div>

      {/* Right column: Preview */}
      <div className="lg:sticky lg:top-6">
        <OutroPreview
          outro={outroPreviewData}
          shareOptions={shareOptionsPreviewData}
          event={event}
        />
      </div>
    </div>
  );
}
