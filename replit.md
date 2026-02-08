# Riyadh Demand Loop

## Overview

Riyadh Demand Loop is a real-time platform for predicting crowd and wait times in cafes and restaurants across Riyadh, Saudi Arabia. It enables users to discover trending venues, view live crowd levels on an interactive map, and receive recommendations for optimal visiting times. The platform supports user check-ins for crowdsourced data and offers family-friendly filtering options. Designed for Arabic-speaking users with RTL layout, it displays times in the Asia/Riyadh timezone. The project aims to provide a comprehensive, user-friendly tool to enhance dining experiences in Riyadh by optimizing visit timings and reducing wait times.

## Recent Changes

### Desktop Layout Width Fix (Feb 2026)
- **Root cause**: `max-w-5xl` (1024px) on `<main>` in `LayoutShell.tsx` capped content too aggressively — on 1440px Mac with 260px sidebar, content was squeezed to 1024px
- **Fix**: Changed `max-w-5xl` → `max-w-7xl` (1280px) in `LayoutShell.tsx` and `Tokens.layout.page`
- **Result**: Content fills available width on 1440px/1280px screens; mobile unchanged

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Dual Framework Setup

The project operates with two coexisting frontend/backend patterns:

1.  **Next.js App Router (primary application):** Located in `src/app/`, this is the main application utilizing Next.js 14 with the App Router for pages and API routes.
2.  **Vite + Express + React (scaffolding/template):** Located in `client/` and `server/`, this primarily provides UI component infrastructure, including `shadcn/ui` components and a basic Express server. The main application does not use this as its core.

### Next.js App Router Structure

-   **Pages:** `src/app/page.tsx` (trending), `src/app/map/page.tsx` (map view), `src/app/place/[id]/page.tsx` (place detail). All pages are client components that fetch data from API routes.
-   **API Routes:** Located under `src/app/api/` for trending, places, check-in, health, and recomputation.

### UI/UX Decisions

-   **Two-column layout:** Desktop features a sidebar (260px) and main content; mobile uses a single column with a hamburger drawer.
-   **Navigation:** Consolidated Map/Trending links within the sidebar, removed from the trending page toolbar.
-   **Typography:** Inter (Latin) and IBM Plex Sans Arabic (Arabic) fonts are used, prioritizing Arabic for RTL layouts. Arabic typography includes specific line-height and letter-spacing adjustments.
-   **Color Palette:** Apple-inspired neutral base with a blue accent, adapting for light and dark modes. State colors (success, warning, danger) are defined via CSS variables.
-   **Shapes & Surfaces:** Rounded-2xl for cards, rounded-full for pills, and rounded-xl for inputs/buttons. Surfaces include 1px borders and soft shadows, with shadows removed in dark mode.
-   **Motion:** Subtle transitions for colors and tap feedback (`active:scale-[0.98]`). Premium animations like skeleton shimmer and card hover elevation are implemented.
-   **Accessibility:** Extensive `aria` attributes, focus management, keyboard navigation, and focus traps are implemented for components like `SegmentedControl` and `FilterSheet`.
-   **Theming:** Supports light, dark, and system themes with `localStorage` persistence.
-   **RTL Support:** Full RTL layout switching with `dir="rtl"` and `lang="ar"` on the `<html>` element.
-   **Background Canvas Presets:** Instant background switching with `data-canvas` attributes (`neutral`, `warm`, `map`, `gradient`), adapting to dark mode.
-   **Search:** Typeahead suggestions, recent searches, and keyboard navigation.
-   **Favorites:** LocalStorage-based saving and filtering of places.
-   **Geolocation:** "Near me" functionality with radius filtering and distance display.
-   **Sorting:** Advanced sorting options including trending, nearest, least-wait, and best-time.
-   **Place Detail:** Busy-now banner, 6-hour forecast timeline, confidence microcopy, and share functionality.

### Technical Implementations

-   **Data Layer:** Prisma (v5.22) with SQLite (`dev.db`) is used for the main application's ORM.
    -   **Models:** `Place`, `Signal`, `Prediction`.
    -   **Prisma Client:** Singleton instance with global caching.
-   **Business Logic:**
    -   `algorithms.ts`: Core prediction algorithms for crowd estimation, forecasting, and trending scores.
    -   `recompute.ts`: Batch recomputation logic for predictions.
    -   `geo.ts`: Haversine distance and bounding box calculations.
    -   `openNow.ts`: Parses hours data to determine open/closed status.
    -   `rateLimit.ts`: In-memory rate limiter for the check-in endpoint.
    -   `constants.ts`: Enum mappings and API/DB conversion functions.
    -   `logger.ts`: Structured logging.
    -   `ui/tokens.ts`: Centralized design system tokens.
    -   `ui-helpers.ts`: UI utility functions for badges, pills, and formatting.
-   **Frontend Map:** Uses Leaflet and `react-leaflet` with dynamic import to prevent SSR issues, centered on Riyadh.
-   **API Design:** All API routes return JSON with consistent error formatting. Supports comprehensive filtering, pagination, and rate limiting. `force-dynamic` export prevents Next.js caching.

## External Dependencies

### Core Frameworks
-   **Next.js 14**: Primary application framework.
-   **React 18**: UI rendering library.
-   **TypeScript 5.4**: For type-safe development.

### Database
-   **Prisma 5.22**: ORM for data interaction.
-   **SQLite**: Current file-based database (`dev.db`).

### Mapping
-   **Leaflet 1.9**: Interactive map library.
-   **react-leaflet 4.2**: React components for Leaflet.
-   **OpenStreetMap tiles**: Map data source.

### Typography
-   **Inter**: Latin font, integrated via `next/font/google`.
-   **IBM Plex Sans Arabic**: Arabic font, integrated via `next/font/google`.

### Data Processing
-   **csv-parse 5.6**: Used for parsing CSV data during database seeding.

### UI/Styling
-   **Radix UI**: Provides accessible UI primitives.
-   **shadcn/ui**: Component library, primarily within the template layer.
-   **Tailwind CSS 3.4**: Utility-first CSS framework.
-   **Lucide React**: Icon library.

### Development Utilities (from template)
-   **Express**: HTTP server (within the `server/` directory of the template).
-   **Vite**: Dev server and build tool (for the `client/` SPA of the template).
-   **Drizzle ORM**: Used in `shared/schema.ts` for a template-specific schema, not by the main Next.js app.
-   **Zod**: Schema validation library.