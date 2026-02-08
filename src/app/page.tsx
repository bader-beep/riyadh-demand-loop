'use client';

import { useState, useEffect, useCallback } from 'react';
import { Tokens } from '../lib/ui/tokens';
import {
  crowdBadgeClass,
  crowdDotClass,
  crowdLabel,
  waitPillClass,
  confidenceLabel,
  confidenceClass,
  bestTimeText,
  bestTimeBadgeClass,
} from '../lib/ui-helpers';

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

const selectClass = `${Tokens.input.base} ${Tokens.input.focus} w-auto`;
const checkboxClass = 'rounded border-[rgb(var(--border))] accent-[rgb(var(--primary))]';

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
    <div className={Tokens.layout.section}>
      <h1 className={Tokens.text.title}>
        Trending Now
      </h1>

      <div className={`${Tokens.layout.card} p-4 sm:p-5`}>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label className={`${Tokens.text.caption} font-semibold !text-[rgb(var(--text))]`}>Category</label>
            <select
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              data-testid="select-category"
              className={selectClass}
            >
              <option value="">All</option>
              <option value="cafe">Cafe</option>
              <option value="restaurant">Restaurant</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className={`${Tokens.text.caption} font-semibold !text-[rgb(var(--text))]`}>Open Now</label>
            <select
              value={filters.openNow}
              onChange={(e) => setFilters({ ...filters, openNow: e.target.value })}
              data-testid="select-open-now"
              className={selectClass}
            >
              <option value="">Any</option>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </div>

          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={filters.kids}
              onChange={(e) => setFilters({ ...filters, kids: e.target.checked })}
              data-testid="checkbox-kids"
              className={checkboxClass}
            />
            <span className="text-xs font-medium text-[rgb(var(--text2))]">Kids</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={filters.stroller}
              onChange={(e) => setFilters({ ...filters, stroller: e.target.checked })}
              data-testid="checkbox-stroller"
              className={checkboxClass}
            />
            <span className="text-xs font-medium text-[rgb(var(--text2))]">Stroller</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={filters.prayerRoom}
              onChange={(e) => setFilters({ ...filters, prayerRoom: e.target.checked })}
              data-testid="checkbox-prayer"
              className={checkboxClass}
            />
            <span className="text-xs font-medium text-[rgb(var(--text2))]">Prayer Room</span>
          </label>

          <div className="flex items-center gap-2">
            <label className={`${Tokens.text.caption} font-semibold !text-[rgb(var(--text))]`}>Parking</label>
            <select
              value={filters.parkingEaseMin}
              onChange={(e) => setFilters({ ...filters, parkingEaseMin: e.target.value })}
              data-testid="select-parking"
              className={selectClass}
            >
              <option value="">Any</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium+</option>
              <option value="hard">Any (incl. Hard)</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-[rgb(var(--muted))]">Loading...</div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 text-[rgb(var(--muted))]">No trending places found.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {items.map((item) => (
            <a
              key={item.place.id}
              href={`/place/${item.place.id}`}
              data-testid={`card-trending-${item.rank}`}
              className="block no-underline group"
            >
              <div className={`${Tokens.layout.card} ${Tokens.layout.cardHover} p-4 sm:p-5`}>
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-[rgb(var(--primary))] text-white text-xs font-bold flex items-center justify-center">
                    {item.rank}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className={`${Tokens.text.cardTitle} truncate`}>
                      {item.place.nameAr}
                    </div>
                    <div className={`${Tokens.text.caption} mt-0.5`}>
                      {item.place.district}
                    </div>
                  </div>
                  <span className={`${Tokens.pill.base} ${Tokens.pill.category} flex-shrink-0`}>
                    {item.place.category}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 mt-3">
                  <span className={crowdBadgeClass(item.demand.crowdLevel)}>
                    <span className={crowdDotClass(item.demand.crowdLevel)}></span>
                    {crowdLabel(item.demand.crowdLevel)}
                  </span>
                  <span className={waitPillClass()}>
                    {item.demand.waitBand} min
                  </span>
                  <span className={confidenceClass(item.demand.confidence)}>
                    {confidenceLabel(item.demand.confidence)}
                  </span>
                </div>

                <div className="mt-2.5">
                  <span className={bestTimeBadgeClass(item.bestTime)}>
                    {bestTimeText(item.bestTime)}
                  </span>
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
