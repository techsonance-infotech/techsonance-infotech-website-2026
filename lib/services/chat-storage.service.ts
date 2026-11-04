import { ChatDB, type Msg, type Visitor, type BookingCopy } from "../db/chatDb";

export type { Msg, Visitor, BookingCopy };
export { ChatDB };

export class ChatStorageService {
  private dbInstance: ChatDB | null = null;
  private isIndexedDBAvailable = true;
  private memoryFallback = {
    messages: [] as Msg[],
    visitor: null as Visitor | null,
    bookings: [] as BookingCopy[],
  };

  getDB(): ChatDB | null {
    if (typeof window === "undefined") return null;
    if (!this.isIndexedDBAvailable) return null;

    if (!this.dbInstance) {
      try {
        this.dbInstance = new ChatDB();
      } catch {
        this.isIndexedDBAvailable = false;
        return null;
      }
    }
    return this.dbInstance;
  }

  async saveMessage(msg: Msg): Promise<void> {
    const db = this.getDB();
    if (db) {
      try {
        await db.messages.add(msg);
        return;
      } catch {
        this.isIndexedDBAvailable = false;
      }
    }
    this.memoryFallback.messages.push({
      ...msg,
      id: this.memoryFallback.messages.length + 1,
    });
  }

  async getSessionMessages(sessionId: string): Promise<Msg[]> {
    const db = this.getDB();
    if (db) {
      try {
        return await db.messages.where("sessionId").equals(sessionId).sortBy("ts");
      } catch {
        this.isIndexedDBAvailable = false;
      }
    }
    return this.memoryFallback.messages
      .filter((m) => m.sessionId === sessionId)
      .sort((a, b) => a.ts - b.ts);
  }

  async clearAllChat(): Promise<void> {
    const db = this.getDB();
    if (db) {
      try {
        await db.messages.clear();
        await db.visitor.clear();
        await db.bookings.clear();
      } catch {
        // ignore
      }
    }
    this.memoryFallback.messages = [];
    this.memoryFallback.visitor = null;
    this.memoryFallback.bookings = [];
  }

  async cleanupOldMessages(days = 30): Promise<void> {
    const db = this.getDB();
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    if (db) {
      try {
        await db.messages.where("ts").below(cutoff).delete();
      } catch {
        // ignore
      }
    }
    this.memoryFallback.messages = this.memoryFallback.messages.filter(
      (m) => m.ts >= cutoff
    );
  }

  async getVisitorProfile(): Promise<Visitor | null> {
    const db = this.getDB();
    if (db) {
      try {
        const record = await db.visitor.get("me");
        return record || null;
      } catch {
        // ignore
      }
    }
    return this.memoryFallback.visitor;
  }

  async saveVisitorProfile(profile: Partial<Visitor>): Promise<void> {
    const data: Visitor = {
      id: "me",
      name: profile.name,
      email: profile.email,
      phone: profile.phone,
      company: profile.company,
      consent: profile.consent ?? true,
    };

    const db = this.getDB();
    if (db) {
      try {
        await db.visitor.put(data);
        return;
      } catch {
        // ignore
      }
    }
    this.memoryFallback.visitor = data;
  }

  async saveBookingCopy(booking: BookingCopy): Promise<void> {
    const db = this.getDB();
    if (db) {
      try {
        await db.bookings.add(booking);
        return;
      } catch {
        // ignore
      }
    }
    this.memoryFallback.bookings.push({
      ...booking,
      id: this.memoryFallback.bookings.length + 1,
    });
  }
}
