# CLAUDE.md — AI Development Context



## Project: NLT Observatory (Big Data Nighttime Lights)

**Live URL:** https://nightlightobservatory.github.io/

**Repository:** https://github.com/NightLightObservatory/nightlightobservatory.github.io



## Architecture

- **Framework:** React 18 + Vite 6 (SPA, single App.jsx component)

- **Map:** MapLibre GL JS 4.x with raster tile overlay

- **Styling:** Inline CSS-in-JS with design tokens (T object)

- **Deployment:** GitHub Actions → GitHub Pages (auto-deploy on push to main)

- **Data:** Static JSON files in `public/data/` + live NTL tiles from AWS API



## Key Files

- `src/App.jsx` — Complete application (~700 lines of logic, ~1400 with blank lines)

- `index.html` — CSS overrides for MapLibre controls, scrollbars, range inputs, animations

- `public/data/admin0.json` — 9 countries (VNM, IDN, TLS, PNG, FJI, SLB, VUT, WSM, IND)

- `public/data/date-range.json` — 105 months (2012-04 to 2020-12)

- `public/data/analytics/{GID}.json` — Radiance time-series + cloud-free coverage

- `public/data/admin1/{GID}.json` — Sub-national regions with bbox



## Design System (nltgis.ai-inspired)

- **Theme:** Dark navy (#0a1628) with glassmorphism cards

- **Font:** DM Sans (Google Fonts, variable weight)

- **Accent:** Indigo (#6366f1) with hover (#818cf8)

- **Cards:** rgba(15,23,42,0.92) + backdrop-filter: blur(16px)

- **Borders:** #1e293b



## Features

- **Tour Screen:** Gradient hero with animated CTA

- **Basemap Switcher:** Dark, Light, Voyager, Satellite (Esri World Imagery)

- **Layers Panel:** NTL toggle switch + opacity slider

- **Floating Timeline:** Large play/pause, month buttons, year navigation, progress bar

- **Analytics Panel:** Stats cards (Latest, Growth, Peak), Radiance/Cloud-Free tabs

- **Interactive Charts:** SVG with hover crosshair and tooltips

- **Sidebar:** Collapsible, search, country flags, breadcrumb navigation

- **Admin1 Drill-down:** Click country → see provinces/states → fly to region



## Data Sources

- **NTL Tiles:** `https://api.lights.nltglobal.com/tiles/{date}/{z}/{x}/{y}.png` (still on AWS)

- **Static Data:** Extracted from `api.lights.nltglobal.com` and saved to `public/data/`

- **Basemaps:** CARTO (dark-matter, positron, voyager) + Esri World Imagery



## Build & Deploy

```bash

npm install --no-package-lock

npm run build    # Output: dist/

npm run dev      # Local dev server

```

Deploy is automatic via `.github/workflows/deploy.yml` on every push to main.



## Known Considerations

- NTL raster tiles still served from AWS (`api.lights.nltglobal.com`)

- Country flag emojis may render as 2-letter codes on some systems

- Extra blank lines in App.jsx from copy-paste (cosmetic, doesn't affect build)

- Admin2 data available from API but not yet in UI

- PMTiles conversion planned but not yet implemented



## API Reference (for future data extraction)

- `GET /date-range` → Array of YYYY-MM strings

- `GET /admin0` → `{ data: [{ gid, name, area, bbox }] }`

- `GET /admin1/{gid}` → `{ data: [{ gid, name, area, bbox }] }`

- `GET /ar/{gid}/{endDate}` → `{ data: { ar: [...], cf: [...], beyer: [...] } }`

- `GET /tiles/{date}/{z}/{x}/{y}.png` → 256px raster tile

