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
