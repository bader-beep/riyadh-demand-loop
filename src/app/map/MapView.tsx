'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { crowdCssVar, confidenceLabel, toRiyadhTime } from '../../lib/ui-helpers';

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
  demand: {
    crowdLevel: string;
    waitBand: string;
    confidence: string;
  };
  bestTime: { start: string; end: string } | null;
}

function chipHtml(label: string): string {
  return `<span style="display:inline-flex;align-items:center;gap:3px;padding:1px 8px;border-radius:999px;font-size:11px;font-weight:500;background:rgb(var(--surface2));color:rgb(var(--text2));border:1px solid rgb(var(--border) / 0.4);white-space:nowrap;">${label}</span>`;
}

function buildFamilyHtml(f: PlaceItem['family']): string {
  const chips: string[] = [];
  if (f.kids) chips.push(chipHtml('Kids'));
  if (f.stroller) chips.push(chipHtml('Stroller'));
  if (f.prayerRoom) chips.push(chipHtml('Prayer'));
  const pl = f.parkingEase === 'easy' ? 'Easy parking' : f.parkingEase === 'medium' ? 'Med parking' : 'Hard parking';
  chips.push(chipHtml(pl));
  return chips.join(' ');
}

function confCssVar(level: string): string {
  switch (level) {
    case 'high': return 'var(--success)';
    case 'medium': return 'var(--primary)';
    default: return 'var(--muted)';
  }
}

export default function MapView({ places }: { places: PlaceItem[] }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;
    if (mapInstance.current) mapInstance.current.remove();

    const map = L.map(mapRef.current).setView([24.7136, 46.6753], 11);
    mapInstance.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    for (const place of places) {
      const colorVar = crowdCssVar(place.demand.crowdLevel);
      const confVar = confCssVar(place.demand.confidence);
      const confText = confidenceLabel(place.demand.confidence);

      const bestHtml = place.bestTime
        ? `<div style="margin-top:6px;"><span style="display:inline-flex;align-items:center;padding:2px 10px;border-radius:999px;font-size:11px;font-weight:600;background:rgb(var(--primary) / 0.1);color:rgb(${colorVar});border:1px solid rgb(var(--primary) / 0.2);">Best: ${toRiyadhTime(place.bestTime.start)}\u2013${toRiyadhTime(place.bestTime.end)}</span></div>`
        : '';

      const familyHtml = buildFamilyHtml(place.family);

      const icon = L.divIcon({
        className: '',
        html: `<div style="width:16px;height:16px;background:rgb(${colorVar});border:2.5px solid rgb(var(--surface));border-radius:50%;box-shadow:0 1px 4px rgba(0,0,0,0.25);transition:transform 0.15s ease-out;"></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });

      const marker = L.marker([place.lat, place.lng], { icon }).addTo(map);

      marker.bindPopup(`
        <div style="min-width:210px;font-family:'Inter','Cairo',system-ui,-apple-system,sans-serif;color:rgb(var(--text));background:rgb(var(--surface));border-radius:16px;">
          <div style="font-weight:600;font-size:15px;margin-bottom:2px;color:rgb(var(--text));">${place.nameAr}</div>
          <div style="color:rgb(var(--muted));font-size:13px;margin-bottom:8px;">${place.nameEn}</div>
          <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-bottom:4px;">
            <span style="display:inline-flex;align-items:center;gap:4px;padding:2px 10px;border-radius:999px;font-size:12px;font-weight:600;background:rgb(${colorVar} / 0.1);color:rgb(${colorVar});border:1px solid rgb(${colorVar} / 0.2);">
              <span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:rgb(${colorVar});"></span>
              ${place.demand.crowdLevel}
            </span>
            <span style="display:inline-flex;padding:2px 10px;border-radius:999px;font-size:12px;font-weight:500;background:rgb(var(--surface2));color:rgb(var(--text2));border:1px solid rgb(var(--border) / 0.6);">${place.demand.waitBand} min</span>
            <span style="font-size:11px;font-weight:500;color:rgb(${confVar});">${confText}</span>
          </div>
          ${bestHtml}
          <div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:8px;">${familyHtml}</div>
          <div style="font-size:12px;color:rgb(var(--muted));margin-top:8px;">${place.district} &middot; ${place.category}</div>
          <a href="/place/${place.id}" style="display:inline-flex;align-items:center;gap:4px;margin-top:10px;padding:4px 14px;border-radius:12px;background:rgb(var(--primary));color:white;font-weight:600;font-size:13px;text-decoration:none;transition:opacity 0.15s ease-out;" onmouseover="this.style.opacity='0.85'" onmouseout="this.style.opacity='1'">
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
