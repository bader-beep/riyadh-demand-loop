'use client';

import { useEffect, useRef } from 'react';
import { Tokens } from '../lib/ui/tokens';
import SegmentedControl from './SegmentedControl';

interface Filters {
  category: string;
  openNow: string;
  kids: boolean;
  stroller: boolean;
  prayerRoom: boolean;
  parkingEaseMin: string;
}

interface FilterSheetProps {
  open: boolean;
  onClose: () => void;
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  activeCount: number;
}

function ChipToggle({
  label,
  icon,
  checked,
  onChange,
  testId,
}: {
  label: string;
  icon: JSX.Element;
  checked: boolean;
  onChange: (v: boolean) => void;
  testId: string;
}) {
  return (
    <button
      data-testid={testId}
      onClick={() => onChange(!checked)}
      className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ease-out active:scale-[0.98] select-none ${
        checked
          ? 'bg-[rgb(var(--primary))]/10 text-[rgb(var(--primary))] ring-1 ring-[rgb(var(--primary))]/30'
          : 'bg-[rgb(var(--surface2))] text-[rgb(var(--text2))] ring-1 ring-[rgb(var(--border))]/40 hover:bg-[rgb(var(--border))]/30'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

const parkingOptions = [
  { value: '', label: 'Any' },
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
];

export default function FilterSheet({ open, onClose, filters, onFiltersChange, activeCount }: FilterSheetProps) {
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  useEffect(() => {
    function handleEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    if (open) {
      document.addEventListener('keydown', handleEsc);
      return () => document.removeEventListener('keydown', handleEsc);
    }
  }, [open, onClose]);

  function clearAll() {
    onFiltersChange({
      category: filters.category,
      openNow: '',
      kids: false,
      stroller: false,
      prayerRoom: false,
      parkingEaseMin: '',
    });
  }

  return (
    <>
      <div
        ref={backdropRef}
        onClick={onClose}
        className={`fixed inset-0 z-[200] bg-black/30 backdrop-blur-sm transition-opacity duration-200 ${
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      />

      <div
        data-testid="filter-sheet"
        className={`fixed z-[201] bg-[rgb(var(--surface))] transition-transform duration-300 ease-out
          max-sm:inset-x-0 max-sm:bottom-0 max-sm:rounded-t-2xl max-sm:max-h-[85vh]
          sm:top-0 sm:bottom-0 sm:right-0 sm:w-[380px] sm:border-l sm:border-[rgb(var(--border))]/60
          ${open
            ? 'max-sm:translate-y-0 sm:translate-x-0'
            : 'max-sm:translate-y-full sm:translate-x-full'
          }
        `}
      >
        <div className="flex items-center justify-between gap-3 px-5 pt-5 pb-3">
          <h2 className="text-lg font-semibold text-[rgb(var(--text))]">Filters</h2>
          <div className="flex items-center gap-2">
            {activeCount > 0 && (
              <button
                onClick={clearAll}
                data-testid="button-clear-filters"
                className="text-xs font-medium text-[rgb(var(--primary))] hover:underline"
              >
                Clear all
              </button>
            )}
            <button
              onClick={onClose}
              data-testid="button-close-filters"
              className="w-8 h-8 rounded-full flex items-center justify-center bg-[rgb(var(--surface2))] text-[rgb(var(--muted))] hover:bg-[rgb(var(--border))]/40 transition-colors duration-150"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </div>

        <div className="h-px bg-[rgb(var(--border))]/40 mx-5" />

        <div className="overflow-y-auto px-5 py-5 space-y-6 max-sm:pb-10">
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[rgb(var(--muted))]">Availability</h3>
            <button
              data-testid="toggle-open-now"
              onClick={() => onFiltersChange({ ...filters, openNow: filters.openNow === 'true' ? '' : 'true' })}
              className={`flex items-center justify-between w-full px-4 py-3 rounded-xl text-sm font-medium transition-all duration-150 ease-out ${
                filters.openNow === 'true'
                  ? 'bg-[rgb(var(--success))]/10 text-[rgb(var(--success))] ring-1 ring-[rgb(var(--success))]/20'
                  : 'bg-[rgb(var(--surface2))] text-[rgb(var(--text2))] ring-1 ring-[rgb(var(--border))]/40'
              }`}
            >
              <span className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                Open now
              </span>
              <div className={`w-10 h-6 rounded-full relative transition-colors duration-150 ${
                filters.openNow === 'true' ? 'bg-[rgb(var(--success))]' : 'bg-[rgb(var(--border))]'
              }`}>
                <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all duration-150 ${
                  filters.openNow === 'true' ? 'start-[calc(100%-22px)]' : 'start-0.5'
                }`} />
              </div>
            </button>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[rgb(var(--muted))]">Family</h3>
            <div className="flex flex-wrap gap-2">
              <ChipToggle
                label="Kids"
                icon={<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="4" r="2"/><path d="M12 6v6"/><path d="M8 18l4-6 4 6"/></svg>}
                checked={filters.kids}
                onChange={(v) => onFiltersChange({ ...filters, kids: v })}
                testId="chip-kids"
              />
              <ChipToggle
                label="Stroller"
                icon={<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="19" r="2"/><circle cx="18" cy="19" r="2"/><path d="M6 17H3V7l3 3h7l1-4h3v4"/><path d="M14 10l-3 7h7"/></svg>}
                checked={filters.stroller}
                onChange={(v) => onFiltersChange({ ...filters, stroller: v })}
                testId="chip-stroller"
              />
              <ChipToggle
                label="Prayer Room"
                icon={<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>}
                checked={filters.prayerRoom}
                onChange={(v) => onFiltersChange({ ...filters, prayerRoom: v })}
                testId="chip-prayer"
              />
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[rgb(var(--muted))]">Parking</h3>
            <SegmentedControl
              options={parkingOptions}
              value={filters.parkingEaseMin}
              onChange={(v) => onFiltersChange({ ...filters, parkingEaseMin: v })}
              data-testid="segment-parking"
            />
          </div>
        </div>

        <div className="px-5 pb-5 pt-3 border-t border-[rgb(var(--border))]/40">
          <button
            onClick={onClose}
            data-testid="button-apply-filters"
            className={`${Tokens.button.primary} w-full px-6`}
          >
            Apply filters
            {activeCount > 0 && (
              <span className="ms-2 bg-white/20 rounded-full px-2 py-0.5 text-xs">
                {activeCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </>
  );
}
