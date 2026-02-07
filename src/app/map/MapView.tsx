'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface PlaceItem {
  id: string;
  nameAr: string;
  nameEn: string;
  category: string;
  district: string;
  lat: number;
  lng: number;
  demand: {
    crowdLevel: string;
    waitBand: string;
    confidence: string;
  };
}

const CROWD_COLORS: Record<string, string> = {
  low: '#16a34a',
  medium: '#eab308',
  high: '#dc2626',
};

export default function MapView({ places }: { places: PlaceItem[] }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    if (mapInstance.current) {
      mapInstance.current.remove();
    }

    const map = L.map(mapRef.current).setView([24.7136, 46.6753], 11);
    mapInstance.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    for (const place of places) {
      const color = CROWD_COLORS[place.demand.crowdLevel] || '#6b7280';

      const icon = L.divIcon({
        className: 'custom-pin',
        html: `<div style="
          width: 16px;
          height: 16px;
          background: ${color};
          border: 2px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        "></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });

      const marker = L.marker([place.lat, place.lng], { icon }).addTo(map);

      marker.bindPopup(`
        <div style="min-width: 180px; font-family: sans-serif;">
          <div style="font-weight: 700; font-size: 1rem; margin-bottom: 4px;">${place.nameAr}</div>
          <div style="color: #6b7280; font-size: 0.85rem; margin-bottom: 6px;">${place.nameEn}</div>
          <div style="font-size: 0.8rem; margin-bottom: 4px;">
            <span style="background: ${color}; color: white; padding: 2px 8px; border-radius: 10px; font-size: 0.75rem;">
              ${place.demand.crowdLevel}
            </span>
            <span style="margin-left: 4px;">${place.demand.waitBand} min</span>
          </div>
          <div style="font-size: 0.8rem; color: #6b7280;">${place.district} &middot; ${place.category}</div>
          <a href="/place/${place.id}" style="display: block; margin-top: 8px; color: #2563eb; font-weight: 600; font-size: 0.85rem; text-decoration: none;">
            View Details &rarr;
          </a>
        </div>
      `);
    }

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [places]);

  return <div ref={mapRef} className="map-container" />;
}
