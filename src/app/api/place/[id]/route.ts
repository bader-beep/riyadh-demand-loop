import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/src/lib/prisma';
import { logger } from '@/src/lib/logger';
import { getOpenStatus } from '@/src/lib/openNow';
import { haversineKm, boundingBox } from '@/src/lib/geo';
import { alternativeScore } from '@/src/lib/algorithms';
import {
  categoryToApi,
  crowdToApi,
  waitBandToApi,
  confidenceToApi,
  parkingEaseToApi,
  WAIT_BAND_SCORES,
} from '@/src/lib/constants';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const place = await prisma.place.findUnique({
      where: { id },
      include: { prediction: true },
    });

    if (!place) {
      return NextResponse.json(
        { error: { code: 'PLACE_NOT_FOUND', message: 'Place not found', details: {} } },
        { status: 404 }
      );
    }

    const status = getOpenStatus(place.hours_json);
    const prediction = place.prediction;

    // Parse forecast
    let forecastNext6Hours: { hour: string; crowdLevel: string; waitBand: string }[] = [];
    if (prediction) {
      try {
        const raw = JSON.parse(prediction.forecast_json);
        forecastNext6Hours = raw.map((f: any) => ({
          hour: f.hour,
          crowdLevel: crowdToApi(f.crowdLevel),
          waitBand: waitBandToApi(f.waitBand),
        }));
      } catch { /* ignore */ }
    }

    // Ensure always 6 entries
    while (forecastNext6Hours.length < 6) {
      const lastHour = forecastNext6Hours.length > 0
        ? new Date(new Date(forecastNext6Hours[forecastNext6Hours.length - 1].hour).getTime() + 3600000)
        : new Date(Date.now() + (forecastNext6Hours.length + 1) * 3600000);
      lastHour.setMinutes(0, 0, 0);
      forecastNext6Hours.push({
        hour: lastHour.toISOString().replace(/\.\d{3}Z$/, 'Z'),
        crowdLevel: 'medium',
        waitBand: '10-20',
      });
    }

    // Parse best windows
    let bestTimeWindows: { start: string; end: string; label: string }[] = [];
    if (prediction) {
      try {
        bestTimeWindows = JSON.parse(prediction.best_windows_json);
      } catch { /* ignore */ }
    }

    // Find alternatives: same category, within radius
    let radiusKm = 4;
    let alternatives = await findAlternatives(place, radiusKm, id);

    // Expand to 6km if less than 3 results
    if (alternatives.length < 3) {
      radiusKm = 6;
      alternatives = await findAlternatives(place, radiusKm, id);
    }

    // Rank alternatives
    alternatives.sort((a, b) => b._score - a._score);

    // Return 3-6
    const altSlice = alternatives.slice(0, 6);
    const altOutput = altSlice.map(({ _score, ...rest }) => rest);

    const response = NextResponse.json({
      place: {
        id: place.id,
        nameAr: place.name_ar,
        nameEn: place.name_en,
        category: categoryToApi(place.category),
        district: place.district,
        lat: place.lat,
        lng: place.lng,
        family: {
          kids: place.kids_friendly,
          stroller: place.stroller_friendly,
          prayerRoom: place.prayer_room,
          parkingEase: parkingEaseToApi(place.parking_ease),
        },
        status: {
          openNow: status.openNow,
          hoursKnown: status.hoursKnown,
        },
      },
      now: {
        crowdLevel: prediction ? crowdToApi(prediction.now_crowd_level) : 'medium',
        waitBand: prediction ? waitBandToApi(prediction.now_wait_band) : '10-20',
        confidence: prediction ? confidenceToApi(prediction.confidence) : 'low',
        confidenceScore: prediction ? prediction.confidence_score : 0,
        lastUpdated: prediction?.generated_at?.toISOString().replace(/\.\d{3}Z$/, 'Z') || new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'),
      },
      forecastNext6Hours,
      bestTimeWindows,
      alternatives: altOutput,
    });

    return response;
  } catch (err) {
    logger.error('GET /api/place/:id error', err);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error', details: {} } },
      { status: 500 }
    );
  }
}

async function findAlternatives(
  place: { id: string; lat: number; lng: number; category: string; kids_friendly: boolean; stroller_friendly: boolean; prayer_room: boolean },
  radiusKm: number,
  excludeId: string
) {
  const bb = boundingBox(place.lat, place.lng, radiusKm);

  const nearby = await prisma.place.findMany({
    where: {
      is_active: true,
      category: place.category,
      id: { not: excludeId },
      lat: { gte: bb.minLat, lte: bb.maxLat },
      lng: { gte: bb.minLng, lte: bb.maxLng },
    },
    include: { prediction: true },
  });

  const alternatives = nearby
    .map((p) => {
      const distKm = haversineKm(place.lat, place.lng, p.lat, p.lng);
      if (distKm > radiusKm) return null;

      const pred = p.prediction;
      const waitBand = pred?.now_wait_band || '10-20';
      const confScore = pred?.confidence_score || 0;

      // Count family filter matches with the source place
      let familyMatches = 0;
      if (p.kids_friendly && place.kids_friendly) familyMatches++;
      if (p.stroller_friendly && place.stroller_friendly) familyMatches++;
      if (p.prayer_room && place.prayer_room) familyMatches++;

      const score = alternativeScore(waitBand, confScore, distKm, familyMatches);

      return {
        id: p.id,
        nameAr: p.name_ar,
        category: categoryToApi(p.category),
        district: p.district,
        demand: {
          crowdLevel: pred ? crowdToApi(pred.now_crowd_level) : 'medium',
          waitBand: pred ? waitBandToApi(pred.now_wait_band) : '10-20',
          confidence: pred ? confidenceToApi(pred.confidence) : 'low',
          lastUpdated: pred?.generated_at?.toISOString().replace(/\.\d{3}Z$/, 'Z') || new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'),
        },
        distanceKm: Math.round(distKm * 10) / 10,
        _score: score,
      };
    })
    .filter(Boolean) as any[];

  return alternatives;
}
