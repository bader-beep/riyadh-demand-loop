'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Tokens } from '../../lib/ui/tokens';

const MapView = dynamic(() => import('./MapView'), { ssr: false });

interface PlaceItem {
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

export default function MapPage() {
  const [places, setPlaces] = useState<PlaceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    category: '',
    openNow: '',
    kids: false,
    stroller: false,
    prayerRoom: false,
    parkingEaseMin: '',
  });

  const fetchPlaces = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('limit', '200');
      if (filters.category) params.set('category', filters.category);
      if (filters.openNow) params.set('openNow', filters.openNow);
      if (filters.kids) params.set('kids', 'true');
      if (filters.stroller) params.set('stroller', 'true');
      if (filters.prayerRoom) params.set('prayerRoom', 'true');
      if (filters.parkingEaseMin) params.set('parkingEaseMin', filters.parkingEaseMin);

      const res = await fetch(`/api/places?${params.toString()}`);
      const data = await res.json();
      setPlaces(data.places || []);
    } catch (err) {
      console.error('Failed to fetch places:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchPlaces();
  }, [fetchPlaces]);

  return (
    <div className="space-y-4">
      <h1 className={Tokens.text.title}>Map</h1>

      <div className={`${Tokens.layout.card} p-4 sm:p-5`}>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label className={`${Tokens.text.caption} font-semibold !text-[rgb(var(--text))]`}>Category</label>
            <select
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              data-testid="select-map-category"
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
              data-testid="select-map-open-now"
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
              data-testid="checkbox-map-kids"
              className={checkboxClass}
            />
            <span className="text-xs font-medium text-[rgb(var(--text2))]">Kids</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={filters.stroller}
              onChange={(e) => setFilters({ ...filters, stroller: e.target.checked })}
              data-testid="checkbox-map-stroller"
              className={checkboxClass}
            />
            <span className="text-xs font-medium text-[rgb(var(--text2))]">Stroller</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={filters.prayerRoom}
              onChange={(e) => setFilters({ ...filters, prayerRoom: e.target.checked })}
              data-testid="checkbox-map-prayer"
              className={checkboxClass}
            />
            <span className="text-xs font-medium text-[rgb(var(--text2))]">Prayer Room</span>
          </label>

          <div className="flex items-center gap-2">
            <label className={`${Tokens.text.caption} font-semibold !text-[rgb(var(--text))]`}>Parking</label>
            <select
              value={filters.parkingEaseMin}
              onChange={(e) => setFilters({ ...filters, parkingEaseMin: e.target.value })}
              data-testid="select-map-parking"
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
        <div className="text-center py-16 text-[rgb(var(--muted))]">Loading map...</div>
      ) : (
        <MapView places={places} />
      )}
    </div>
  );
}
