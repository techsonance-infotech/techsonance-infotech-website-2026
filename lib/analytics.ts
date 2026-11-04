import { getContainer } from "./di/container";
import { AnalyticsService, type ConversionEvent } from "./services/analytics.service";

export type { ConversionEvent };

export function trackEvent(
  eventName: ConversionEvent,
  params: Record<string, unknown> = {}
): void {
  getContainer().get(AnalyticsService).track(eventName, params);
}

export function trackBookingModalOpen(source: string): void {
  getContainer().get(AnalyticsService).trackBookingModalOpen(source);
}

export function trackBookingFormSubmit(details: {
  projectType?: string;
  budgetRange?: string;
  timeline?: string;
  referenceId?: string;
}): void {
  getContainer().get(AnalyticsService).trackBookingFormSubmit(details);
}

export function trackScopingFormSubmit(details: {
  service: string;
  hasCompany: boolean;
}): void {
  getContainer().get(AnalyticsService).trackScopingFormSubmit(details);
}

export function trackContactFormSubmit(details: {
  service?: string;
  subject?: string;
}): void {
  getContainer().get(AnalyticsService).trackContactFormSubmit(details);
}

export function trackWhatsAppClick(source: string): void {
  getContainer().get(AnalyticsService).trackWhatsAppClick(source);
}

export function trackCaseStudyView(projectSlug: string, projectTitle: string): void {
  getContainer().get(AnalyticsService).trackCaseStudyView(projectSlug, projectTitle);
}

export function trackBlogPostView(postSlug: string, postTitle: string, category: string): void {
  getContainer().get(AnalyticsService).trackBlogPostView(postSlug, postTitle, category);
}
