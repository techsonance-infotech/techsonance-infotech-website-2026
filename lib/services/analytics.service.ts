declare global {
  interface Window {
    gtag?: (
      command: "event" | "config" | "js" | "set",
      eventNameOrTargetId: string,
      eventParams?: Record<string, unknown>
    ) => void;
    dataLayer?: Array<Record<string, unknown>>;
  }
}

export type ConversionEvent =
  | "booking_modal_open"
  | "booking_form_submit"
  | "scoping_form_submit"
  | "contact_form_submit"
  | "whatsapp_click"
  | "case_study_view"
  | "blog_post_view";

export class AnalyticsService {
  track(
    eventName: ConversionEvent,
    params: Record<string, unknown> = {}
  ): void {
    if (typeof window === "undefined") return;

    const eventPayload = {
      ...params,
      timestamp: new Date().toISOString(),
    };

    // 1. Google Analytics 4 (gtag)
    if (typeof window.gtag === "function") {
      try {
        window.gtag("event", eventName, eventPayload);
      } catch {
        // Gracefully ignore GA error
      }
    }

    // 2. Google Tag Manager (dataLayer)
    if (Array.isArray(window.dataLayer)) {
      try {
        window.dataLayer.push({
          event: eventName,
          ...eventPayload,
        });
      } catch {
        // Gracefully ignore GTM error
      }
    }
  }
}
