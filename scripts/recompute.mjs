import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Inline the recompute logic to avoid TypeScript import issues in scripts
const SIGNAL_WINDOW_MINUTES = 120;

const WAIT_BAND_SCORES = { '0-10': 1, '10-20': 2, '20-40': 3, '40+': 4 };
const WAIT_BAND_FROM_SCORE = { 1: '0-10', 2: '10-20', 3: '20-40', 4: '40+' };
const CROWD_SCORES = { LOW: 1, MEDIUM: 2, HIGH: 3 };
const CROWD_FROM_SCORE = { 1: 'LOW', 2: 'MEDIUM', 3: 'HIGH' };
const RIYADH_TZ = 'Asia/Riyadh';

function computeNowEstimate(signals, now) {
  const checkins = signals.filter(s => s.type === 'CHECKIN' && s.crowd_level && s.wait_band);

  if (checkins.length === 0) {
    return { crowdLevel: 'MEDIUM', waitBand: '10-20', confidence: 'LOW', confidenceScore: 0, lastSignalAt: null };
  }

  let totalWeight = 0, weightedWait = 0, weightedCrowd = 0;
  for (const s of checkins) {
    const ageMin = (now.getTime() - s.created_at.getTime()) / 60000;
    const decay = Math.exp(-ageMin / 60);
    const w = s.weight * decay;
    weightedWait += WAIT_BAND_SCORES[s.wait_band] * w;
    weightedCrowd += CROWD_SCORES[s.crowd_level] * w;
    totalWeight += w;
  }

  const avgWait = Math.round(weightedWait / totalWeight);
  const avgCrowd = Math.round(weightedCrowd / totalWeight);
  const waitBand = WAIT_BAND_FROM_SCORE[Math.max(1, Math.min(4, avgWait))];
  const crowdLevel = CROWD_FROM_SCORE[Math.max(1, Math.min(3, avgCrowd))];

  const lastSignalAt = signals.reduce((latest, s) => s.created_at > latest ? s.created_at : latest, signals[0].created_at);

  const nScore = Math.min(1, checkins.length / 10);
  const minutesSinceLast = (now.getTime() - lastSignalAt.getTime()) / 60000;
  const rScore = Math.exp(-minutesSinceLast / 60);
  const confidenceScore = Math.round((0.6 * nScore + 0.4 * rScore) * 100) / 100;
  let confidence;
  if (confidenceScore >= 0.75) confidence = 'HIGH';
  else if (confidenceScore >= 0.45) confidence = 'MEDIUM';
  else confidence = 'LOW';

  return { crowdLevel, waitBand, confidence, confidenceScore, lastSignalAt };
}

function getBaselineCrowd(category, hour, isWeekend) {
  if (category === 'CAFE') {
    if (isWeekend) {
      if (hour >= 8 && hour <= 10) return 2;
      if (hour >= 11 && hour <= 14) return 2.5;
      if (hour >= 15 && hour <= 17) return 1.5;
      if (hour >= 18 && hour <= 21) return 3;
      if (hour >= 22 || hour <= 1) return 2;
      return 1;
    } else {
      if (hour >= 7 && hour <= 9) return 2.5;
      if (hour >= 10 && hour <= 12) return 2;
      if (hour >= 13 && hour <= 15) return 1.5;
      if (hour >= 16 && hour <= 18) return 2;
      if (hour >= 19 && hour <= 21) return 2.5;
      if (hour >= 22 || hour <= 1) return 1.5;
      return 1;
    }
  }
  if (isWeekend) {
    if (hour >= 12 && hour <= 14) return 3;
    if (hour >= 15 && hour <= 17) return 1.5;
    if (hour >= 18 && hour <= 22) return 3;
    if (hour >= 23 || hour <= 1) return 2;
    if (hour >= 8 && hour <= 11) return 1.5;
    return 1;
  } else {
    if (hour >= 12 && hour <= 14) return 2.5;
    if (hour >= 15 && hour <= 17) return 1.5;
    if (hour >= 18 && hour <= 21) return 2.5;
    if (hour >= 22 || hour <= 1) return 1.5;
    if (hour >= 7 && hour <= 9) return 1.5;
    return 1;
  }
}

