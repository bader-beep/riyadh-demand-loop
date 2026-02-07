import { PrismaClient } from '@prisma/client';
import {
  computeNowEstimate,
  computeForecast,
  computeBestWindows,
} from './algorithms';
import { SIGNAL_WINDOW_MINUTES } from './constants';
import { logger } from './logger';

/**
 * Recompute predictions for given place IDs (or all active places if none specified).
 */
export async function recomputePredictions(
  prisma: PrismaClient,
  placeIds?: string[]
): Promise<number> {
  const start = Date.now();

  const whereClause = placeIds && placeIds.length > 0
    ? { id: { in: placeIds }, is_active: true }
    : { is_active: true };

  const places = await prisma.place.findMany({
    where: whereClause,
    select: { id: true, category: true },
  });

  const now = new Date();
  const windowStart = new Date(now.getTime() - SIGNAL_WINDOW_MINUTES * 60000);

  let recomputed = 0;

  for (const place of places) {
    const signals = await prisma.signal.findMany({
      where: {
        place_id: place.id,
        created_at: { gte: windowStart },
      },
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
  logger.info(`Recompute completed: ${recomputed} places in ${duration}ms`);

  return recomputed;
}
