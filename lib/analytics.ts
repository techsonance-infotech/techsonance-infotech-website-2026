// ─── Phase 6: Analytics & Event Tracking Utility ─────────────────────────
// Dispatches standard GA4 / Google Tag Manager events for key conversion actions:
// - booking_modal_open
// - booking_form_submit
// - scoping_form_submit
// - contact_form_submit
// - whatsapp_click
// - case_study_view

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
  | "case_study_view";

/**
 * Universal safe event tracking helper compatible with GA4 gtag() and GTM dataLayer.
 */
export function trackEvent(
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

  // 3. Local Development Logging
  if (process.env.NODE_ENV === "development") {
    console.debug(`[Analytics Event: ${eventName}]`, eventPayload);
  }
}

/**
 * Convenience helper: Track consultation modal open
 */
export function trackBookingModalOpen(source: string): void {
  trackEvent("booking_modal_open", {
    source_location: source,
  });
}

/**
 * Convenience helper: Track booking appointment submitted
 */
export function trackBookingFormSubmit(details: {
  projectType?: string;
  budgetRange?: string;
  timeline?: string;
  referenceId?: string;
}): void {
  trackEvent("booking_form_submit", {
    project_type: details.projectType,
    budget_range: details.budgetRange,
    timeline: details.timeline,
    booking_reference: details.referenceId,
  });
}

/**
 * Convenience helper: Track scoping contact form submitted
 */
export function trackScopingFormSubmit(details: {
  service: string;
  hasCompany: boolean;
}): void {
  trackEvent("scoping_form_submit", {
    selected_service: details.service,
    has_company: details.hasCompany,
  });
}

/**
 * Convenience helper: Track contact page form submitted
 */
export function trackContactFormSubmit(details: {
  service?: string;
  subject?: string;
}): void {
  trackEvent("contact_form_submit", {
    service: details.service,
    subject: details.subject,
  });
}

/**
 * Convenience helper: Track direct WhatsApp inquiry click
 */
export function trackWhatsAppClick(source: string): void {
  trackEvent("whatsapp_click", {
    source_location: source,
  });
}

/**
 * Convenience helper: Track case study view
 */
export function trackCaseStudyView(projectSlug: string, projectTitle: string): void {
  trackEvent("case_study_view", {
    project_slug: projectSlug,
    project_title: projectTitle,
  });
}
