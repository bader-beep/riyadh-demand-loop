# Riyadh Demand Loop

## Overview

Riyadh Demand Loop is a real-time crowd and wait-time prediction platform for cafes and restaurants in Riyadh, Saudi Arabia. Users can see trending places, view crowd levels on an interactive map, check in to report current conditions, and get recommendations for the best times to visit. The app targets Arabic-speaking users (RTL layout) and displays times in the Asia/Riyadh timezone.

**Key features:**
- Trending page ranking places by demand signals
- Interactive Leaflet map with color-coded crowd pins
- Individual place detail pages with 6-hour forecasts and best-time windows
- User check-in system for crowdsourcing crowd/wait data
- Family-friendly filters (kids, stroller, prayer room, parking ease)
- Open-now filtering based on parsed hours data

## Recent Changes

### Design System Pack (Feb 2026)
- **Font pairing**: Inter (Latin) + Cairo (Arabic) via `next/font/google` — weights 400/500/600
  - Fallback stack: system-ui, -apple-system, Segoe UI, Roboto, sans-serif
  - CSS variables: `--font-latin` (Inter), `--font-arabic` (Cairo)
- **Color palette**: Apple-inspired neutral base + blue accent
  - Light: `--primary: 0 122 255` (Apple blue), surfaces white/zinc
  - Dark: `--primary: 10 132 255`, surfaces zinc/neutral dark
  - State colors as CSS variables: `--success`, `--warning`, `--danger` (Apple-like green/orange/red)
- **Shapes**: rounded-2xl for cards/panels, rounded-full for pills, rounded-xl for inputs/buttons
- **Surfaces**: 1px borders + soft shadow `shadow-[0_1px_2px_rgba(0,0,0,0.04)]`, dark mode removes shadows
  - Card hover: `shadow-[0_6px_16px_rgba(0,0,0,0.06)]` (light only)
- **Motion**: `transition-colors duration-150 ease-out`, `active:scale-[0.98]` for tap feedback
- **Tokens file**: `src/lib/ui/tokens.ts` exports layout, text, surface, button, input, pill, demand tokens
  - All tokens use CSS variable-based colors (`rgb(var(--name))`) — never raw hex
- **Theme**: light/dark/system toggle with localStorage persistence, .dark class on `<html>`
- **RTL**: `<html dir="rtl" lang="ar">` by default; numerals remain readable
- **Backdrop-blur navbar**: sticky nav with `backdrop-blur-xl` and semi-transparent background

### Design Token Reference
```
Tokens.layout.card     → rounded-2xl border + surface bg + subtle shadow
Tokens.text.title      → text-2xl font-semibold tracking-tight leading-tight
Tokens.text.body       → text-sm leading-6
Tokens.text.caption    → text-xs leading-5 text-muted
Tokens.button.primary  → blue bg, white text, rounded-xl, hover + active:scale
Tokens.pill.base       → rounded-full px-3 py-1 text-xs font-medium
Tokens.demand.low/med/high → CSS-var-based success/warning/danger colors
```

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Dual Framework Setup (Important)

This project has **two coexisting frontend/backend patterns** that need to be understood:

1. **Next.js App Router (primary application)** — Located in `src/app/`. This is the actual working application with pages, API routes, and business logic. Uses Next.js 14 with the App Router pattern.

2. **Vite + Express + React (scaffolding/template)** — Located in `client/` and `server/`. This appears to be a starter template with shadcn/ui components, Express server, and Vite dev setup. The `client/src/components/ui/` directory contains a full set of shadcn/ui components. The Express server in `server/` has basic routing and in-memory storage.

When working on this project, the **Next.js app in `src/app/`** is the primary application. The `client/` directory primarily provides UI component infrastructure.

### Next.js App Router Structure

- **Pages**: `src/app/page.tsx` (trending), `src/app/map/page.tsx` (map view), `src/app/place/[id]/page.tsx` (place detail)
- **API Routes**: All under `src/app/api/` — `trending/`, `places/`, `checkin/`, `health/`, `dev/recompute/`
- **All pages are client components** (`'use client'`) that fetch data from the API routes

### Data Layer — Prisma with SQLite

