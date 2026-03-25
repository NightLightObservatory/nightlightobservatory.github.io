# CLAUDE.md - AI Development Context

## Project Overview
NLT Observatory - A GitHub Pages-based nighttime lights data visualization platform migrated from AWS. Part of the NightLightObservatory GitHub organization under the nltgis-ai enterprise.

## Architecture
- Single-page React 18 app with Vite 6 bundler
- All components in src/App.jsx (monolithic by design for web-editor maintainability)
- Static JSON data files in public/data/ (fetched at runtime)
- GitHub Actions CI/CD deploying to GitHub Pages on every push to main

## Key Technical Details

### Data Sources
- NTL raster tiles: api.lights.nltglobal.com/tiles/{date}/{z}/{x}/{y}.png (still AWS-hosted)
- Country data: /data/admin0.json (9 EAP countries)
- Admin1 regions: /data/admin1/{GID}.json (real data from API)
- Analytics: /data/analytics/{GID}.json (real radiance time-series from API)
- Date range: /data/date-range.json (105 months: 2012-04 to 2020-12)

### Design System (nltgis.ai tokens)
- Background: #0a1628 (navy dark)
- Card: rgba(22,29,47,0.92) with blur(12px) backdrop
- Accent: #6366f1 (indigo)
- Font: DM Sans from Google Fonts
- Border: #1e293b

### Map Configuration
- Basemap: CARTO Dark Matter GL style
- NTL tiles: Raster overlay with adjustable opacity
- MapLibre GL JS 4.x
- Countries have bbox for fitBounds navigation

## Build & Deploy
- npm install --no-package-lock (no lockfile in repo)
- npm run build produces dist/ folder
- GitHub Actions uploads dist/ as Pages artifact
- No environment variables needed

## Known Limitations
- NTL raster tiles still served from api.lights.nltglobal.com (AWS)
- Future: Convert tiles to PMTiles format and host as GitHub Release assets
- Admin2 drill-down data available but not yet implemented in UI
- Analytics data shows raw radiance values (not normalized)

## API Reference (for future data updates)
- GET api.lights.nltglobal.com/admin0 - All countries
- GET api.lights.nltglobal.com/admin1/{gid} - Admin1 regions
- GET api.lights.nltglobal.com/admin2/{gid} - Admin2 regions
- GET api.lights.nltglobal.com/ar/{gid}/{date} - Analytics/radiance
- GET api.lights.nltglobal.com/date-range - Available dates
- GET api.lights.nltglobal.com/tiles/{date}/{z}/{x}/{y}.png - Raster tiles

## Related Repositories
- nltgis-ai/nltgis-ai.github.io - Reference design system
- NightLightObservatory org - Parent organization
