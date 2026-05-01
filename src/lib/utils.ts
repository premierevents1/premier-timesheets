export function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

export function dateKey(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function todayKey(): string {
  return dateKey(new Date());
}

export function yesterdayKey(): string {
  return dateKey(new Date(Date.now() - 86400000));
}

export function formatDate(iso: string): string {
  return new Date(iso + "T12:00:00").toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export function calcHours(start: string, end: string, breakMins: number): number {
  if (!start || !end) return 0;
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  return Math.max(0, (eh * 60 + em - (sh * 60 + sm) - breakMins) / 60);
}

export function timeToFraction(time: string | null): string {
  if (!time) return "0";
  const [h, m] = time.split(":").map(Number);
  return ((h * 60 + m) / 1440).toFixed(6);
}

export function minsToFraction(mins: number): string {
  if (!mins) return "0";
  return (mins / 1440).toFixed(6);
}

export function leaveHours(leaveType: string): number {
  return leaveType.includes("½") ? 3.75 : 7.5;
}

export function mondayOfWeek(isoDate: string): string {
  const d = new Date(isoDate + "T12:00:00");
  const diff = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - diff);
  return dateKey(d);
}

export function randomPin(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}
