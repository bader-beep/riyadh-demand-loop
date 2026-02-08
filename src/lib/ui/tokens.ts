export const Tokens = {
  layout: {
    page: "max-w-6xl mx-auto px-4 sm:px-6",
    section: "space-y-6",
    card: "rounded-2xl border border-[rgb(var(--border))]/60 bg-[rgb(var(--surface))] shadow-[0_1px_2px_rgba(0,0,0,0.04)] dark:shadow-none transition-shadow duration-200 ease-out",
    cardHover: "hover:shadow-[0_6px_16px_rgba(0,0,0,0.06)] dark:hover:shadow-none",
    divider: "border-[rgb(var(--border))]/40",
  },
  text: {
    title: "text-2xl font-semibold tracking-tight leading-tight text-[rgb(var(--text))]",
    cardTitle: "text-base font-semibold leading-snug text-[rgb(var(--text))]",
    section: "text-sm font-semibold text-[rgb(var(--text))]",
    body: "text-sm leading-6 text-[rgb(var(--text))]",
    caption: "text-xs leading-5 text-[rgb(var(--muted))]",
  },
  surface: {
    bg: "bg-[rgb(var(--bg))]",
    card: "bg-[rgb(var(--surface))]",
    card2: "bg-[rgb(var(--surface2))]",
    border: "border-[rgb(var(--border))]",
  },
  button: {
    primary: "bg-[rgb(var(--primary))] text-white font-semibold text-sm py-2.5 rounded-xl hover:bg-[rgb(var(--primary2))] active:scale-[0.98] transition-all duration-150 ease-out focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary))]/40 focus:ring-offset-2 focus:ring-offset-[rgb(var(--bg))]",
    secondary: "bg-[rgb(var(--surface2))] text-[rgb(var(--text2))] font-medium text-sm py-2.5 rounded-xl hover:bg-[rgb(var(--border))]/60 active:scale-[0.98] transition-all duration-150 ease-out focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary))]/30 focus:ring-offset-2 focus:ring-offset-[rgb(var(--bg))]",
    ghost: "text-[rgb(var(--text2))] font-medium text-sm py-2.5 rounded-xl hover:bg-[rgb(var(--surface2))] active:scale-[0.98] transition-all duration-150 ease-out focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary))]/30 focus:ring-offset-2 focus:ring-offset-[rgb(var(--bg))]",
  },
  input: {
    base: "w-full text-sm leading-6 border border-[rgb(var(--border))] rounded-xl px-3 py-2.5 bg-[rgb(var(--surface))] text-[rgb(var(--text))] transition-colors duration-150 ease-out placeholder:text-[rgb(var(--muted))]",
    focus: "focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary))]/30 focus:ring-offset-2 focus:ring-offset-[rgb(var(--bg))] focus:border-[rgb(var(--primary))]",
  },
  pill: {
    base: "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium",
    bestTime: "bg-[rgb(var(--primary))]/10 text-[rgb(var(--primary))] ring-1 ring-[rgb(var(--primary))]/20",
    waitBand: "bg-[rgb(var(--surface2))] text-[rgb(var(--text2))] ring-1 ring-[rgb(var(--border))]/60",
    category: "bg-[rgb(var(--primary))]/10 text-[rgb(var(--primary))] ring-1 ring-[rgb(var(--primary))]/20 capitalize",
    family: "bg-[rgb(var(--surface2))] text-[rgb(var(--text2))] ring-1 ring-[rgb(var(--border))]/40",
  },
  demand: {
    low: "bg-[rgb(var(--success))]/10 text-[rgb(var(--success))] ring-1 ring-[rgb(var(--success))]/20",
    medium: "bg-[rgb(var(--warning))]/10 text-[rgb(var(--warning))] ring-1 ring-[rgb(var(--warning))]/20",
    high: "bg-[rgb(var(--danger))]/10 text-[rgb(var(--danger))] ring-1 ring-[rgb(var(--danger))]/20",
    dotLow: "w-2 h-2 rounded-full bg-[rgb(var(--success))]",
    dotMed: "w-2 h-2 rounded-full bg-[rgb(var(--warning))]",
    dotHigh: "w-2 h-2 rounded-full bg-[rgb(var(--danger))]",
  },
};
