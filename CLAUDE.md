# CLAUDE.md — AI Development Context & Session Reconnection



> **This file is the primary context document for AI-assisted development.**

> Any new Claude session (browser, API, or GitHub Action) should read this first

> to understand the project state and continue from where the last session left off.



## Project: NLT Observatory (Big Data Nighttime Lights)



| Key | Value |

|-----|-------|

| **Live URL** | https://nightlightobservatory.github.io/ |

| **Repository** | https://github.com/NightLightObservatory/nightlightobservatory.github.io |

| **Project Board** | https://github.com/orgs/NightLightObservatory/projects/1 |

| **Epic Issue** | https://github.com/NightLightObservatory/nightlightobservatory.github.io/issues/1 |

| **Last Updated** | March 26, 2026 |

| **Last Session** | Major UX overhaul + issue/project board creation |



## Quick Reconnection Checklist

When starting a new session on this project:

1. Read this CLAUDE.md (you're doing it now)

2. Check **open issues**: `/issues?q=is:open`

3. Check **project board**: `/projects/1` for current priorities

4. Check **recent commits**: `/commits/main` for latest changes

5. Check **Actions**: `/actions` for build status

6. Visit the live site to verify current state



## Architecture

- **Framework:** React 18 + Vite 6 (SPA, single App.jsx component)

- **Map:** MapLibre GL JS 4.x with raster tile overlay

- **Styling:** Inline CSS-in-JS with design tokens (T object)

- **Deployment:** GitHub Actions → GitHub Pages (auto-deploy on push to main)

- **Data:** Static JSON files in `public/data/` + live NTL tiles from AWS API



## Key Files

| File | Purpose |

|------|---------|

| `src/App.jsx` | Complete application (~700 lines logic) |

| `index.html` | CSS overrides for MapLibre, scrollbars, animations |

| `public/data/admin0.json` | 9 countries (VNM, IDN, TLS, PNG, FJI, SLB, VUT, WSM, IND) |

| `public/data/date-range.json` | 105 months (2012-04 to 2020-12) |

| `public/data/analytics/{GID}.json` | Radiance + cloud-free time-series per country |

| `public/data/admin1/{GID}.json` | Sub-national regions with bbox |

| `.github/workflows/deploy.yml` | Build & deploy to GitHub Pages |



## Design System (nltgis.ai-inspired)

- **Theme:** Dark navy (#0a1628), glassmorphism cards (rgba + backdrop-blur)

- **Font:** DM Sans (Google Fonts, variable weight 100-1000)

- **Accent:** Indigo (#6366f1), hover (#818cf8), glow (rgba(99,102,241,0.4))

- **Token object:** `T` in App.jsx contains all design tokens



## Current Features (Working)

- Tour/welcome screen with animated CTA

- 4 basemaps: Dark (CARTO), Light (CARTO), Voyager (CARTO), Satellite (Esri)

- Layers panel with NTL toggle + opacity slider

- Floating timeline: play/pause, month buttons, year nav, progress bar

- Analytics panel: stats cards (Latest, Growth, Peak), Radiance/Cloud-Free tabs

- Interactive SVG charts with hover crosshair

- Collapsible sidebar with search, country flags, breadcrumb (3-level)

- Admin1 drill-down for all 9 countries

- Map centering with smart padding on location selection



## Issue Tracker Summary

| # | Title | Status | Priority |

|---|-------|--------|----------|

| 1 | [EPIC] Full Platform Migration | Open | — |

| 2 | Convert NTL tiles to PMTiles | Open | HIGH |

| 3 | Host PMTiles (Releases/CDN) | Open | HIGH |

| 4 | Extract admin2 data | Open | MEDIUM |

| 5 | Data pipeline workflow | Open | HIGH |

| 6 | App.jsx code cleanup | Open | LOW |

| 7 | Admin2 drill-down UI | Open | MEDIUM |

| 8 | Mobile responsive | Open | MEDIUM |

| 9 | Performance optimization | Open | LOW |

| 10 | Claude GitHub Action | Open | HIGH |



## Critical Path (Next Actions)

1. **#2 PMTiles conversion** — Download tiles from AWS, convert to PMTiles

2. **#3 PMTiles hosting** — GitHub Releases or Cloudflare R2

3. **#5 Data pipeline** — GitHub Actions workflow for extraction

4. **#10 Claude Action** — Enable autonomous development iterations



## Data Sources

- **NTL Tiles:** `https://api.lights.nltglobal.com/tiles/{date}/{z}/{x}/{y}.png` (AWS - ACTIVE)

- **Static Data:** Pre-extracted from API, saved in `public/data/`

- **Basemaps:** CARTO CDN + Esri World Imagery



## API Reference (AWS - still active, extract before shutdown)

| Endpoint | Returns |

|----------|---------|

| `GET /date-range` | Array of YYYY-MM strings (105 dates) |

| `GET /admin0` | `{ data: [{ gid, name, area, bbox }] }` |

| `GET /admin1/{gid}` | `{ data: [{ gid, name, area, bbox }] }` |

| `GET /admin2/{admin1_gid}` | `{ data: [{ gid, name, area }] }` (no bbox) |

| `GET /ar/{gid}/{endDate}` | `{ data: { ar: [...], cf: [...], beyer: [...] } }` |

| `GET /tiles/{date}/{z}/{x}/{y}.png` | 256px raster PNG tile |



## Build & Deploy

```bash

npm install --no-package-lock

npm run build    # Output: dist/

npm run dev      # Local dev server at http://localhost:5173

```

Auto-deploys via `.github/workflows/deploy.yml` on every push to main.



## Known Issues

- Extra blank lines in App.jsx from GitHub web editor clipboard transfer (#6)

- Country flag emojis render as 2-letter codes on some systems

- NTL tiles still depend on AWS API (last remaining dependency)

- Admin2 data available but not in UI (#4, #7)



## Session History

| Date | Session | Key Actions |

|------|---------|-------------|

| Mar 26 2026 (AM) | Initial build | Created repo, extracted 19 data files from API, wrote App.jsx, deployed |

| Mar 26 2026 (PM) | UX overhaul | Basemaps, floating timeline, layers panel, analytics stats, charts |

| Mar 26 2026 (EVE) | Project mgmt | Created 10 GitHub issues, project board, updated CLAUDE.md |

