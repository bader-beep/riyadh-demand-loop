'use client';

import { useState, useEffect, useCallback } from 'react';
import { Tokens } from '../lib/ui/tokens';
import SegmentedControl from '../components/SegmentedControl';
import FilterSheet from '../components/FilterSheet';
import { TrendingCard, SkeletonCard } from '../components/TrendingCard';

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

const CATEGORIES = [
  { value: '', label: 'All' },
  { value: 'cafe', label: 'Cafes' },
  { value: 'restaurant', label: 'Restaurants' },
];

const PAGE_SIZE = 15;

export default function TrendingPage() {
  const [items, setItems] = useState<TrendingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterOpen, setFilterOpen] = useState(false);
  const [displayCount, setDisplayCount] = useState(PAGE_SIZE);
  const [filters, setFilters] = useState({
    category: '',
    openNow: '',
    kids: false,
    stroller: false,
    prayerRoom: false,
    parkingEaseMin: '',
  });

  const activeFilterCount = [
    filters.openNow === 'true',
    filters.kids,
    filters.stroller,
    filters.prayerRoom,
    filters.parkingEaseMin !== '',
  ].filter(Boolean).length;

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
      params.set('limit', '50');

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

  useEffect(() => {
    setDisplayCount(PAGE_SIZE);
  }, [filters]);

  const featured = items.slice(0, 3);
  const rest = items.slice(3, displayCount);
  const hasMore = displayCount < items.length;

  function clearFilters() {
    setFilters({
      category: '',
      openNow: '',
      kids: false,
      stroller: false,
      prayerRoom: false,
      parkingEaseMin: '',
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className={Tokens.text.title}>
            Trending now
          </h1>
          <p className={`${Tokens.text.caption} mt-1`}>
            Based on recent activity
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <SegmentedControl
          options={CATEGORIES}
          value={filters.category}
          onChange={(v) => setFilters({ ...filters, category: v })}
          data-testid="segment-category"
        />

        <div className="flex items-center gap-2 flex-wrap">
          <button
            data-testid="button-filters"
            onClick={() => setFilterOpen(true)}
            className={`${Tokens.button.secondary} inline-flex items-center gap-2 px-4`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>
            Filters
            {activeFilterCount > 0 && (
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[rgb(var(--primary))] text-white text-[10px] font-bold">
                {activeFilterCount}
              </span>
            )}
          </button>

          <a
            href="/map"
            data-testid="button-map"
            className={`${Tokens.button.ghost} inline-flex items-center gap-2 px-4 no-underline`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>
            Map
          </a>
        </div>
      </div>

      {loading ? (
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <SkeletonCard featured />
            <SkeletonCard featured />
            <SkeletonCard featured />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>
      ) : items.length === 0 ? (
        <div className={`${Tokens.layout.card} p-10 text-center`}>
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-[rgb(var(--surface2))] flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgb(var(--muted))" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </div>
          <h3 className="text-base font-semibold text-[rgb(var(--text))] mb-1">No results found</h3>
          <p className={`${Tokens.text.caption} mb-4`}>Try adjusting your filters to see more places</p>
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <button
              data-testid="button-clear-all"
              onClick={clearFilters}
              className={`${Tokens.button.primary} px-5`}
            >
              Clear all filters
            </button>
            <button
              data-testid="button-relax-filters"
              onClick={() => setFilters({ ...filters, openNow: '', kids: false, stroller: false, prayerRoom: false, parkingEaseMin: '' })}
              className={`${Tokens.button.secondary} px-5`}
            >
              Relax filters
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {featured.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-[rgb(var(--muted))] uppercase tracking-wider mb-3" data-testid="heading-featured">
                Featured
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {featured.map((item) => (
                  <TrendingCard key={item.place.id} item={item} featured />
                ))}
              </div>
            </section>
          )}

          {rest.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-[rgb(var(--muted))] uppercase tracking-wider mb-3" data-testid="heading-all">
                All places
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {rest.map((item) => (
                  <TrendingCard key={item.place.id} item={item} />
                ))}
              </div>
            </section>
          )}

          {hasMore && (
            <div className="flex justify-center pt-2">
              <button
                data-testid="button-view-more"
                onClick={() => setDisplayCount((c) => c + PAGE_SIZE)}
                className={`${Tokens.button.secondary} px-8`}
              >
                View more
                <span className="ms-2 text-[rgb(var(--muted))] text-xs">
                  ({items.length - displayCount} remaining)
                </span>
              </button>
            </div>
          )}
        </div>
      )}

      <FilterSheet
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        filters={filters}
        onFiltersChange={setFilters}
        activeCount={activeFilterCount}
      />
    </div>
  );
}
