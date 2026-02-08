export const Tokens = {
  layout: {
    page: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8",
    section: "space-y-6",
    card: "rounded-2xl border border-[rgb(var(--border))]/50 bg-[rgb(var(--surface))] shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:shadow-none",
    cardHover: "card-hover-lift",
    divider: "border-[rgb(var(--border))]/40",
  },
  text: {
    title: "page-title text-2xl font-semibold tracking-tight leading-tight text-[rgb(var(--text))]",
    cardTitle: "card-title text-base font-semibold leading-snug text-[rgb(var(--text))]",
    section: "section-label text-[11px] font-semibold uppercase tracking-widest text-[rgb(var(--muted))]/80",
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
    secondary: "bg-[rgb(var(--surface2))] text-[rgb(var(--text2))] font-medium text-sm py-2.5 rounded-xl border border-[rgb(var(--border))]/40 hover:bg-[rgb(var(--border))]/40 active:scale-[0.98] transition-all duration-150 ease-out focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary))]/30 focus:ring-offset-2 focus:ring-offset-[rgb(var(--bg))]",
    ghost: "text-[rgb(var(--text2))] font-medium text-sm py-2.5 rounded-xl hover:bg-[rgb(var(--surface2))] active:scale-[0.98] transition-all duration-150 ease-out focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary))]/30 focus:ring-offset-2 focus:ring-offset-[rgb(var(--bg))]",
  },
  input: {
    base: "w-full text-sm leading-6 border border-[rgb(var(--border))]/60 rounded-2xl px-3.5 py-2.5 bg-[rgb(var(--surface))] text-[rgb(var(--text))] transition-all duration-150 ease-out placeholder:text-[rgb(var(--muted))]",
    focus: "focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary))]/20 focus:border-[rgb(var(--primary))]/50",
  },
  pill: {
    base: "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium leading-5",
    bestTime: "bg-[rgb(var(--primary))]/8 text-[rgb(var(--primary))]",
    waitBand: "bg-[rgb(var(--surface2))] text-[rgb(var(--text2))]",
    category: "bg-[rgb(var(--primary))]/8 text-[rgb(var(--primary))] capitalize",
    family: "bg-[rgb(var(--surface2))] text-[rgb(var(--text2))]",
  },
  demand: {
    low: "bg-[rgb(var(--success))]/8 text-[rgb(var(--success))]",
    medium: "bg-[rgb(var(--warning))]/8 text-[rgb(var(--warning))]",
    high: "bg-[rgb(var(--danger))]/8 text-[rgb(var(--danger))]",
    dotLow: "w-1.5 h-1.5 rounded-full bg-[rgb(var(--success))]",
    dotMed: "w-1.5 h-1.5 rounded-full bg-[rgb(var(--warning))]",
    dotHigh: "w-1.5 h-1.5 rounded-full bg-[rgb(var(--danger))]",
  },
};
