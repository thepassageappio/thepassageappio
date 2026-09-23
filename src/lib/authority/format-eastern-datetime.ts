/** America/New_York clocks with short zone (EDT/EST) for participant receipts, staff/PAR receipts, and staff request Full history. */
export function formatEasternDateTime(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/New_York",
    timeZoneName: "short",
  }).format(new Date(value));
}
