'use client';

import { useRef, useEffect, useState } from 'react';

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
      const buttons = containerRef.current.querySelectorAll<HTMLButtonElement>('[data-segment-btn]');
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

  return (
    <div
      ref={containerRef}
      data-testid={testId}
      className="relative inline-flex items-center rounded-xl bg-[rgb(var(--surface2))] p-1"
    >
      <div
        className="absolute top-1 rounded-[10px] bg-white dark:bg-[rgba(255,255,255,0.12)] shadow-[0_1px_3px_rgba(0,0,0,0.08)] dark:shadow-[0_1px_2px_rgba(0,0,0,0.4)] transition-all duration-150 ease-out"
        style={{
          insetInlineStart: `${indicatorStyle.offset}px`,
          width: `${indicatorStyle.width}px`,
          height: 'calc(100% - 8px)',
        }}
      />
      {options.map((opt) => (
        <button
          key={opt.value}
          data-segment-btn
          data-testid={testId ? `${testId}-${opt.value}` : undefined}
          onClick={() => onChange(opt.value)}
          className={`relative z-10 px-4 py-1.5 text-sm font-medium rounded-[10px] transition-colors duration-150 ease-out select-none ${
            value === opt.value
              ? 'text-[rgb(var(--text))]'
              : 'text-[rgb(var(--muted))] hover:text-[rgb(var(--text2))]'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