function computeForecast(category, currentCrowdLevel, now) {
  const riyadhStr = now.toLocaleString('en-US', { timeZone: RIYADH_TZ });
  const riyadhDate = new Date(riyadhStr);
  const currentHour = riyadhDate.getHours();
  const dayOfWeek = riyadhDate.getDay();
  const isWeekend = dayOfWeek === 5 || dayOfWeek === 6;

  const forecast = [];
  for (let i = 1; i <= 6; i++) {
    const forecastHour = (currentHour + i) % 24;
    let baseCrowd = getBaselineCrowd(category, forecastHour, isWeekend);
    if (currentCrowdLevel === 'HIGH' && i <= 2) baseCrowd = Math.min(3, baseCrowd + 0.5);

    const crowdScore = Math.max(1, Math.min(3, Math.round(baseCrowd)));
    const crowdLevel = CROWD_FROM_SCORE[crowdScore];
    let waitScore = crowdScore;
    if (crowdScore <= 1) waitScore = 1;
    else if (crowdScore <= 2) waitScore = 2;
    else waitScore = 3;
    const waitBand = WAIT_BAND_FROM_SCORE[waitScore];

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

function computeBestWindows(forecast) {
  if (forecast.length === 0) return [];
  const scored = forecast.map((f, i) => ({ ...f, index: i, score: WAIT_BAND_SCORES[f.waitBand] || 2 }));
  const windows = [];
  for (const s of scored) {
    const endTime = new Date(new Date(s.hour).getTime() + 3600000);
    windows.push({ start: s.hour, end: endTime.toISOString().replace(/\.\d{3}Z$/, 'Z'), avgScore: s.score, label: 'Best time' });
  }
  for (let i = 0; i < scored.length - 1; i++) {
    const avg = (scored[i].score + scored[i + 1].score) / 2;
    const endTime = new Date(new Date(scored[i + 1].hour).getTime() + 3600000);
    windows.push({ start: scored[i].hour, end: endTime.toISOString().replace(/\.\d{3}Z$/, 'Z'), avgScore: avg, label: 'Best time' });
  }
  windows.sort((a, b) => a.avgScore - b.avgScore);
  const result = [];
  for (const w of windows) {
    if (result.length >= 2) break;
    const overlaps = result.some(r => {
      const ws = new Date(w.start).getTime(), we = new Date(w.end).getTime();
      const rs = new Date(r.start).getTime(), re = new Date(r.end).getTime();
      return ws < re && we > rs;
    });
    if (!overlaps) result.push({ start: w.start, end: w.end, label: w.label });
  }
  return result;
}

async function main() {
  const start = Date.now();

  const places = await prisma.place.findMany({
    where: { is_active: true },
    select: { id: true, category: true },
  });

  const now = new Date();
  const windowStart = new Date(now.getTime() - SIGNAL_WINDOW_MINUTES * 60000);

  let recomputed = 0;
  for (const place of places) {
    const signals = await prisma.signal.findMany({
      where: { place_id: place.id, created_at: { gte: windowStart } },
      orderBy: { created_at: 'desc' },
    });

    const estimate = computeNowEstimate(signals, now);
    const forecast = computeForecast(place.category, estimate.crowdLevel, now);
    const bestWindows = computeBestWindows(forecast);

    await prisma.prediction.upsert({
      where: { place_id: place.id },
      update: {
        now_crowd_level: estimate.crowdLevel,
        now_wait_band: estimate.waitBand,
        confidence: estimate.confidence,
        confidence_score: estimate.confidenceScore,
        last_signal_at: estimate.lastSignalAt,
        forecast_json: JSON.stringify(forecast),
        best_windows_json: JSON.stringify(bestWindows),
        generated_at: now,
      },
      create: {
        place_id: place.id,
        now_crowd_level: estimate.crowdLevel,
        now_wait_band: estimate.waitBand,
        confidence: estimate.confidence,
        confidence_score: estimate.confidenceScore,
        last_signal_at: estimate.lastSignalAt,
        forecast_json: JSON.stringify(forecast),
        best_windows_json: JSON.stringify(bestWindows),
        generated_at: now,
      },
    });

    recomputed++;
  }

  const duration = Date.now() - start;
  console.log(`[RECOMPUTE] Completed: ${recomputed} places in ${duration}ms`);
}

main()
  .catch((e) => { console.error('[RECOMPUTE] Error:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
