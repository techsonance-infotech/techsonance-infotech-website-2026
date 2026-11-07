"use client";

import { useState, useEffect, useCallback } from "react";
import { callApi } from "@/lib/api/callApi";
import { getSlotsContract } from "@/lib/contracts/booking.contract";
import { toSlotsViewModel, type SlotsViewModel } from "@/features/booking/view-models";

export type UseBookingSlotsOptions = {
  daysAhead?: number;
  autoFetch?: boolean;
};

/**
 * Dedicated hook for fetching and caching consultation slots.
 * Endpoint: GET /api/slots
 * Contract: getSlotsContract
 */
export function useBookingSlots({ daysAhead = 14, autoFetch = true }: UseBookingSlotsOptions = {}) {
  const [viewModel, setViewModel] = useState<SlotsViewModel | null>(null);
  const [isLoading, setIsLoading] = useState(autoFetch);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchSlots = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    const result = await callApi(getSlotsContract, {
      query: { daysAhead },
    });

    if (result.ok) {
      const vm = toSlotsViewModel(result.data);
      setViewModel(vm);
    } else {
      setErrorMessage(result.error.message || "Failed to load consultation slots.");
    }

    setIsLoading(false);
  }, [daysAhead]);

  useEffect(() => {
    if (autoFetch) {
      void fetchSlots();
    }
  }, [autoFetch, fetchSlots]);

  return {
    slots: viewModel?.slots ?? [],
    slotsByDate: viewModel?.slotsByDate ?? {},
    timezone: viewModel?.timezone ?? "Asia/Kolkata",
    count: viewModel?.count ?? 0,
    isEmpty: viewModel?.isEmpty ?? false,
    isLoading,
    errorMessage,
    refetch: fetchSlots,
  };
}
