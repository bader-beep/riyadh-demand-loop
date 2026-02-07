'use client';

import { useState, useEffect, use } from 'react';

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

function toRiyadhTime(utc: string): string {
  try {
    return new Date(utc).toLocaleTimeString('en-US', {
      timeZone: 'Asia/Riyadh',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return utc;
  }
}

function toRiyadhDateTime(utc: string): string {
  try {
    return new Date(utc).toLocaleString('en-US', {
      timeZone: 'Asia/Riyadh',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return utc;
  }
}

export default function PlaceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<PlaceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check-in state
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
        // Refresh data
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

  if (loading) return <div className="message">Loading...</div>;
  if (error) return <div className="message error">{error}</div>;
  if (!data) return <div className="message">No data</div>;

  const { place, now, forecastNext6Hours, bestTimeWindows, alternatives } = data;

  return (
    <div>
      <div className="place-header">
        <div className="place-name">{place.nameAr}</div>
        <div style={{ color: 'var(--text-secondary)' }}>{place.nameEn}</div>
        <div className="place-meta">
          <span className="badge badge-category">{place.category}</span>
          <span style={{ color: 'var(--text-secondary)' }}>{place.district}</span>
          {place.status.hoursKnown && (
            <span className={`badge ${place.status.openNow ? 'badge-crowd-low' : 'badge-crowd-high'}`}>
              {place.status.openNow ? 'Open' : 'Closed'}
            </span>
          )}
        </div>
        <div className="badges-row" style={{ marginTop: 8 }}>
          {place.family.kids && <span className="badge badge-family">Kids Friendly</span>}
          {place.family.stroller && <span className="badge badge-family">Stroller</span>}
          {place.family.prayerRoom && <span className="badge badge-family">Prayer Room</span>}
          <span className="badge badge-family">Parking: {place.family.parkingEase}</span>
        </div>
      </div>

      {/* Now Card */}
      <div className="now-card">
        <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>Current Status</div>
        <div className="badges-row">
          <span className={`badge badge-crowd-${now.crowdLevel}`}>
            Crowd: {now.crowdLevel}
          </span>
          <span className="badge badge-wait">Wait: {now.waitBand} min</span>
          <span className={`badge badge-confidence-${now.confidence}`}>
            Confidence: {now.confidence} ({now.confidenceScore})
          </span>
        </div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 8 }}>
          Last updated: {toRiyadhDateTime(now.lastUpdated)}
        </div>
      </div>

      {/* Check-in CTA */}
      <div style={{ marginBottom: 24 }}>
        {checkinMsg && (
          <div className={`message ${checkinMsg.includes('Thank') ? 'success' : 'error'}`} style={{ padding: 12, marginBottom: 12 }}>
            {checkinMsg}
          </div>
        )}
        {!showCheckin ? (
          <button className="btn btn-primary btn-full" onClick={() => setShowCheckin(true)}>
            Check In
          </button>
        ) : (
          <div className="card checkin-form" style={{ maxWidth: '100%' }}>
            <h3 style={{ marginBottom: 16 }}>How is it right now?</h3>
            <div className="form-group">
              <label>Crowd Level</label>
              <select value={checkinCrowd} onChange={(e) => setCheckinCrowd(e.target.value)}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div className="form-group">
              <label>Wait Time</label>
              <select value={checkinWait} onChange={(e) => setCheckinWait(e.target.value)}>
                <option value="0-10">0-10 min</option>
                <option value="10-20">10-20 min</option>
                <option value="20-40">20-40 min</option>
                <option value="40+">40+ min</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                className="btn btn-primary"
                style={{ flex: 1 }}
                onClick={handleCheckin}
                disabled={submitting}
              >
                {submitting ? 'Submitting...' : 'Submit Check-in'}
              </button>
              <button
                className="btn"
                style={{ flex: 0, background: '#e5e7eb' }}
                onClick={() => setShowCheckin(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Forecast */}
      <h2 className="section-title">Forecast (Next 6 Hours)</h2>
      <div className="forecast-grid">
        {forecastNext6Hours.map((f, i) => (
          <div key={i} className="forecast-item">
            <div className="forecast-hour">{toRiyadhTime(f.hour)}</div>
            <span className={`badge badge-crowd-${f.crowdLevel}`}>
              {f.crowdLevel}
            </span>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 4 }}>
              {f.waitBand} min
            </div>
          </div>
        ))}
      </div>

      {/* Best Time Windows */}
      {bestTimeWindows.length > 0 && (
        <>
          <h2 className="section-title">Best Times to Visit</h2>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {bestTimeWindows.map((w, i) => (
              <div key={i} className="card" style={{ flex: '1 1 200px' }}>
                <div style={{ fontWeight: 600, color: 'var(--success)' }}>{w.label}</div>
                <div>{toRiyadhTime(w.start)} - {toRiyadhTime(w.end)}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Alternatives */}
      {alternatives.length > 0 && (
        <>
          <h2 className="section-title">Alternatives Nearby</h2>
          <div className="alt-list">
            {alternatives.map((alt) => (
              <a key={alt.id} href={`/place/${alt.id}`} className="alt-item">
                <div>
                  <div style={{ fontWeight: 600 }}>{alt.nameAr}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    {alt.district} &middot; {alt.distanceKm} km
                  </div>
                  <div className="badges-row">
                    <span className={`badge badge-crowd-${alt.demand.crowdLevel}`}>
                      {alt.demand.crowdLevel}
                    </span>
                    <span className="badge badge-wait">{alt.demand.waitBand} min</span>
                  </div>
                </div>
                <span style={{ color: 'var(--primary)', fontWeight: 600 }}>&larr;</span>
              </a>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
