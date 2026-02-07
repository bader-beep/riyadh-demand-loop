import {
  WAIT_BAND_SCORES,
  WAIT_BAND_FROM_SCORE,
  CROWD_SCORES,
  CROWD_FROM_SCORE,
  RIYADH_TZ,
} from './constants';

interface SignalInput {
  type: string;
  crowd_level: string | null;
  wait_band: string | null;
  weight: number;
  created_at: Date;
}

interface NowEstimate {
  crowdLevel: string;
  waitBand: string;
  confidence: string;
  confidenceScore: number;
  lastSignalAt: Date | null;
}

/**
 * 7.2 Now Estimate
 * Weighted average of check-ins in last 120 minutes with exponential decay.
 */
export function computeNowEstimate(
  signals: SignalInput[],
  now: Date = new Date()
): NowEstimate {
  const checkins = signals.filter(
    (s) =>
      s.type === 'CHECKIN' &&
      s.crowd_level !== null &&
      s.wait_band !== null
  );

  // Cold start
  if (checkins.length === 0) {
    return {
      crowdLevel: 'MEDIUM',
      waitBand: '10-20',
      confidence: 'LOW',
      confidenceScore: 0,
      lastSignalAt: null,
    };
  }

  let totalWeight = 0;
  let weightedWait = 0;
  let weightedCrowd = 0;

  for (const s of checkins) {
    const ageMin = (now.getTime() - s.created_at.getTime()) / 60000;
    const decay = Math.exp(-ageMin / 60);
    const w = s.weight * decay;

    weightedWait += WAIT_BAND_SCORES[s.wait_band!] * w;
    weightedCrowd += CROWD_SCORES[s.crowd_level!] * w;
    totalWeight += w;
  }

  const avgWait = Math.round(weightedWait / totalWeight);
  const avgCrowd = Math.round(weightedCrowd / totalWeight);

  const waitBand = WAIT_BAND_FROM_SCORE[Math.max(1, Math.min(4, avgWait))];
  const crowdLevel = CROWD_FROM_SCORE[Math.max(1, Math.min(3, avgCrowd))];

  // Find last signal time (any signal, not just checkins)
  const lastSignalAt = signals.length > 0
    ? signals.reduce((latest, s) =>
        s.created_at > latest ? s.created_at : latest,
      signals[0].created_at)
    : null;

  // Confidence
  const { confidence, confidenceScore } = computeConfidence(checkins, lastSignalAt, now);

  return {
    crowdLevel,
    waitBand,
    confidence,
    confidenceScore,
    lastSignalAt,
  };
}

/**
 * 7.3 Confidence Score
 * n_score = min(1, checkins / 10)
 * r_score = exp(-minutesSinceLast / 60)
 * confidence_score = 0.6*n_score + 0.4*r_score
 */
export function computeConfidence(
  checkins: SignalInput[],
  lastSignalAt: Date | null,
  now: Date = new Date()
): { confidence: string; confidenceScore: number } {
  const nScore = Math.min(1, checkins.length / 10);

  let rScore = 0;
  if (lastSignalAt) {
    const minutesSinceLast = (now.getTime() - lastSignalAt.getTime()) / 60000;
    rScore = Math.exp(-minutesSinceLast / 60);
  }

  const confidenceScore = 0.6 * nScore + 0.4 * rScore;

  let confidence: string;
  if (confidenceScore >= 0.75) {
    confidence = 'HIGH';
  } else if (confidenceScore >= 0.45) {
    confidence = 'MEDIUM';
  } else {
    confidence = 'LOW';
  }

  return { confidence, confidenceScore: Math.round(confidenceScore * 100) / 100 };
}

/**
 * 7.4 Forecast (Next 6 Hours)
 * Baseline by category + hour + weekday/weekend
 * Momentum from current crowd (+0.5 for next 1-2 hours if high)
 */
