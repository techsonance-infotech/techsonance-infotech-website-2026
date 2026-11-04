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

    // 3. Local Development Logging
    if (process.env.NODE_ENV === "development") {
      console.debug(`[Analytics Event: ${eventName}]`, eventPayload);
    }
  }

  trackBookingModalOpen(source: string): void {
    this.track("booking_modal_open", {
      source_location: source,
    });
  }

  trackBookingFormSubmit(details: {
    projectType?: string;
    budgetRange?: string;
    timeline?: string;
    referenceId?: string;
  }): void {
    this.track("booking_form_submit", {
      project_type: details.projectType,
      budget_range: details.budgetRange,
      timeline: details.timeline,
      booking_reference: details.referenceId,
    });
  }

  trackScopingFormSubmit(details: {
    service: string;
    hasCompany: boolean;
  }): void {
    this.track("scoping_form_submit", {
      selected_service: details.service,
      has_company: details.hasCompany,
    });
  }

  trackContactFormSubmit(details: {
    service?: string;
    subject?: string;
  }): void {
    this.track("contact_form_submit", {
      service: details.service,
      subject: details.subject,
    });
  }

  trackWhatsAppClick(source: string): void {
    this.track("whatsapp_click", {
      source_location: source,
    });
  }

  trackCaseStudyView(projectSlug: string, projectTitle: string): void {
    this.track("case_study_view", {
      project_slug: projectSlug,
      project_title: projectTitle,
    });
  }

  trackBlogPostView(postSlug: string, postTitle: string, category: string): void {
    this.track("blog_post_view", {
      post_slug: postSlug,
      post_title: postTitle,
      category: category,
    });
  }
}
