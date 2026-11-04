import { AnalyticsService, type ConversionEvent } from "./services/analytics.service";

export type { ConversionEvent };

// Pure client-side singleton for Google Analytics 4 / Google Tag Manager
const analytics = new AnalyticsService();

export function trackEvent(eventName: ConversionEvent, params: Record<string, unknown> = {}): void {
  analytics.track(eventName, params);
}

export function trackBookingModalOpen(source: string): void {
  analytics.trackBookingModalOpen(source);
}

export function trackBookingFormSubmit(details: {
  projectType?: string;
  budgetRange?: string;
  timeline?: string;
  referenceId?: string;
}): void {
  analytics.trackBookingFormSubmit(details);
}

export function trackScopingFormSubmit(details: { service: string; hasCompany: boolean }): void {
  analytics.trackScopingFormSubmit(details);
}

export function trackContactFormSubmit(details: { service?: string; subject?: string }): void {
  analytics.trackContactFormSubmit(details);
}

export function trackWhatsAppClick(source: string): void {
  analytics.trackWhatsAppClick(source);
}

export function trackCaseStudyView(projectSlug: string, projectTitle: string): void {
  analytics.trackCaseStudyView(projectSlug, projectTitle);
}

export function trackBlogPostView(postSlug: string, postTitle: string, category: string): void {
  analytics.trackBlogPostView(postSlug, postTitle, category);
}
