'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';

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
    <div>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 16 }}>Map</h1>

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
            id="kids-map"
            checked={filters.kids}
            onChange={(e) => setFilters({ ...filters, kids: e.target.checked })}
          />
          <label htmlFor="kids-map">Kids</label>
        </div>

        <div className="filter-group">
          <input
            type="checkbox"
            id="stroller-map"
            checked={filters.stroller}
            onChange={(e) => setFilters({ ...filters, stroller: e.target.checked })}
          />
          <label htmlFor="stroller-map">Stroller</label>
        </div>

        <div className="filter-group">
          <input
            type="checkbox"
            id="prayerRoom-map"
            checked={filters.prayerRoom}
            onChange={(e) => setFilters({ ...filters, prayerRoom: e.target.checked })}
          />
          <label htmlFor="prayerRoom-map">Prayer Room</label>
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
        <div className="message">Loading map...</div>
      ) : (
        <MapView places={places} />
      )}
    </div>
  );
}
