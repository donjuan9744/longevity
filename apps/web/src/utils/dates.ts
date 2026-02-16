function pad(value: number): string {
  return String(value).padStart(2, '0');
}

export function toIsoDate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function getMondayIso(d: Date): string {
  const value = new Date(d);
  const day = value.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  value.setDate(value.getDate() + diffToMonday);
  return toIsoDate(value);
}

export function formatDayLabel(iso: string): string {
  const date = new Date(`${iso}T00:00:00`);
  const weekday = new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(date);
  const month = new Intl.DateTimeFormat('en-US', { month: 'short' }).format(date);
  const day = new Intl.DateTimeFormat('en-US', { day: 'numeric' }).format(date);
  return `${weekday} • ${month} ${day}`;
}

export function isToday(iso: string): boolean {
  return iso === toIsoDate(new Date());
}