export function computeForecast(
  category: string,
  currentCrowdLevel: string,
  now: Date = new Date()
): { hour: string; crowdLevel: string; waitBand: string }[] {
  const riyadhStr = now.toLocaleString('en-US', { timeZone: RIYADH_TZ });
  const riyadhDate = new Date(riyadhStr);
  const currentHour = riyadhDate.getHours();
  const dayOfWeek = riyadhDate.getDay();
  const isWeekend = dayOfWeek === 5 || dayOfWeek === 6; // Fri/Sat

  const forecast: { hour: string; crowdLevel: string; waitBand: string }[] = [];

  for (let i = 1; i <= 6; i++) {
    const forecastHour = (currentHour + i) % 24;
    let baseCrowd = getBaselineCrowd(category, forecastHour, isWeekend);

    // Momentum: if current crowd is HIGH, add +0.5 for next 1-2 hours
    if (currentCrowdLevel === 'HIGH' && i <= 2) {
      baseCrowd = Math.min(3, baseCrowd + 0.5);
    }

    const crowdScore = Math.max(1, Math.min(3, Math.round(baseCrowd)));
    const crowdLevel = CROWD_FROM_SCORE[crowdScore];

    // Derive wait band from crowd
    const waitScore = crowdToWaitScore(crowdScore);
    const waitBand = WAIT_BAND_FROM_SCORE[waitScore];

    // Compute the actual UTC timestamp for this forecast hour
    const forecastTime = new Date(now);
    forecastTime.setMinutes(0, 0, 0);
    forecastTime.setTime(forecastTime.getTime() + i * 3600000);

    forecast.push({
      hour: forecastTime.toISOString().replace(/\.\d{3}Z$/, 'Z'),
      crowdLevel,
      waitBand,
    });
  }

  return forecast;
}

/**
 * Baseline crowd level by category, hour, and weekday/weekend.
 * Returns a crowd score (1-3 scale).
 */
function getBaselineCrowd(category: string, hour: number, isWeekend: boolean): number {
  // Cafe patterns
  if (category === 'CAFE') {
    if (isWeekend) {
      if (hour >= 8 && hour <= 10) return 2;    // moderate morning
      if (hour >= 11 && hour <= 14) return 2.5;  // brunch
      if (hour >= 15 && hour <= 17) return 1.5;  // afternoon lull
      if (hour >= 18 && hour <= 21) return 3;    // evening peak
      if (hour >= 22 || hour <= 1) return 2;     // late night
      return 1;                                   // early morning / late night
    } else {
      if (hour >= 7 && hour <= 9) return 2.5;    // morning rush
      if (hour >= 10 && hour <= 12) return 2;    // mid-morning
      if (hour >= 13 && hour <= 15) return 1.5;  // post-lunch
      if (hour >= 16 && hour <= 18) return 2;    // afternoon
      if (hour >= 19 && hour <= 21) return 2.5;  // evening
      if (hour >= 22 || hour <= 1) return 1.5;   // late
      return 1;
    }
  }

  // Restaurant patterns
  if (isWeekend) {
    if (hour >= 12 && hour <= 14) return 3;    // lunch peak
    if (hour >= 15 && hour <= 17) return 1.5;  // afternoon
    if (hour >= 18 && hour <= 22) return 3;    // dinner peak
    if (hour >= 23 || hour <= 1) return 2;     // late night
    if (hour >= 8 && hour <= 11) return 1.5;   // breakfast
    return 1;
  } else {
    if (hour >= 12 && hour <= 14) return 2.5;  // lunch
    if (hour >= 15 && hour <= 17) return 1.5;  // afternoon
    if (hour >= 18 && hour <= 21) return 2.5;  // dinner
    if (hour >= 22 || hour <= 1) return 1.5;   // late
    if (hour >= 7 && hour <= 9) return 1.5;    // breakfast
    return 1;
  }
}

function crowdToWaitScore(crowdScore: number): number {
  if (crowdScore <= 1) return 1;
  if (crowdScore <= 2) return 2;
  if (crowdScore <= 3) return 3;
  return 4;
}

/**
 * 7.5 Best Time Windows
 * Evaluate each hour in forecast (lower wait = better).
 * Select best 1-2 contiguous hours. Output max 2 windows.
 */
