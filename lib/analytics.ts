import { getContainer } from "./di/container";
import { AnalyticsService, type ConversionEvent } from "./services/analytics.service";

export type { ConversionEvent };

export function trackEvent(
  eventName: ConversionEvent,
  params: Record<string, unknown> = {}
): void {
  getContainer().get(AnalyticsService).track(eventName, params);
}
