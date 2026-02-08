import { Tokens } from './ui/tokens';

export function crowdBadgeClass(level: string): string {
  const base = Tokens.pill.base;
  switch (level) {
    case 'low': return `${base} ${Tokens.demand.low}`;
    case 'medium': return `${base} ${Tokens.demand.medium}`;
    case 'high': return `${base} ${Tokens.demand.high}`;
    default: return `${base} bg-[rgb(var(--surface2))] text-[rgb(var(--muted))] ring-1 ring-[rgb(var(--border))]/60`;
  }
}

export function crowdDotClass(level: string): string {
  switch (level) {
    case 'low': return Tokens.demand.dotLow;
    case 'medium': return Tokens.demand.dotMed;
    case 'high': return Tokens.demand.dotHigh;
    default: return 'w-2 h-2 rounded-full bg-[rgb(var(--muted))]';
  }
}

export function crowdLabel(level: string): string {
  switch (level) {
    case 'low': return 'Low';
    case 'medium': return 'Medium';
    case 'high': return 'High';
    default: return level;
  }
}

export function waitPillClass(): string {
  return `${Tokens.pill.base} ${Tokens.pill.waitBand}`;
}

export function confidenceLabel(level: string): string {
  switch (level) {
    case 'high': return 'High confidence';
    case 'medium': return 'Medium confidence';
    case 'low': return 'Estimate';
    default: return level;
  }
}

export function confidenceClass(level: string): string {
  const base = 'text-xs leading-5 font-medium';
  switch (level) {
    case 'high': return `${base} text-[rgb(var(--success))]`;
    case 'medium': return `${base} text-[rgb(var(--primary))]`;
    case 'low': return `${base} text-[rgb(var(--muted))]`;
    default: return `${base} text-[rgb(var(--muted))]`;
  }
}

export function toRiyadhTime(utc: string): string {
  try {
    return new Date(utc).toLocaleTimeString('en-US', {
      timeZone: 'Asia/Riyadh',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return utc;
  }
}

export function toRiyadhDateTime(utc: string): string {
  try {
    return new Date(utc).toLocaleString('en-US', {
      timeZone: 'Asia/Riyadh',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return utc;
  }
}

export function bestTimeText(bestTime: { start: string; end: string } | null): string {
  if (!bestTime) return 'Best time: \u2014';
  return `Best: ${toRiyadhTime(bestTime.start)}\u2013${toRiyadhTime(bestTime.end)}`;
}

export function bestTimeBadgeClass(bestTime: { start: string; end: string } | null): string {
  if (!bestTime) return `${Tokens.pill.base} bg-[rgb(var(--surface2))] text-[rgb(var(--muted))] ring-1 ring-[rgb(var(--border))]/60`;
  return `${Tokens.pill.base} ${Tokens.pill.bestTime}`;
}

export interface FamilyData {
  kids: boolean;
  stroller: boolean;
  prayerRoom: boolean;
  parkingEase: string;
}

export interface FamilyChip {
  label: string;
}

export function getFamilyChips(family: FamilyData): FamilyChip[] {
  const chips: FamilyChip[] = [];
  if (family.kids) chips.push({ label: 'Kids friendly' });
  if (family.stroller) chips.push({ label: 'Stroller access' });
  if (family.prayerRoom) chips.push({ label: 'Prayer room' });
  const parkingLabel = family.parkingEase === 'easy' ? 'Easy parking' : family.parkingEase === 'medium' ? 'Med parking' : 'Hard parking';
  chips.push({ label: parkingLabel });
  return chips;
}

export function familyChipClass(): string {
  return `${Tokens.pill.base} ${Tokens.pill.family}`;
}

export function crowdCssVar(level: string): string {
  switch (level) {
    case 'low': return 'var(--success)';
    case 'medium': return 'var(--warning)';
    case 'high': return 'var(--danger)';
    default: return 'var(--muted)';
  }
}

export function categoryBadgeClass(): string {
  return `${Tokens.pill.base} ${Tokens.pill.category}`;
}
