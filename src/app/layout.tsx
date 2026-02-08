import type { Metadata } from 'next';
import { Inter, Cairo } from 'next/font/google';
import './globals.css';
import ThemeToggle from '../components/ThemeToggle';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  display: 'swap',
  variable: '--font-latin',
});

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  weight: ['400', '500', '600'],
  display: 'swap',
  variable: '--font-arabic',
});

export const metadata: Metadata = {
  title: 'Riyadh Demand Loop',
  description: 'Real-time crowd & wait predictions for Riyadh cafes and restaurants',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" className={`${inter.variable} ${cairo.variable}`} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("theme");var d=t==="dark"||(t!=="light"&&window.matchMedia("(prefers-color-scheme:dark)").matches);document.documentElement.classList.toggle("dark",d)}catch(e){}})()`,
          }}
        />
        <nav className="sticky top-0 z-[100] border-b border-[rgb(var(--border))]/60 bg-[rgb(var(--bg))]/80 backdrop-blur-xl supports-[backdrop-filter]:bg-[rgb(var(--bg))]/60">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-3 h-14">
            <a
              href="/"
              data-testid="link-home"
              className="text-lg font-semibold text-[rgb(var(--text))] tracking-tight no-underline"
            >
              Riyadh Demand Loop
            </a>
            <div className="flex items-center gap-1 flex-wrap">
              <a
                href="/"
                data-testid="link-trending"
                className="px-3 py-1.5 rounded-xl text-sm font-medium text-[rgb(var(--text2))] no-underline transition-colors duration-150 ease-out hover:bg-[rgb(var(--surface2))]"
              >
                Trending
              </a>
              <a
                href="/map"
                data-testid="link-map"
                className="px-3 py-1.5 rounded-xl text-sm font-medium text-[rgb(var(--text2))] no-underline transition-colors duration-150 ease-out hover:bg-[rgb(var(--surface2))]"
              >
                Map
              </a>
              <ThemeToggle />
            </div>
          </div>
        </nav>
        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
          {children}
        </main>
      </body>
    </html>
  );
}
