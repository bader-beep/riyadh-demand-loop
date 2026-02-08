'use client';

import { useEffect, useRef, useCallback } from 'react';
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
      aria-pressed={checked}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-medium transition-all duration-150 ease-out active:scale-[0.97] select-none border ${
        checked
          ? 'bg-[rgb(var(--primary))]/8 text-[rgb(var(--primary))] border-[rgb(var(--primary))]/20'
          : 'bg-[rgb(var(--surface2))]/80 text-[rgb(var(--text2))] border-[rgb(var(--border))]/30 hover:bg-[rgb(var(--border))]/30'
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

const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

export default function FilterSheet({ open, onClose, filters, onFiltersChange, activeCount }: FilterSheetProps) {
  const backdropRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<Element | null>(null);

  useEffect(() => {
    if (open) {
      triggerRef.current = document.activeElement;
      document.body.style.overflow = 'hidden';
      requestAnimationFrame(() => {
        const first = sheetRef.current?.querySelector<HTMLElement>(FOCUSABLE);
        first?.focus();
      });
    } else {
      document.body.style.overflow = '';
      if (triggerRef.current instanceof HTMLElement) {
        triggerRef.current.focus();
      }
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!open) return;

      if (e.key === 'Escape') {
        onClose();
        return;
      }

      if (e.key === 'Tab' && sheetRef.current) {
        const focusable = sheetRef.current.querySelectorAll<HTMLElement>(FOCUSABLE);
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    },
    [open, onClose]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

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
        aria-hidden="true"
        className={`fixed inset-0 z-[200] bg-black/30 backdrop-blur-sm transition-opacity ${
          open ? 'opacity-100 duration-200' : 'opacity-0 pointer-events-none duration-300 delay-75'
        }`}
      />

      <div
        ref={sheetRef}
        data-testid="filter-sheet"
        role="dialog"
        aria-modal="true"
        aria-label="Filters"
        className={`fixed z-[201] bg-[rgb(var(--surface))] motion-safe:transition-transform ${
          open ? 'motion-safe:duration-300 motion-safe:ease-out' : 'motion-safe:duration-200 motion-safe:ease-in'
        } motion-reduce:transition-none
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
              aria-label="Close filters"
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
              aria-pressed={filters.openNow === 'true'}
              className={`flex items-center justify-between w-full px-4 py-3 rounded-2xl text-[13px] font-medium transition-all duration-150 ease-out border ${
                filters.openNow === 'true'
                  ? 'bg-[rgb(var(--success))]/8 text-[rgb(var(--success))] border-[rgb(var(--success))]/20'
                  : 'bg-[rgb(var(--surface2))]/80 text-[rgb(var(--text2))] border-[rgb(var(--border))]/30'
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
