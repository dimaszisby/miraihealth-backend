export function parseIsoToDate(iso?: string): Date | undefined {
  if (!iso) return undefined;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) throw new Error("Invalid ISO date-time");
  return d;
}
export function toIso(d: Date): string {
  return d.toISOString();
}
