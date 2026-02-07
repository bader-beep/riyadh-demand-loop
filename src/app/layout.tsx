import type { Metadata } from 'next';
import './globals.css';

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
    <html lang="ar" dir="rtl">
      <body>
        <nav className="navbar">
          <div className="nav-content">
            <a href="/" className="nav-brand">Riyadh Demand Loop</a>
            <div className="nav-links">
              <a href="/">Trending</a>
              <a href="/map">Map</a>
            </div>
          </div>
        </nav>
        <main className="main-content">
          {children}
        </main>
      </body>
    </html>
  );
}
