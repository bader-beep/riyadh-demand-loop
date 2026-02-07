// Riyadh timezone
export const RIYADH_TZ = 'Asia/Riyadh';

// Wait band ordinal mapping
export const WAIT_BAND_SCORES: Record<string, number> = {
  '0-10': 1,
  '10-20': 2,
  '20-40': 3,
  '40+': 4,
};

export const WAIT_BAND_FROM_SCORE: Record<number, string> = {
  1: '0-10',
  2: '10-20',
  3: '20-40',
  4: '40+',
};

// Crowd level ordinal mapping
export const CROWD_SCORES: Record<string, number> = {
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
};

export const CROWD_FROM_SCORE: Record<number, string> = {
  1: 'LOW',
  2: 'MEDIUM',
  3: 'HIGH',
};

// API enum conversions (DB uses uppercase, API uses lowercase)
export function crowdToApi(c: string): string {
  return c.toLowerCase();
}

export function waitBandToApi(w: string): string {
  return w; // already lowercase format: 0-10, 10-20, 20-40, 40+
}

export function confidenceToApi(c: string): string {
  return c.toLowerCase();
}

export function categoryToApi(c: string): string {
  return c.toLowerCase();
}

export function categoryToDb(c: string): string {
  return c.toUpperCase();
}

export function parkingEaseToApi(p: string): string {
  return p.toLowerCase();
}

export function parkingEaseToDb(p: string): string {
  return p.toUpperCase();
}

// Parking ease ordering for filter (min level)
export const PARKING_EASE_ORDER: Record<string, number> = {
  EASY: 1,
  MEDIUM: 2,
  HARD: 3,
};

// Signal decay window
export const SIGNAL_WINDOW_MINUTES = 120;

// Rate limit
export const RATE_LIMIT_MAX = 6;
export const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
