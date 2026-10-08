import { BOT_CONFIG } from "./config";

export interface Slot {
  id: string; // ISO String in IST
  iso: string;
  dateIST: string; // YYYY-MM-DD
  startIST: string; // "10:00 AM"
  endIST: string; // "10:30 AM"
  dayOfWeek: string;
}

const DAYS_MAP = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function formatTime(hour: number, minute: number): string {
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  const displayMinute = minute < 10 ? `0${minute}` : `${minute}`;
  return `${displayHour}:${displayMinute} ${period}`;
}

export function generateAvailableSlots(fromTimestamp = Date.now()): Slot[] {
  const slots: Slot[] = [];
  const cfg = BOT_CONFIG.slots;
  const holidaysSet = new Set<string>(cfg.holidays);

  // Current time in IST (offset +5:30 = 330 minutes)
  const istOffsetMs = 5.5 * 60 * 60 * 1000;
  const minNoticeMs = cfg.minNoticeHours * 60 * 60 * 1000;
  const earliestAllowedTime = fromTimestamp + minNoticeMs;

  for (let d = 0; d < cfg.maxDaysAhead; d++) {
    // Target date in IST
    const targetDateUTC = new Date(fromTimestamp + d * 24 * 60 * 60 * 1000);
    const targetDateIST = new Date(targetDateUTC.getTime() + istOffsetMs);

    const year = targetDateIST.getUTCFullYear();
    const month = targetDateIST.getUTCMonth();
    const day = targetDateIST.getUTCDate();
    const dayOfWeek = targetDateIST.getUTCDay();

    // Check business day (e.g. Mon-Sat)
    if (!(cfg.businessDays as readonly number[]).includes(dayOfWeek)) continue;

    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    if (holidaysSet.has(dateStr)) continue;

    // Iterate through slots from startHourIST to endHourIST
    for (let hour = cfg.startHourIST; hour < cfg.endHourIST; hour++) {
      for (let minute = 0; minute < 60; minute += cfg.slotDurationMinutes) {
        // Construct slot start in UTC
        // IST = UTC + 5:30 -> UTC = IST - 5:30
        const slotStartISTTimestamp = Date.UTC(year, month, day, hour, minute) - istOffsetMs;

        if (slotStartISTTimestamp < earliestAllowedTime) {
          continue;
        }

        const endMinute = (minute + cfg.slotDurationMinutes) % 60;
        const endHour = hour + Math.floor((minute + cfg.slotDurationMinutes) / 60);

        const iso = new Date(slotStartISTTimestamp).toISOString();

        slots.push({
          id: iso,
          iso,
          dateIST: dateStr,
          startIST: formatTime(hour, minute),
          endIST: formatTime(endHour, endMinute),
          dayOfWeek: DAYS_MAP[dayOfWeek],
        });
      }
    }
  }

  return slots;
}

export function isValidSlot(slotIso: string, now = Date.now()): boolean {
  const slotDate = new Date(slotIso);
  const slotTimestamp = slotDate.getTime();
  if (isNaN(slotTimestamp)) return false;

  const cfg = BOT_CONFIG.slots;
  const istOffsetMs = 5.5 * 60 * 60 * 1000;
  const minNoticeMs = cfg.minNoticeHours * 60 * 60 * 1000;

  if (slotTimestamp < now + minNoticeMs) {
    return false;
  }

  const maxAllowed = now + cfg.maxDaysAhead * 24 * 60 * 60 * 1000;
  if (slotTimestamp > maxAllowed) {
    return false;
  }

  const istDate = new Date(slotTimestamp + istOffsetMs);
  const dayOfWeek = istDate.getUTCDay();
  if (!(cfg.businessDays as readonly number[]).includes(dayOfWeek)) return false;

  const year = istDate.getUTCFullYear();
  const month = istDate.getUTCMonth();
  const day = istDate.getUTCDate();
  const hour = istDate.getUTCHours();
  const minute = istDate.getUTCMinutes();

  const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  if ((BOT_CONFIG.slots.holidays as readonly string[]).includes(dateStr)) return false;

  if (hour < cfg.startHourIST || hour >= cfg.endHourIST) return false;
  if (minute % cfg.slotDurationMinutes !== 0) return false;

  return true;
}
