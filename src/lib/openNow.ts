import { RIYADH_TZ } from './constants';

type DayKey = 'sun' | 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat';
type HoursMap = Partial<Record<DayKey, [string, string][]>>;

const DAY_KEYS: DayKey[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

/**
 * Determine if a place is currently open based on its hours_json.
 * Returns { hoursKnown: boolean, openNow: boolean | null }
 */
export function getOpenStatus(hoursJson: string | null | undefined): {
  hoursKnown: boolean;
  openNow: boolean | null;
} {
  if (!hoursJson || hoursJson.trim() === '') {
    return { hoursKnown: false, openNow: null };
  }

  let hours: HoursMap;
  try {
    hours = JSON.parse(hoursJson);
  } catch {
    return { hoursKnown: false, openNow: null };
  }

  if (!hours || Object.keys(hours).length === 0) {
    return { hoursKnown: false, openNow: null };
  }

  // Get current time in Riyadh
  const now = new Date();
  const riyadhStr = now.toLocaleString('en-US', { timeZone: RIYADH_TZ });
  const riyadhDate = new Date(riyadhStr);

  const dayIndex = riyadhDate.getDay(); // 0=Sun
  const currentMinutes = riyadhDate.getHours() * 60 + riyadhDate.getMinutes();

  const todayKey = DAY_KEYS[dayIndex];
  const yesterdayKey = DAY_KEYS[(dayIndex + 6) % 7];

  // Check today's ranges
  const todayRanges = hours[todayKey] || [];
  for (const [open, close] of todayRanges) {
    const openMin = parseTime(open);
    const closeMin = parseTime(close);

    if (closeMin > openMin) {
      // Same-day range
      if (currentMinutes >= openMin && currentMinutes < closeMin) {
        return { hoursKnown: true, openNow: true };
      }
    } else {
      // Overnight range (e.g., 23:00 - 02:00)
      // Open from openMin to midnight
      if (currentMinutes >= openMin) {
        return { hoursKnown: true, openNow: true };
      }
    }
  }

  // Check yesterday's overnight ranges
  const yesterdayRanges = hours[yesterdayKey] || [];
  for (const [open, close] of yesterdayRanges) {
    const openMin = parseTime(open);
    const closeMin = parseTime(close);

    if (closeMin <= openMin) {
      // Overnight range: check if we're in the early morning portion
      if (currentMinutes < closeMin) {
        return { hoursKnown: true, openNow: true };
      }
    }
  }

  return { hoursKnown: true, openNow: false };
}

function parseTime(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}
