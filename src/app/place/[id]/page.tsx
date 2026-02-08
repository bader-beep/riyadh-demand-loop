'use client';

import { useState, useEffect } from 'react';
import { Tokens } from '../../../lib/ui/tokens';
import {
  crowdBadgeClass,
  crowdDotClass,
  crowdLabel,
  waitPillClass,
  confidenceLabel,
  confidenceClass,
  bestTimeText,
  bestTimeBadgeClass,
  categoryBadgeClass,
  toRiyadhTime,
  toRiyadhDateTime,
  getFamilyChips,
  familyChipClass,
} from '../../../lib/ui-helpers';

interface PlaceDetail {
  place: {
    id: string;
    nameAr: string;
    nameEn: string;
    category: string;
    district: string;
    lat: number;
    lng: number;
    family: {
      kids: boolean;
      stroller: boolean;
      prayerRoom: boolean;
      parkingEase: string;
    };
    status: {
      openNow: boolean | null;
      hoursKnown: boolean;
    };
  };
  now: {
    crowdLevel: string;
    waitBand: string;
    confidence: string;
    confidenceScore: number;
    lastUpdated: string;
  };
  forecastNext6Hours: {
    hour: string;
    crowdLevel: string;
    waitBand: string;
  }[];
  bestTimeWindows: {
    start: string;
    end: string;
    label: string;
  }[];
  alternatives: {
    id: string;
    nameAr: string;
    category: string;
    district: string;
    demand: {
      crowdLevel: string;
      waitBand: string;
      confidence: string;
      lastUpdated: string;
    };
    distanceKm: number;
  }[];
}

const selectClass = `${Tokens.input.base} ${Tokens.input.focus}`;

