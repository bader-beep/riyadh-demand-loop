'use client';

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
  toRiyadhDateTime,
} from '../lib/ui-helpers';

interface TrendingItem {
  rank: number;
  place: {
    id: string;
    nameAr: string;
    nameEn?: string;
    category: string;
    district: string;
    family?: {
      kids: boolean;
      stroller: boolean;
      prayerRoom: boolean;
      parkingEase: string;
    };
  };
  demand: {
    crowdLevel: string;
    waitBand: string;
    confidence: string;
    lastUpdated: string;
  };
  bestTime: { start: string; end: string } | null;
}

function FamilyIcon({ type }: { type: string }) {
  const cls = "w-3.5 h-3.5";
  switch (type) {
    case 'kids':
      return <svg className={cls} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="4" r="2"/><path d="M12 6v6"/><path d="M8 18l4-6 4 6"/></svg>;
    case 'stroller':
      return <svg className={cls} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="19" r="2"/><circle cx="18" cy="19" r="2"/><path d="M6 17H3V7l3 3h7l1-4h3v4"/><path d="M14 10l-3 7h7"/></svg>;
    case 'prayer':
      return <svg className={cls} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>;
    case 'parking':
      return <svg className={cls} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 17V7h4a3 3 0 010 6H9"/></svg>;
    default:
      return null;
  }
}

export function TrendingCard({ item, featured = false }: { item: TrendingItem; featured?: boolean }) {
  const family = item.place.family;
  const familyChips: { type: string; label: string }[] = [];
  if (family) {
    if (family.kids) familyChips.push({ type: 'kids', label: 'Kids' });
    if (family.stroller) familyChips.push({ type: 'stroller', label: 'Stroller' });
    if (family.prayerRoom) familyChips.push({ type: 'prayer', label: 'Prayer' });
    if (family.parkingEase) {
      const pl = family.parkingEase === 'easy' ? 'Easy P' : family.parkingEase === 'medium' ? 'Med P' : 'Hard P';
      familyChips.push({ type: 'parking', label: pl });
    }
  }

  return (
    <a
      href={`/place/${item.place.id}`}
      data-testid={`card-trending-${item.rank}`}
      className="block no-underline group"
    >
      <div className={`${Tokens.layout.card} ${Tokens.layout.cardHover} ${featured ? 'p-5' : 'p-4'} h-full flex flex-col`}>
        <div className="flex items-start gap-3">
          <span className={`flex-shrink-0 rounded-full bg-[rgb(var(--primary))] text-white text-xs font-bold flex items-center justify-center ${featured ? 'w-8 h-8' : 'w-7 h-7'}`}>
            {item.rank}
          </span>
          <div className="flex-1 min-w-0">
            <div className={`${featured ? 'text-lg' : 'text-base'} font-semibold leading-snug text-[rgb(var(--text))] line-clamp-2`}>
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
            <span className={crowdDotClass(item.demand.crowdLevel)} />
            {crowdLabel(item.demand.crowdLevel)}
          </span>
          <span className={waitPillClass()}>
            {item.demand.waitBand} min
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2 mt-2">
          <span className={confidenceClass(item.demand.confidence)}>
            {confidenceLabel(item.demand.confidence)}
          </span>
          <span className="text-[rgb(var(--muted))] text-[10px]">
            {toRiyadhDateTime(item.demand.lastUpdated)}
          </span>
        </div>

        <div className="mt-2.5">
          <span className={bestTimeBadgeClass(item.bestTime)}>
            {bestTimeText(item.bestTime)}
          </span>
        </div>

        {familyChips.length > 0 && (
          <div className="flex flex-wrap items-center gap-1 mt-3 pt-3 border-t border-[rgb(var(--border))]/30">
            {familyChips.map((chip) => (
              <span
                key={chip.type}
                className="inline-flex items-center gap-1 text-[10px] font-medium text-[rgb(var(--muted))]"
              >
                <FamilyIcon type={chip.type} />
                {chip.label}
              </span>
            ))}
          </div>
        )}
      </div>
    </a>
  );
}

export function SkeletonCard({ featured = false }: { featured?: boolean }) {
  return (
    <div className={`${Tokens.layout.card} ${featured ? 'p-5' : 'p-4'} animate-pulse`}>
      <div className="flex items-start gap-3">
        <div className={`flex-shrink-0 rounded-full bg-[rgb(var(--surface2))] ${featured ? 'w-8 h-8' : 'w-7 h-7'}`} />
        <div className="flex-1 min-w-0 space-y-2">
          <div className="h-4 bg-[rgb(var(--surface2))] rounded-lg w-3/4" />
          <div className="h-3 bg-[rgb(var(--surface2))] rounded-lg w-1/2" />
        </div>
        <div className="h-5 w-14 bg-[rgb(var(--surface2))] rounded-full flex-shrink-0" />
      </div>
      <div className="flex gap-1.5 mt-3">
        <div className="h-6 w-16 bg-[rgb(var(--surface2))] rounded-full" />
        <div className="h-6 w-20 bg-[rgb(var(--surface2))] rounded-full" />
      </div>
      <div className="mt-2">
        <div className="h-3 bg-[rgb(var(--surface2))] rounded-lg w-24" />
      </div>
      <div className="mt-2.5">
        <div className="h-6 w-32 bg-[rgb(var(--surface2))] rounded-full" />
      </div>
    </div>
  );
}