export function computeBestWindows(
  forecast: { hour: string; crowdLevel: string; waitBand: string }[]
): { start: string; end: string; label: string }[] {
  if (forecast.length === 0) return [];

  // Score each hour (lower = better)
  const scored = forecast.map((f, i) => ({
    ...f,
    index: i,
    score: WAIT_BAND_SCORES[f.waitBand] || 2,
  }));

  // Find best contiguous windows
  type Window = { start: string; end: string; avgScore: number; label: string };
  const windows: Window[] = [];

  // Try single hours
  for (const s of scored) {
    const endTime = new Date(new Date(s.hour).getTime() + 3600000);
    windows.push({
      start: s.hour,
      end: endTime.toISOString().replace(/\.\d{3}Z$/, 'Z'),
      avgScore: s.score,
      label: 'Best time',
    });
  }

  // Try 2-hour contiguous windows
  for (let i = 0; i < scored.length - 1; i++) {
    const avg = (scored[i].score + scored[i + 1].score) / 2;
    const endTime = new Date(new Date(scored[i + 1].hour).getTime() + 3600000);
    windows.push({
      start: scored[i].hour,
      end: endTime.toISOString().replace(/\.\d{3}Z$/, 'Z'),
      avgScore: avg,
      label: 'Best time',
    });
  }

  // Sort by avgScore (lower is better)
  windows.sort((a, b) => a.avgScore - b.avgScore);

  // Take best, then second best (non-overlapping), max 2
  const result: { start: string; end: string; label: string }[] = [];
  for (const w of windows) {
    if (result.length >= 2) break;
    // Check no overlap with existing results
    const overlaps = result.some((r) => {
      const ws = new Date(w.start).getTime();
      const we = new Date(w.end).getTime();
      const rs = new Date(r.start).getTime();
      const re = new Date(r.end).getTime();
      return ws < re && we > rs;
    });
    if (!overlaps) {
      result.push({ start: w.start, end: w.end, label: w.label });
    }
  }

  return result;
}

/**
 * 7.6 Trending Score
 */
export function computeTrendingScore(
  signals: SignalInput[],
  now: Date = new Date()
): number {
  let checkinIntensity = 0;
  let views = 0;
  let saves = 0;
  let navigates = 0;
  let latestSignalTime: Date | null = null;

  for (const s of signals) {
    const ageMin = (now.getTime() - s.created_at.getTime()) / 60000;
    const decay = Math.exp(-ageMin / 60);

    if (s.type === 'CHECKIN') {
      checkinIntensity += decay;
    } else if (s.type === 'VIEW') {
      views += decay;
    } else if (s.type === 'SAVE') {
      saves += decay;
    } else if (s.type === 'NAVIGATE') {
      navigates += decay;
    }

    if (!latestSignalTime || s.created_at > latestSignalTime) {
      latestSignalTime = s.created_at;
    }
  }

  const engagement = 0.7 * views + 1.0 * saves + 1.2 * navigates;

  let recencyBoost = 0;
  if (latestSignalTime) {
    const minutesSinceAny = (now.getTime() - latestSignalTime.getTime()) / 60000;
    recencyBoost = Math.exp(-minutesSinceAny / 45);
  }

  return 0.55 * checkinIntensity + 0.25 * engagement + 0.20 * recencyBoost;
}

/**
 * 7.7 Alternatives Ranking Score (lower is better for wait, higher is better overall)
 * Rank by:
 * 1) Lower wait band
 * 2) Higher confidence_score
 * 3) Shorter distance
 * 4) Family filter matches (+0.1 per match)
 */
export function alternativeScore(
  waitBand: string,
  confidenceScore: number,
  distanceKm: number,
  familyMatches: number
): number {
  // We want a composite score where higher = better alternative
  const waitScore = 5 - (WAIT_BAND_SCORES[waitBand] || 2); // Invert: lower wait = higher score
  const confScore = confidenceScore;
  const distScore = Math.max(0, 1 - distanceKm / 10); // Closer = higher
  const familyScore = familyMatches * 0.1;

  return waitScore + confScore + distScore + familyScore;
}