export default function PlaceDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const [data, setData] = useState<PlaceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showCheckin, setShowCheckin] = useState(false);
  const [checkinCrowd, setCheckinCrowd] = useState('medium');
  const [checkinWait, setCheckinWait] = useState('10-20');
  const [submitting, setSubmitting] = useState(false);
  const [checkinMsg, setCheckinMsg] = useState('');

  useEffect(() => {
    async function fetchPlace() {
      try {
        const res = await fetch(`/api/place/${id}`);
        if (res.status === 404) {
          setError('Place not found');
          return;
        }
        const json = await res.json();
        if (json.error) {
          setError(json.error.message);
          return;
        }
        setData(json);
      } catch {
        setError('Failed to load place');
      } finally {
        setLoading(false);
      }
    }
    fetchPlace();
  }, [id]);

  async function handleCheckin() {
    setSubmitting(true);
    setCheckinMsg('');
    try {
      const res = await fetch('/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          placeId: id,
          crowdLevel: checkinCrowd,
          waitBand: checkinWait,
        }),
      });
      const json = await res.json();
      if (res.ok && json.ok) {
        setCheckinMsg('Check-in submitted! Thank you.');
        setShowCheckin(false);
        const refreshRes = await fetch(`/api/place/${id}`);
        const refreshData = await refreshRes.json();
        if (!refreshData.error) setData(refreshData);
      } else {
        setCheckinMsg(json.error?.message || 'Check-in failed');
      }
    } catch {
      setCheckinMsg('Network error');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="text-center py-16 text-[rgb(var(--muted))]">Loading...</div>;
  if (error) return <div className="text-center py-16 text-[rgb(var(--danger))]">{error}</div>;
  if (!data) return <div className="text-center py-16 text-[rgb(var(--muted))]">No data</div>;

  const { place, now, forecastNext6Hours, bestTimeWindows, alternatives } = data;
  const familyChips = getFamilyChips(place.family);
  const firstBestTime = bestTimeWindows.length > 0
    ? { start: bestTimeWindows[0].start, end: bestTimeWindows[0].end }
    : null;

  return (
    <div className={Tokens.layout.section}>
      <div>
        <h1 className={Tokens.text.title}>
          {place.nameAr}
        </h1>
        <p className="text-sm leading-6 text-[rgb(var(--muted))] mt-1">{place.nameEn}</p>
        <div className="flex flex-wrap items-center gap-2 mt-3">
          <span className={categoryBadgeClass()}>{place.category}</span>
          <span className={Tokens.text.caption}>{place.district}</span>
          {place.status.hoursKnown && (
            <span className={`${Tokens.pill.base} ${place.status.openNow ? Tokens.demand.low : Tokens.demand.high}`}>
              {place.status.openNow ? 'Open' : 'Closed'}
            </span>
          )}
          <span className={bestTimeBadgeClass(firstBestTime)}>
            {bestTimeText(firstBestTime)}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 mt-3">
          {familyChips.map((chip, i) => (
            <span key={i} className={familyChipClass()}>
              {chip.label}
            </span>
          ))}
        </div>
      </div>

      <div className={`${Tokens.layout.card} bg-[rgb(var(--primary))]/5 border-[rgb(var(--primary))]/20 p-4 sm:p-5`}>
        <div className={`${Tokens.text.section} mb-3`}>Current Status</div>
        <div className="flex flex-wrap items-center gap-2">
          <span className={crowdBadgeClass(now.crowdLevel)}>
            <span className={crowdDotClass(now.crowdLevel)}></span>
            {crowdLabel(now.crowdLevel)}
          </span>
          <span className={waitPillClass()}>{now.waitBand} min</span>
        </div>
        <div className="flex flex-wrap items-center gap-3 mt-3">
          <span className={confidenceClass(now.confidence)}>
            {confidenceLabel(now.confidence)}
          </span>
          <span className={Tokens.text.caption}>
            Updated {toRiyadhDateTime(now.lastUpdated)}
          </span>
        </div>
      </div>

      <div>
        {checkinMsg && (
          <div className={`rounded-2xl px-4 py-3 text-sm font-medium mb-3 ${checkinMsg.includes('Thank') ? 'bg-[rgb(var(--success))]/10 text-[rgb(var(--success))]' : 'bg-[rgb(var(--danger))]/10 text-[rgb(var(--danger))]'}`}>
            {checkinMsg}
          </div>
        )}
        {!showCheckin ? (
          <button
            onClick={() => setShowCheckin(true)}
            data-testid="button-checkin"
            className={`w-full ${Tokens.button.primary}`}
          >
            Check In
          </button>
        ) : (
          <div className={`${Tokens.layout.card} p-4 sm:p-5 max-w-md mx-auto`}>
            <h3 className={`${Tokens.text.section} mb-4`}>How is it right now?</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[rgb(var(--text))] mb-1.5">Crowd Level</label>
                <select
                  value={checkinCrowd}
                  onChange={(e) => setCheckinCrowd(e.target.value)}
                  data-testid="select-checkin-crowd"
                  className={selectClass}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[rgb(var(--text))] mb-1.5">Wait Time</label>
                <select
                  value={checkinWait}
                  onChange={(e) => setCheckinWait(e.target.value)}
                  data-testid="select-checkin-wait"
                  className={selectClass}
                >
                  <option value="0-10">0-10 min</option>
                  <option value="10-20">10-20 min</option>
                  <option value="20-40">20-40 min</option>
                  <option value="40+">40+ min</option>
                </select>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleCheckin}
                  disabled={submitting}
                  data-testid="button-checkin-submit"
                  className={`flex-1 ${Tokens.button.primary} disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {submitting ? 'Submitting...' : 'Submit'}
                </button>
                <button
                  onClick={() => setShowCheckin(false)}
                  data-testid="button-checkin-cancel"
                  className={`px-4 ${Tokens.button.secondary}`}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div>
        <h2 className={`${Tokens.text.section} mb-3`}>Forecast (Next 6 Hours)</h2>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {forecastNext6Hours.map((f, i) => (
            <div key={i} className={`${Tokens.layout.card} p-3 text-center`}>
              <div className="text-xs font-semibold text-[rgb(var(--text))] mb-2">{toRiyadhTime(f.hour)}</div>
              <span className={crowdBadgeClass(f.crowdLevel)}>
                <span className={crowdDotClass(f.crowdLevel)}></span>
                {crowdLabel(f.crowdLevel)}
              </span>
              <div className={`${Tokens.text.caption} mt-1.5`}>{f.waitBand} min</div>
            </div>
          ))}
        </div>
      </div>

      {bestTimeWindows.length > 0 && (
        <div>
          <h2 className={`${Tokens.text.section} mb-3`}>Best Times to Visit</h2>
          <div className="flex flex-wrap gap-3">
            {bestTimeWindows.map((w, i) => (
              <div key={i} className={`${Tokens.layout.card} p-4 flex-1 min-w-[180px]`}>
                <span className={`${Tokens.pill.base} ${Tokens.demand.low}`}>
                  {w.label}
                </span>
                <div className="text-sm font-medium text-[rgb(var(--text))] mt-2">
                  {toRiyadhTime(w.start)} - {toRiyadhTime(w.end)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {alternatives.length > 0 && (
        <div>
          <h2 className={`${Tokens.text.section} mb-3`}>Alternatives Nearby</h2>
          <div className={`divide-y ${Tokens.layout.divider} rounded-2xl border border-[rgb(var(--border))]/60 bg-[rgb(var(--surface))] overflow-hidden`}>
            {alternatives.map((alt) => (
              <a
                key={alt.id}
                href={`/place/${alt.id}`}
                data-testid={`link-alt-${alt.id}`}
                className="flex items-center justify-between px-4 py-3 no-underline text-inherit transition-colors duration-150 ease-out hover:bg-[rgb(var(--surface2))]"
              >
                <div>
                  <div className="text-sm font-semibold text-[rgb(var(--text))]">{alt.nameAr}</div>
                  <div className={`${Tokens.text.caption} mt-0.5`}>
                    {alt.district} &middot; {alt.distanceKm} km
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    <span className={crowdBadgeClass(alt.demand.crowdLevel)}>
                      <span className={crowdDotClass(alt.demand.crowdLevel)}></span>
                      {crowdLabel(alt.demand.crowdLevel)}
                    </span>
                    <span className={waitPillClass()}>{alt.demand.waitBand} min</span>
                    <span className={confidenceClass(alt.demand.confidence)}>
                      {confidenceLabel(alt.demand.confidence)}
                    </span>
                  </div>
                </div>
                <span className="text-[rgb(var(--primary))] font-semibold text-lg">&larr;</span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