- **ORM**: Prisma (`@prisma/client` v5.22)
- **Database**: SQLite (`file:./dev.db` hardcoded in `src/lib/prisma.ts`)
- **Key models**: `Place`, `Signal`, `Prediction` (inferred from usage in API routes and recompute logic)
- **Prisma client** is instantiated as a singleton in `src/lib/prisma.ts` with global caching for dev mode
- **Note**: There is also a Drizzle schema in `shared/schema.ts` defining a `users` table for Postgres — this is from the template scaffolding and is separate from the Prisma-based application data

### Shared Schema Conflict

The `shared/schema.ts` file uses **Drizzle ORM with PostgreSQL** for a basic users table. This is part of the Express/Vite template layer and is NOT used by the main Next.js application. The main app uses **Prisma with SQLite**. If migrating databases, be aware of this split.

### Business Logic Libraries (`src/lib/`)

- **`algorithms.ts`** — Core prediction algorithms: `computeNowEstimate()` (weighted average with exponential decay over 120-min window), `computeForecast()`, `computeBestWindows()`, `computeTrendingScore()`
- **`recompute.ts`** — Batch recomputation of predictions for all active places, upserts into `Prediction` table
- **`geo.ts`** — Haversine distance and bounding box calculations for proximity queries
- **`openNow.ts`** — Parses JSON hours data to determine if a place is currently open (handles overnight ranges)
- **`rateLimit.ts`** — In-memory rate limiter for check-in endpoint
- **`constants.ts`** — Enum mappings (crowd levels, wait bands, parking ease) and API/DB conversion functions
- **`logger.ts`** — Simple structured logger
- **`ui/tokens.ts`** — Design system tokens: layout, text, surface, button, input, pill, demand
- **`ui-helpers.ts`** — UI helper functions: crowd badges, wait pills, confidence labels, time formatting, family chips

### Scripts

- **`scripts/seed.mjs`** — Seeds the database with place data (likely from CSV)
- **`scripts/recompute.mjs`** — Runs prediction recomputation offline
- **`scripts/verify.mjs`** — Verification script
- **Setup command**: `npm run setup` runs prisma generate → migrate deploy → seed → recompute

### Frontend Map

- Uses **Leaflet** + **react-leaflet** for the interactive map
- Map component is dynamically imported with `next/dynamic` and `ssr: false` to avoid SSR issues
- Centered on Riyadh (24.7136, 46.6753)

### API Design Patterns

- All API routes return JSON with consistent error format: `{ error: { code, message, details } }`
- Filtering supports: category, district, openNow, kids/stroller/prayerRoom, parkingEaseMin, geo radius
- Pagination via `limit` and `offset` params
- Rate limiting on check-in endpoint using in-memory store
- `force-dynamic` export on all API routes to prevent Next.js caching

## External Dependencies

### Core Framework
- **Next.js 14** — App Router for pages and API routes
- **React 18** — UI rendering
- **TypeScript 5.4** — Type safety

### Database
- **Prisma 5.22** — ORM for database access
- **SQLite** — Current database (file-based, `dev.db`). May be migrated to PostgreSQL.

### Maps
- **Leaflet 1.9** — Map rendering library
- **react-leaflet 4.2** — React bindings for Leaflet
- **OpenStreetMap tiles** — Map tile source (no API key needed)

### Fonts (via next/font/google)
- **Inter** — Latin font (weights 400/500/600)
- **Cairo** — Arabic font (weights 400/500/600)

### Data Processing
- **csv-parse 5.6** — CSV parsing for seed data import

### UI Component Libraries (from template)
- **Radix UI** — Accessible primitives (dialog, dropdown, tabs, etc.)
- **shadcn/ui** — Pre-built component set in `client/src/components/ui/`
- **Tailwind CSS 3.4** — Utility-first styling
- **class-variance-authority** — Component variant management
- **Lucide React** — Icon library
- **@tanstack/react-query** — Data fetching/caching (template layer)
- **wouter** — Client-side routing (template layer, not used by Next.js app)

### Template Layer (Express/Vite)
- **Express** — HTTP server (in `server/`)
- **Vite** — Dev server and build tool (for `client/` SPA)
- **Drizzle ORM** — Schema definition in `shared/schema.ts` (not actively used by main app)
- **Zod** — Schema validation

### No External APIs Required
- No third-party API keys are needed. The app is self-contained with its own database and OpenStreetMap tiles.
