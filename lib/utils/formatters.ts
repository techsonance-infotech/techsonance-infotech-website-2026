export function formatDateSafe(
  dateValue: string | number | Date | null | undefined,
  options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" },
  fallback = "—",
): string {
  if (!dateValue) return fallback;
  const d = new Date(dateValue);
  if (isNaN(d.getTime())) return fallback;
  try {
    return d.toLocaleDateString("en-US", options);
  } catch {
    return fallback;
  }
}

export function safeInitials(name: string | null | undefined, fallback = "?"): string {
  if (!name || typeof name !== "string") return fallback;
  const trimmed = name.trim();
  return trimmed.length > 0 ? trimmed.charAt(0).toUpperCase() : fallback;
}

export function formatCurrencySafe(
  amount: number | null | undefined,
  currency = "INR",
  fallback = "—",
): string {
  if (amount === null || amount === undefined || isNaN(amount)) return fallback;
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${amount}`;
  }
}
