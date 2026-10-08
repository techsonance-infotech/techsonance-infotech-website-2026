import Dexie, { type Table } from "dexie";

export interface Msg {
  id?: number;
  sessionId: string;
  role: "user" | "assistant";
  text: string;
  ts: number;
  showBooking?: boolean;
  chips?: readonly string[] | string[];
  mode?: "normal" | "faq_only";
}

export interface Visitor {
  id: "me";
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  consent: boolean;
}

export interface BookingCopy {
  id?: number;
  ref: string;
  slot: string;
  project: string;
  ts: number;
}

export class ChatDB extends Dexie {
  messages!: Table<Msg, number>;
  visitor!: Table<Visitor, string>;
  bookings!: Table<BookingCopy, number>;

  constructor() {
    super("ts-chat");
    this.version(1).stores({
      messages: "++id, sessionId, ts",
      visitor: "id",
      bookings: "++id, ref, ts",
    });
  }
}

// Memory fallback store for private/incognito browsing when IndexedDB is blocked
const memoryFallback = {
  messages: [] as Msg[],
  visitor: null as Visitor | null,
  bookings: [] as BookingCopy[],
};

let dbInstance: ChatDB | null = null;
let isIndexedDBAvailable = true;

export function getChatDB(): ChatDB | null {
  if (typeof window === "undefined") return null;
  if (!isIndexedDBAvailable) return null;

  if (!dbInstance) {
    try {
      dbInstance = new ChatDB();
    } catch {
      isIndexedDBAvailable = false;
      return null;
    }
  }
  return dbInstance;
}

export async function saveMessage(msg: Msg): Promise<void> {
  const db = getChatDB();
  if (db) {
    try {
      await db.messages.add(msg);
      return;
    } catch {
      isIndexedDBAvailable = false;
    }
  }
  memoryFallback.messages.push({ ...msg, id: memoryFallback.messages.length + 1 });
}

export async function getSessionMessages(sessionId: string): Promise<Msg[]> {
  const db = getChatDB();
  if (db) {
    try {
      return await db.messages.where("sessionId").equals(sessionId).sortBy("ts");
    } catch {
      isIndexedDBAvailable = false;
    }
  }
  return memoryFallback.messages
    .filter((m) => m.sessionId === sessionId)
    .sort((a, b) => a.ts - b.ts);
}

export async function clearAllChat(): Promise<void> {
  const db = getChatDB();
  if (db) {
    try {
      await db.messages.clear();
      await db.visitor.clear();
      await db.bookings.clear();
    } catch {
      // ignore
    }
  }
  memoryFallback.messages = [];
  memoryFallback.visitor = null;
  memoryFallback.bookings = [];
}

export async function cleanupOldMessages(days = 30): Promise<void> {
  const db = getChatDB();
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  if (db) {
    try {
      await db.messages.where("ts").below(cutoff).delete();
    } catch {
      // ignore
    }
  }
  memoryFallback.messages = memoryFallback.messages.filter((m) => m.ts >= cutoff);
}

export async function getVisitorProfile(): Promise<Visitor | null> {
  const db = getChatDB();
  if (db) {
    try {
      const record = await db.visitor.get("me");
      return record || null;
    } catch {
      // ignore
    }
  }
  return memoryFallback.visitor;
}

export async function saveVisitorProfile(profile: Partial<Visitor>): Promise<void> {
  const data: Visitor = {
    id: "me",
    name: profile.name,
    email: profile.email,
    phone: profile.phone,
    company: profile.company,
    consent: profile.consent ?? true,
  };

  const db = getChatDB();
  if (db) {
    try {
      await db.visitor.put(data);
      return;
    } catch {
      // ignore
    }
  }
  memoryFallback.visitor = data;
}

export async function saveBookingCopy(booking: BookingCopy): Promise<void> {
  const db = getChatDB();
  if (db) {
    try {
      await db.bookings.add(booking);
      return;
    } catch {
      // ignore
    }
  }
  memoryFallback.bookings.push({ ...booking, id: memoryFallback.bookings.length + 1 });
}
