import { getContainer } from "./di/container";
import { EmailService, type BookingPayload, type SendMailOptions } from "./services/email.service";

export type { BookingPayload, SendMailOptions };

export function createICSCalendar(booking: BookingPayload, ref: string): string {
  const service = getContainer().get(EmailService);
  return service.createICSCalendar(booking, ref);
}

export function getMailTransporter() {
  const service = getContainer().get(EmailService);
  return service.getTransporter();
}

export async function sendMail(
  options: SendMailOptions
): Promise<{ ok: boolean; messageId?: string; error?: string }> {
  const service = getContainer().get(EmailService);
  return service.sendMail(options);
}

export async function sendConsultationEmails(
  booking: BookingPayload,
  ref: string
): Promise<{ ok: boolean; messageId?: string }> {
  const service = getContainer().get(EmailService);
  return service.sendConsultationEmails(booking, ref);
}
