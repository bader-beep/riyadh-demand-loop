'use client';

import { useState, useEffect, useCallback } from 'react';

interface TrendingItem {
  rank: number;
  place: {
    id: string;
    nameAr: string;
    category: string;
    district: string;
  };
  demand: {
    crowdLevel: string;
    waitBand: string;
    confidence: string;
    lastUpdated: string;
  };
  bestTime: { start: string; end: string } | null;
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

export default function TrendingPage() {
  const [items, setItems] = useState<TrendingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    category: '',
    openNow: '',
    kids: false,
    stroller: false,
    prayerRoom: false,
    parkingEaseMin: '',
  });

  const fetchTrending = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.category) params.set('category', filters.category);
      if (filters.openNow) params.set('openNow', filters.openNow);
      if (filters.kids) params.set('kids', 'true');
      if (filters.stroller) params.set('stroller', 'true');
      if (filters.prayerRoom) params.set('prayerRoom', 'true');
      if (filters.parkingEaseMin) params.set('parkingEaseMin', filters.parkingEaseMin);

      const res = await fetch(`/api/trending?${params.toString()}`);
      const data = await res.json();
      setItems(data.items || []);
    } catch (err) {
      console.error('Failed to fetch trending:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchTrending();
  }, [fetchTrending]);

  return (
    <div>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 16 }}>
        Trending Now
      </h1>

      <div className="filters-bar">
        <div className="filter-group">
          <label>Category</label>
          <select
            value={filters.category}
            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
          >
            <option value="">All</option>
            <option value="cafe">Cafe</option>
            <option value="restaurant">Restaurant</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Open Now</label>
          <select
            value={filters.openNow}
            onChange={(e) => setFilters({ ...filters, openNow: e.target.value })}
          >
            <option value="">Any</option>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        </div>

        <div className="filter-group">
          <input
            type="checkbox"
            id="kids"
            checked={filters.kids}
            onChange={(e) => setFilters({ ...filters, kids: e.target.checked })}
          />
          <label htmlFor="kids">Kids</label>
        </div>

        <div className="filter-group">
          <input
            type="checkbox"
            id="stroller"
            checked={filters.stroller}
            onChange={(e) => setFilters({ ...filters, stroller: e.target.checked })}
          />
          <label htmlFor="stroller">Stroller</label>
        </div>

        <div className="filter-group">
          <input
            type="checkbox"
            id="prayerRoom"
            checked={filters.prayerRoom}
            onChange={(e) => setFilters({ ...filters, prayerRoom: e.target.checked })}
          />
          <label htmlFor="prayerRoom">Prayer Room</label>
        </div>

        <div className="filter-group">
          <label>Parking</label>
          <select
            value={filters.parkingEaseMin}
            onChange={(e) => setFilters({ ...filters, parkingEaseMin: e.target.value })}
          >
            <option value="">Any</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium+</option>
            <option value="hard">Any (incl. Hard)</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="message">Loading...</div>
      ) : items.length === 0 ? (
        <div className="message">No trending places found.</div>
      ) : (
        <div className="cards-grid">
          {items.map((item) => (
            <a key={item.place.id} href={`/place/${item.place.id}`} className="card-link">
              <div className="card">
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <span className="badge-rank">{item.rank}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>
                      {item.place.nameAr}
                    </div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                      {item.place.district}
                    </div>
                  </div>
                  <span className="badge badge-category">{item.place.category}</span>
                </div>

                <div className="badges-row">
                  <span className={`badge badge-crowd-${item.demand.crowdLevel}`}>
                    Crowd: {item.demand.crowdLevel}
                  </span>
                  <span className="badge badge-wait">
                    Wait: {item.demand.waitBand} min
                  </span>
                  <span className={`badge badge-confidence-${item.demand.confidence}`}>
                    Conf: {item.demand.confidence}
                  </span>
                </div>

                {item.bestTime && (
                  <div className="best-time">
                    Best time: {toRiyadhTime(item.bestTime.start)} -{' '}
                    {toRiyadhTime(item.bestTime.end)}
                  </div>
                )}
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
