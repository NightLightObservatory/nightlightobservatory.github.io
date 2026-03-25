# NLT Observatory — Nighttime Lights

**Big Data Nighttime Lights Socioeconomic Observatory**

> Explore satellite-derived nighttime light data across 9 countries in the East Asia and Pacific region. Analyze economic activity trends from 2012 to 2020.

**Live Site:** [nightlightobservatory.github.io](https://nightlightobservatory.github.io)

## Overview

The NLT Observatory is a web-based platform for visualizing and analyzing VIIRS nighttime light satellite data. Originally deployed on AWS infrastructure, this version has been migrated to a fully GitHub-based platform using GitHub Pages and GitHub Actions for CI/CD.

## Features

- Interactive dark-theme map with CARTO basemap and MapLibre GL
- NTL raster tile overlay with adjustable opacity (2012–2020 monthly data)
- 9 countries: Vietnam, Indonesia, Timor-Leste, Papua New Guinea, Fiji, Solomon Islands, Vanuatu, Samoa, India
- Admin1 (province/state) level drill-down navigation
- NTL radiance time-series analytics charts
- Cloud-free coverage visualization
- Timeline playback with play/pause controls
- Responsive sidebar with search and breadcrumb navigation

## Tech Stack

- **Frontend:** React 18 + Vite 6
- **Mapping:** MapLibre GL JS 4.x with CARTO Dark Matter basemap
- **Design System:** nltGIS.ai design tokens (DM Sans, navy dark theme, glassmorphism)
- **Deployment:** GitHub Pages via GitHub Actions
- **Data:** Static JSON files with real NTL analytics from api.lights.nltglobal.com

## Architecture

```
src/
  App.jsx          # Main application with all components
  main.jsx         # React entry point
public/
  data/
    admin0.json    # Country boundaries and metadata
    date-range.json # Available dates (2012-04 to 2020-12)
    analytics/     # NTL radiance time-series per country
    admin1/        # Province/state boundaries per country
.github/
  workflows/
    deploy.yml     # GitHub Pages deployment pipeline
```

## Development

```bash
npm install
npm run dev      # Start dev server on localhost:5173
npm run build    # Build for production
npm run preview  # Preview production build
```

## Deployment

The site automatically deploys to GitHub Pages on every push to `main` via the `.github/workflows/deploy.yml` workflow.

## Migration from AWS

This project was migrated from an AWS-based deployment (S3 + CloudFront + Cognito + Lambda) to a fully GitHub-based platform:

- **Hosting:** AWS S3/CloudFront → GitHub Pages
- **Auth:** AWS Cognito → Public access (no auth required)
- **API:** AWS Lambda → Static JSON data files
- **CI/CD:** Manual → GitHub Actions
- **Framework:** Angular 11 → React 18 + Vite 6
- **Mapping:** Mapbox GL → MapLibre GL (open source)

## License

MIT License — New Light Technologies, Inc.

## Related

- [nltGIS.ai](https://nltgis.ai) — AI-Native Spatial Intelligence Platform
- [NightLightObservatory](https://github.com/NightLightObservatory) — GitHub Organization
