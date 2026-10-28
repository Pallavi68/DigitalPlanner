import type { ISODate, Weekday } from '../types';

/** Time Alignment window — 8:00am to 2:00am next day, fixed (locked decision). */
export const DAY_START_HOUR = 8;
export const DAY_END_HOUR = 26; // 2am next day
export const SLOT_MINUTES = 30;
export const SLOT_COUNT = ((DAY_END_HOUR - DAY_START_HOUR) * 60) / SLOT_MINUTES; // 36

export function todayISO(): ISODate {
  return toISO(new Date());
}

export function toISO(d: Date): ISODate {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function fromISO(iso: ISODate): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(iso: ISODate, n: number): ISODate {
  const d = fromISO(iso);
  d.setDate(d.getDate() + n);
  return toISO(d);
}

export function addMonths(iso: ISODate, n: number): ISODate {
  const d = fromISO(iso);
  const intendedDay = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + n);
  const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(intendedDay, lastDay));
  return toISO(d);
}

/** 0 = Monday ... 6 = Sunday */
export function weekday(iso: ISODate): Weekday {
  const js = fromISO(iso).getDay(); // 0 = Sunday
  return ((js + 6) % 7) as Weekday;
}

const WEEKDAY_LONG = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const WEEKDAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export function weekdayLong(iso: ISODate): string {
  return WEEKDAY_LONG[weekday(iso)];
}
export function weekdayShort(iso: ISODate): string {
  return WEEKDAY_SHORT[weekday(iso)];
}
export function monthName(iso: ISODate): string {
  return MONTHS[fromISO(iso).getMonth()];
}
export function dayOfMonth(iso: ISODate): number {
  return fromISO(iso).getDate();
}
export function ordinal(n: number): string {
  const t = n % 10;
  const h = Math.floor((n % 100) / 10);
  if (h === 1) return 'th';
  return t === 1 ? 'st' : t === 2 ? 'nd' : t === 3 ? 'rd' : 'th';
}

/** Human label for a slot index, e.g. 0 -> '8am', 1 -> '', 8 -> '12pm'. Labels on the hour only. */
export function slotLabel(slot: number): string {
  const totalMin = DAY_START_HOUR * 60 + slot * SLOT_MINUTES;
  const h24 = Math.floor(totalMin / 60) % 24;
  const isHalf = totalMin % 60 !== 0;
  if (isHalf) return '';
  const ampm = h24 >= 12 && h24 < 24 ? 'pm' : 'am';
  const h12 = ((h24 + 11) % 12) + 1;
  return `${h12}${ampm}`;
}

/** Full clock time for a slot boundary, e.g. 0 -> '8:00', used in tooltips/labels. */
export function slotTime(slot: number): string {
  const totalMin = Math.round(DAY_START_HOUR * 60 + slot * SLOT_MINUTES);
  const h24 = Math.floor(totalMin / 60) % 24;
  const min = totalMin % 60;
  const ampm = h24 >= 12 && h24 < 24 ? 'pm' : 'am';
  const h12 = ((h24 + 11) % 12) + 1;
  return `${h12}:${String(min).padStart(2, '0')}${ampm}`;
}

/** The 14-day window (two weeks) that contains `iso`, starting on the Monday. */
export function twoWeekWindow(iso: ISODate): ISODate[] {
  const wd = weekday(iso);
  const monday = addDays(iso, -wd);
  return Array.from({ length: 14 }, (_, i) => addDays(monday, i));
}

/** Every Monday–Sunday row touching the calendar month containing `iso`. */
export function monthWeeks(iso: ISODate): ISODate[][] {
  const monthDate = fromISO(iso);
  const first = toISO(new Date(monthDate.getFullYear(), monthDate.getMonth(), 1));
  const last = toISO(new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0));
  const gridStart = addDays(first, -weekday(first));
  const gridEnd = addDays(last, 6 - weekday(last));
  const inclusiveDays = Math.round((fromISO(gridEnd).getTime() - fromISO(gridStart).getTime()) / 86_400_000) + 1;
  const weekCount = inclusiveDays / 7;
  return Array.from({ length: weekCount }, (_, weekIndex) =>
    Array.from({ length: 7 }, (_, dayIndex) => addDays(gridStart, weekIndex * 7 + dayIndex)),
  );
}
