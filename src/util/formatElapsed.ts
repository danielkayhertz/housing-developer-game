export function formatElapsed(months: number): string {
  const m = Math.max(0, Math.floor(months));
  const years = Math.floor(m / 12);
  const remMonths = m % 12;
  if (years === 0) return `${remMonths} mo`;
  if (remMonths === 0) return `${years} yr`;
  return `${years} yr ${remMonths} mo`;
}
