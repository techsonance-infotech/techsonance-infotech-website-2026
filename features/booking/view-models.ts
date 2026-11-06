import type { SlotDto, SlotsResponseDto } from "@/lib/validations/booking.schema";

export type SlotViewModel = {
  id: string;
  iso: string;
  dateIST: string;
  startIST: string;
  endIST: string;
  dayOfWeek: string;
  formattedTimeRange: string;
  formattedDateDisplay: string;
};

export type SlotsViewModel = {
  slots: SlotViewModel[];
  slotsByDate: Record<string, SlotViewModel[]>;
  timezone: string;
  count: number;
  isEmpty: boolean;
};

export function toSlotViewModel(dto: SlotDto): SlotViewModel {
  return {
    id: dto.id,
    iso: dto.iso,
    dateIST: dto.dateIST,
    startIST: dto.startIST,
    endIST: dto.endIST,
    dayOfWeek: dto.dayOfWeek,
    formattedTimeRange: `${dto.startIST} - ${dto.endIST}`,
    formattedDateDisplay: `${dto.dayOfWeek}, ${dto.dateIST}`,
  };
}

export function toSlotsViewModel(dto: SlotsResponseDto): SlotsViewModel {
  const slots = dto.slots.map(toSlotViewModel);
  const slotsByDate: Record<string, SlotViewModel[]> = {};

  for (const slot of slots) {
    if (!slotsByDate[slot.dateIST]) {
      slotsByDate[slot.dateIST] = [];
    }
    slotsByDate[slot.dateIST].push(slot);
  }

  return {
    slots,
    slotsByDate,
    timezone: dto.timezone,
    count: dto.count,
    isEmpty: slots.length === 0,
  };
}
