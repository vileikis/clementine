"use client";

import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAutoSave } from "@/hooks/useAutoSave";
import { OutroSection, OutroPreview, ShareOptionsSection } from "@/features/events/components/outro";
import { updateEventOutroAction, updateEventShareOptionsAction } from "@/features/events/actions/events.actions";
import { DEFAULT_EVENT_OUTRO, DEFAULT_EVENT_SHARE_OPTIONS } from "@/features/events/constants";
import type { Event, EventOutro, EventShareOptions } from "@/features/events/types/event.types";

interface OutroPageClientProps {
  event: Event;
  projectId: string;
}

/**
 * Client component for outro page with form management and auto-save
 */
export function OutroPageClient({ event, projectId }: OutroPageClientProps) {
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
  const watchedOutro = outroForm.watch();
  const watchedShareOptions = shareOptionsForm.watch();

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
          outro={watchedOutro}
          shareOptions={watchedShareOptions}
          event={event}
        />
      </div>
    </div>
  );
}
