import { getContainer } from "./di/container";
import {
  ChatStorageService,
  ChatDB,
  type Msg,
  type Visitor,
  type BookingCopy,
} from "./services/chat-storage.service";

export type { Msg, Visitor, BookingCopy };
export { ChatDB };

export function getChatDB(): ChatDB | null {
  return getContainer().get(ChatStorageService).getDB();
}

export function saveMessage(msg: Msg): Promise<void> {
  return getContainer().get(ChatStorageService).saveMessage(msg);
}

export function getSessionMessages(sessionId: string): Promise<Msg[]> {
  return getContainer().get(ChatStorageService).getSessionMessages(sessionId);
}

export function clearAllChat(): Promise<void> {
  return getContainer().get(ChatStorageService).clearAllChat();
}

export function cleanupOldMessages(days = 30): Promise<void> {
  return getContainer().get(ChatStorageService).cleanupOldMessages(days);
}

export function getVisitorProfile(): Promise<Visitor | null> {
  return getContainer().get(ChatStorageService).getVisitorProfile();
}

export function saveVisitorProfile(profile: Partial<Visitor>): Promise<void> {
  return getContainer().get(ChatStorageService).saveVisitorProfile(profile);
}

export function saveBookingCopy(booking: BookingCopy): Promise<void> {
  return getContainer().get(ChatStorageService).saveBookingCopy(booking);
}
