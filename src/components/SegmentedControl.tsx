'use client';

import { useRef, useEffect, useState, useCallback } from 'react';

interface SegmentedControlProps {
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  'data-testid'?: string;
}

export default function SegmentedControl({ options, value, onChange, 'data-testid': testId }: SegmentedControlProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState<{ offset: number; width: number }>({ offset: 0, width: 0 });

  useEffect(() => {
    function update() {
      if (!containerRef.current) return;
      const idx = options.findIndex((o) => o.value === value);
      const buttons = containerRef.current.querySelectorAll<HTMLButtonElement>('[role="radio"]');
      if (buttons[idx]) {
        const btn = buttons[idx];
        const container = containerRef.current;
        const containerRect = container.getBoundingClientRect();
        const btnRect = btn.getBoundingClientRect();
        const isRtl = getComputedStyle(container).direction === 'rtl';
        const offset = isRtl
          ? containerRect.right - btnRect.right
          : btnRect.left - containerRect.left;
        setIndicatorStyle({ offset, width: btnRect.width });
      }
    }
    update();
    const ro = new ResizeObserver(update);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [value, options]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const isRtl = containerRef.current
        ? getComputedStyle(containerRef.current).direction === 'rtl'
        : false;
      const idx = options.findIndex((o) => o.value === value);
      let next = idx;

      if (e.key === 'ArrowRight') {
        next = isRtl
          ? (idx - 1 + options.length) % options.length
          : (idx + 1) % options.length;
      } else if (e.key === 'ArrowLeft') {
        next = isRtl
          ? (idx + 1) % options.length
          : (idx - 1 + options.length) % options.length;
      } else if (e.key === 'Home') {
        next = 0;
      } else if (e.key === 'End') {
        next = options.length - 1;
      } else {
        return;
      }

      e.preventDefault();
      onChange(options[next].value);

      requestAnimationFrame(() => {
        const buttons = containerRef.current?.querySelectorAll<HTMLButtonElement>('[role="radio"]');
        buttons?.[next]?.focus();
      });
    },
    [options, value, onChange]
  );

  return (
    <div
      ref={containerRef}
      data-testid={testId}
      role="radiogroup"
      aria-label="Category"
      className="relative inline-flex items-center rounded-full bg-[rgb(var(--surface2))]/80 p-1 border border-[rgb(var(--border))]/30"
    >
      <div
        className="absolute top-1 rounded-full bg-[rgb(var(--surface))] shadow-[0_1px_3px_rgba(0,0,0,0.06)] dark:bg-[rgba(255,255,255,0.1)] dark:shadow-[0_1px_2px_rgba(0,0,0,0.3)] transition-all duration-200 ease-out"
        style={{
          insetInlineStart: `${indicatorStyle.offset}px`,
          width: `${indicatorStyle.width}px`,
          height: 'calc(100% - 8px)',
        }}
        aria-hidden="true"
      />
      {options.map((opt) => {
        const isSelected = value === opt.value;
        return (
          <button
            key={opt.value}
            role="radio"
            aria-checked={isSelected}
            tabIndex={isSelected ? 0 : -1}
            data-testid={testId ? `${testId}-${opt.value}` : undefined}
            onClick={() => onChange(opt.value)}
            onKeyDown={handleKeyDown}
            className={`relative z-10 px-5 py-1.5 text-[13px] font-medium rounded-full transition-colors duration-200 ease-out select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--primary))]/40 ${
              isSelected
                ? 'text-[rgb(var(--text))]'
                : 'text-[rgb(var(--muted))] hover:text-[rgb(var(--text2))]'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
