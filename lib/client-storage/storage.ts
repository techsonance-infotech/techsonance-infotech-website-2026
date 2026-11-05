import {
  ChatStorageService,
  ChatDB,
  type Msg,
  type Visitor,
  type BookingCopy,
} from "@/lib/services/chat-storage.service";

export type { Msg, Visitor, BookingCopy };
export { ChatDB };

// Pure client-side singleton for Dexie IndexedDB chat operations
const chatStorage = new ChatStorageService();

export function getChatDB(): ChatDB | null {
  return chatStorage.getDB();
}

export function saveMessage(msg: Msg): Promise<void> {
  return chatStorage.saveMessage(msg);
}

export function getSessionMessages(sessionId: string): Promise<Msg[]> {
  return chatStorage.getSessionMessages(sessionId);
}

export function clearAllChat(): Promise<void> {
  return chatStorage.clearAllChat();
}

export function cleanupOldMessages(days = 30): Promise<void> {
  return chatStorage.cleanupOldMessages(days);
}

export function getVisitorProfile(): Promise<Visitor | null> {
  return chatStorage.getVisitorProfile();
}

export function saveVisitorProfile(profile: Partial<Visitor>): Promise<void> {
  return chatStorage.saveVisitorProfile(profile);
}

export function saveBookingCopy(booking: BookingCopy): Promise<void> {
  return chatStorage.saveBookingCopy(booking);
}
