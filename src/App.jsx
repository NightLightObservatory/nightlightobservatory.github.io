import { useState, useEffect, useRef, useCallback, useMemo } from 'react'

import maplibregl from 'maplibre-gl'

import 'maplibre-gl/dist/maplibre-gl.css'



/* ═══════════════════════════════════════════════════════════════

   BASEMAP DEFINITIONS

   ═══════════════════════════════════════════════════════════════ */

const BASEMAPS = {

  dark: {

    name: 'Dark',

    style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',

    icon: '🌜'

  },

  light: {

    name: 'Light',

    style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',

    icon: '☀️'

  },

  voyager: {

    name: 'Voyager',

    style: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',

    icon: '🗺️'

  },

  satellite: {

    name: 'Satellite',

    style: {

      version: 8,

      sources: {

        'esri-sat': {

          type: 'raster',

          tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],

          tileSize: 256,

          attribution: 'Esri, Maxar, Earthstar Geographics'

        }

      },

      layers: [{ id: 'esri-sat-layer', type: 'raster', source: 'esri-sat' }]

    },

    icon: '🛰️'

  }

}



const TILE_URL = 'https://api.lights.nltglobal.com/tiles'



const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

const MONTH_FULL = ['January','February','March','April','May','June','July','August','September','October','November','December']



/* ═══════════════════════════════════════════════════════════════

   DESIGN TOKENS (nltgis.ai design system)

   ═══════════════════════════════════════════════════════════════ */

const T = {

  bg: '#0a1628',

  bgCard: 'rgba(15,23,42,0.92)',

  bgSidebar: 'rgba(10,22,40,0.95)',

  bgHeader: 'rgba(10,22,40,0.98)',

  bgInput: 'rgba(30,41,59,0.6)',

  bgHover: 'rgba(99,102,241,0.12)',

  border: '#1e293b',

  borderLight: 'rgba(255,255,255,0.08)',

  text: '#ffffff',

  textSecondary: 'rgba(255,255,255,0.6)',

  textTertiary: 'rgba(255,255,255,0.35)',

  accent: '#6366f1',

  accentHover: '#818cf8',

  accentGlow: 'rgba(99,102,241,0.4)',

  red: '#ef4444',

  green: '#22c55e',

  amber: '#eab308',

  cyan: '#06b6d4',

  font: "'DM Sans', system-ui, -apple-system, sans-serif",

  radius: '10px',

  radiusSm: '6px',

  radiusLg: '14px',

  shadow: '0 10px 40px rgba(0,0,0,0.4)',

  shadowSm: '0 4px 12px rgba(0,0,0,0.2)',

  glass: 'blur(16px)',

}



/* Country flag emoji mapping */

const FLAGS = {

  VNM: '🇻🇳', IDN: '🇮🇩', TLS: '🇹🇱',

  PNG: '🇵🇬', FJI: '🇫🇯', SLB: '🇸🇧',

  VUT: '🇻🇺', WSM: '🇼🇸', IND: '🇮🇳'

}



/* ═══════════════════════════════════════════════════════════════

   MAIN APP COMPONENT

   ═══════════════════════════════════════════════════════════════ */

export default function App() {

  const mapContainer = useRef(null)

  const mapRef = useRef(null)

  const [countries, setCountries] = useState([])

  const [dateRange, setDateRange] = useState([])

  const [selectedDate, setSelectedDate] = useState('')

  const [selectedCountry, setSelectedCountry] = useState(null)

  const [admin1Regions, setAdmin1Regions] = useState([])

  const [selectedAdmin1, setSelectedAdmin1] = useState(null)

  const [analytics, setAnalytics] = useState(null)

  const [searchQuery, setSearchQuery] = useState('')

  const [showTour, setShowTour] = useState(true)

  const [yearIndex, setYearIndex] = useState(0)

  const [playing, setPlaying] = useState(false)

  const [tileOpacity, setTileOpacity] = useState(0.85)

  const [showChart, setShowChart] = useState(false)

  const [drillLevel, setDrillLevel] = useState('country')

  const [mapReady, setMapReady] = useState(false)

  const [activeBasemap, setActiveBasemap] = useState('dark')

  const [showLayers, setShowLayers] = useState(false)

  const [showNtl, setShowNtl] = useState(true)

  const [chartTab, setChartTab] = useState('radiance')

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const [hoveredMonth, setHoveredMonth] = useState(null)



  /* ─── Derived state ─── */

  const years = useMemo(() => [...new Set(dateRange.map(d => d.split('-')[0]))], [dateRange])

  const currentYear = selectedDate ? selectedDate.split('-')[0] : ''

  const currentMonth = selectedDate ? parseInt(selectedDate.split('-')[1]) : 0

  const monthsInYear = useMemo(() => dateRange.filter(d => d.startsWith(currentYear)), [dateRange, currentYear])

  const filtered = useMemo(() =>

    countries.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase())),

    [countries, searchQuery]

  )



  /* ─── Load static data ─── */

  useEffect(() => {

    fetch('./data/admin0.json').then(r => r.json()).then(d => setCountries(d.data || []))

    fetch('./data/date-range.json').then(r => r.json()).then(d => {

      setDateRange(d)

      if (d.length) { setSelectedDate(d[d.length - 1]); setYearIndex(d.length - 1) }

    })

  }, [])



  /* ─── Initialize map ─── */

  useEffect(() => {

    if (!mapContainer.current || showTour) return

    const map = new maplibregl.Map({

      container: mapContainer.current,

      style: BASEMAPS[activeBasemap].style,

      center: [120, 0],

      zoom: 3.5,

      attributionControl: false,

      maxZoom: 14,

      minZoom: 2,

    })

    map.addControl(new maplibregl.NavigationControl({ showCompass: true, visualizePitch: true }), 'top-right')

    map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right')

    map.addControl(new maplibregl.ScaleControl({ maxWidth: 150 }), 'bottom-left')

    mapRef.current = map

    map.on('load', () => {

      setMapReady(true)

      if (selectedDate && showNtl) addTileLayer(map, selectedDate)

    })

    return () => { map.remove(); setMapReady(false) }

  }, [showTour])



  /* ─── Switch basemap ─── */

  useEffect(() => {

    const map = mapRef.current

    if (!map || !mapReady) return

    const center = map.getCenter()

    const zoom = map.getZoom()

    const bearing = map.getBearing()

    const pitch = map.getPitch()

    map.setStyle(BASEMAPS[activeBasemap].style)

    map.once('style.load', () => {

      map.setCenter(center)

      map.setZoom(zoom)

      map.setBearing(bearing)

      map.setPitch(pitch)

      if (selectedDate && showNtl) addTileLayer(map, selectedDate)

    })

  }, [activeBasemap])



  /* ─── Update tiles when date changes ─── */

  useEffect(() => {

    if (mapRef.current && mapReady && selectedDate) {

      if (showNtl) addTileLayer(mapRef.current, selectedDate)

      else removeTileLayer(mapRef.current)

    }

  }, [selectedDate, mapReady, showNtl])



  /* ─── Update tile opacity ─── */

  useEffect(() => {

    if (mapRef.current && mapReady && mapRef.current.getLayer('ntl-layer')) {

      mapRef.current.setPaintProperty('ntl-layer', 'raster-opacity', tileOpacity)

    }

  }, [tileOpacity, mapReady])



  function addTileLayer(map, date) {

    removeTileLayer(map)

    map.addSource('ntl-tiles', {

      type: 'raster',

      tiles: [TILE_URL + '/' + date + '/{z}/{x}/{y}.png'],

      tileSize: 256,

      attribution: 'NTL © NLT'

    })

    map.addLayer({

      id: 'ntl-layer',

      type: 'raster',

      source: 'ntl-tiles',

      paint: { 'raster-opacity': tileOpacity }

    })

  }



  function removeTileLayer(map) {

    if (map.getLayer('ntl-layer')) map.removeLayer('ntl-layer')

    if (map.getSource('ntl-tiles')) map.removeSource('ntl-tiles')

  }



  /* ─── Navigation callbacks ─── */

  const flyToCountry = useCallback((country) => {

    setSelectedCountry(country)

    setSelectedAdmin1(null)

    setDrillLevel('country')

    setShowChart(false)

    setAdmin1Regions([])

    if (mapRef.current && country.bbox) {

      const bbox = JSON.parse(country.bbox)

      mapRef.current.fitBounds([[bbox[0], bbox[1]], [bbox[2], bbox[3]]], {

        padding: { top: 80, bottom: 180, left: sidebarCollapsed ? 80 : 300, right: 80 },

        duration: 1500,

        maxZoom: 8

      })

    }

    fetch('./data/admin1/' + country.gid + '.json')

      .then(r => r.ok ? r.json() : null)

      .then(d => { if (d && d.data) setAdmin1Regions(d.data) })

      .catch(() => setAdmin1Regions([]))

    fetch('./data/analytics/' + country.gid + '.json')

      .then(r => r.ok ? r.json() : null)

      .then(d => { setAnalytics(d); setShowChart(true) })

      .catch(() => setAnalytics(null))

  }, [sidebarCollapsed])



  const flyToAdmin1 = useCallback((region) => {

    setSelectedAdmin1(region)

    setDrillLevel('admin1')

    if (mapRef.current && region.bbox) {

      const bbox = JSON.parse(region.bbox)

      mapRef.current.fitBounds([[bbox[0], bbox[1]], [bbox[2], bbox[3]]], {

        padding: { top: 80, bottom: 180, left: sidebarCollapsed ? 80 : 300, right: 80 },

        duration: 1200,

        maxZoom: 10

      })

    }

  }, [sidebarCollapsed])



  const backToCountries = useCallback(() => {

    setSelectedCountry(null)

    setSelectedAdmin1(null)

    setDrillLevel('country')

    setAdmin1Regions([])

    setAnalytics(null)

    setShowChart(false)

    setSearchQuery('')

    if (mapRef.current) {

      mapRef.current.flyTo({ center: [120, 0], zoom: 3.5, duration: 1200 })

    }

  }, [])



  const backToCountry = useCallback(() => {

    setSelectedAdmin1(null)

    setDrillLevel('country')

    if (selectedCountry) flyToCountry(selectedCountry)

  }, [selectedCountry, flyToCountry])



  /* ─── Timeline playback ─── */

  useEffect(() => {

    if (!playing || dateRange.length === 0) return

    const interval = setInterval(() => {

      setYearIndex(prev => {

        const next = prev + 1

        if (next >= dateRange.length) { setPlaying(false); return prev }

        setSelectedDate(dateRange[next])

        return next

      })

    }, 400)

    return () => clearInterval(interval)

  }, [playing, dateRange])



  const setDateByIndex = useCallback((idx) => {

    if (idx >= 0 && idx < dateRange.length) {

      setYearIndex(idx)

      setSelectedDate(dateRange[idx])

    }

  }, [dateRange])



  const prevYear = useCallback(() => {

    const yi = years.indexOf(currentYear)

    if (yi > 0) {

      const first = dateRange.find(d => d.startsWith(years[yi - 1]))

      if (first) setDateByIndex(dateRange.indexOf(first))

    }

  }, [years, currentYear, dateRange, setDateByIndex])



  const nextYear = useCallback(() => {

    const yi = years.indexOf(currentYear)

    if (yi < years.length - 1) {

      const first = dateRange.find(d => d.startsWith(years[yi + 1]))

      if (first) setDateByIndex(dateRange.indexOf(first))

    }

  }, [years, currentYear, dateRange, setDateByIndex])



  /* ─── Analytics stats ─── */

  const stats = useMemo(() => {

    if (!analytics || !analytics.data || !analytics.data.ar) return null

    const values = analytics.data.ar.map(d => parseFloat(d.value)).filter(v => !isNaN(v))

    if (values.length === 0) return null

    const avg = values.reduce((a, b) => a + b, 0) / values.length

    const max = Math.max(...values)

    const min = Math.min(...values)

    const maxIdx = values.indexOf(max)

    const latest = values[values.length - 1]

    const earliest = values[0]

    const growth = earliest > 0 ? ((latest - earliest) / earliest * 100) : 0

    return { avg, max, min, maxIdx, latest, earliest, growth, count: values.length }

  }, [analytics])



  /* ═══════════════════════════════════════════════════════════════

     TOUR SCREEN

     ═══════════════════════════════════════════════════════════════ */

  if (showTour) {

    return (

      <div style={{ position: 'fixed', inset: 0, background: 'linear-gradient(135deg, ' + T.bg + ' 0%, #0f172a 50%, #020617 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: T.font, color: T.text, overflow: 'hidden' }}>

        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 30% 50%, rgba(99,102,241,0.08) 0%, transparent 60%), radial-gradient(ellipse at 70% 20%, rgba(239,68,68,0.05) 0%, transparent 50%)' }} />

        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: 560, padding: '0 24px' }}>

          <div style={{ width: 72, height: 72, margin: '0 auto 32px', background: 'linear-gradient(135deg, ' + T.accent + ', ' + T.red + ')', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 60px ' + T.accentGlow }}>

            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/><circle cx="12" cy="12" r="3"/></svg>

          </div>

          <p style={{ fontSize: 14, letterSpacing: '3px', textTransform: 'uppercase', color: T.accent, marginBottom: 12, fontWeight: 500 }}>NLT Observatory</p>

          <h1 style={{ fontSize: 40, fontWeight: 700, lineHeight: 1.2, margin: '0 0 8px', background: 'linear-gradient(90deg, #fff 30%, rgba(255,255,255,0.6))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Big Data Nighttime Lights</h1>

          <h2 style={{ fontSize: 20, fontWeight: 400, color: T.textSecondary, margin: '0 0 32px' }}>Socioeconomic Observatory</h2>

          <p style={{ fontSize: 15, color: T.textTertiary, lineHeight: 1.7, marginBottom: 40 }}>

            Explore satellite-derived nighttime light data across 9 countries in the East Asia and Pacific region. Analyze economic activity trends from 2012 to 2020.

          </p>

          <button onClick={() => setShowTour(false)} style={{ padding: '16px 56px', fontSize: 16, fontWeight: 600, background: T.accent, color: '#fff', border: 'none', borderRadius: T.radius, cursor: 'pointer', letterSpacing: '0.5px', boxShadow: '0 4px 24px ' + T.accentGlow, transition: 'all 0.25s ease' }}

            onMouseEnter={e => { e.target.style.background = T.accentHover; e.target.style.transform = 'translateY(-2px)'; e.target.style.boxShadow = '0 8px 32px ' + T.accentGlow }}

            onMouseLeave={e => { e.target.style.background = T.accent; e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = '0 4px 24px ' + T.accentGlow }}>

            Explore the Observatory

          </button>

          <p style={{ marginTop: 24, fontSize: 13, color: T.textTertiary }}>

            Powered by{' '}<a href="https://nltgis.ai" target="_blank" rel="noopener" style={{ color: T.accent, textDecoration: 'none' }}>nltGIS.ai</a>{' '}•{' '}<a href="https://github.com/NightLightObservatory" target="_blank" rel="noopener" style={{ color: T.textTertiary, textDecoration: 'none' }}>GitHub</a>

          </p>

        </div>

      </div>

    )

  }



  /* ═══════════════════════════════════════════════════════════════

     MAIN APPLICATION LAYOUT

     ═══════════════════════════════════════════════════════════════ */

  return (

    <div style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', fontFamily: T.font, background: T.bg, color: T.text }}>

      {/* ─── Header ─── */}

      <header style={{ display: 'flex', alignItems: 'center', padding: '0 16px', height: 48, background: T.bgHeader, borderBottom: '1px solid ' + T.border, zIndex: 30, backdropFilter: T.glass }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>

          <div style={{ width: 30, height: 30, background: 'linear-gradient(135deg, ' + T.accent + ', ' + T.red + ')', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} onClick={() => setShowTour(true)}>

            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4"/></svg>

          </div>

          <span style={{ fontSize: 15, fontWeight: 600, color: T.text, letterSpacing: '0.3px' }}>NLT Observatory</span>

          <span style={{ fontSize: 11, color: T.textTertiary, marginLeft: 4 }}>East Asia & Pacific</span>

        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>

          {selectedDate && <span style={{ fontSize: 13, color: T.textSecondary, fontWeight: 500 }}>{MONTH_FULL[parseInt(selectedDate.split('-')[1]) - 1]} {selectedDate.split('-')[0]}</span>}

          <span style={{ background: showNtl ? T.accent : T.border, color: '#fff', padding: '3px 10px', borderRadius: '5px', fontSize: 10, fontWeight: 700, letterSpacing: '0.5px', cursor: 'pointer', transition: 'all 0.2s' }} onClick={() => setShowNtl(!showNtl)}>{showNtl ? 'NTL ON' : 'NTL OFF'}</span>

        </div>

      </header>



      <div style={{ flex: 1, display: 'flex', position: 'relative', overflow: 'hidden' }}>

        {/* ─── Sidebar ─── */}

        <aside style={{ width: sidebarCollapsed ? 0 : 280, minWidth: sidebarCollapsed ? 0 : 280, background: T.bgSidebar, borderRight: '1px solid ' + T.border, display: 'flex', flexDirection: 'column', zIndex: 15, backdropFilter: T.glass, transition: 'all 0.3s ease', overflow: 'hidden' }}>

          {/* Breadcrumb */}

          <div style={{ padding: '12px 16px', borderBottom: '1px solid ' + T.border, fontSize: 12, display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>

            <span onClick={backToCountries} style={{ color: drillLevel !== 'country' || selectedCountry ? T.accent : T.textSecondary, cursor: 'pointer', fontWeight: 500 }}>🌏 Countries</span>

            {selectedCountry && (

              <><span style={{ color: T.textTertiary }}>›</span>

              <span onClick={backToCountry} style={{ color: selectedAdmin1 ? T.accent : T.text, cursor: selectedAdmin1 ? 'pointer' : 'default', fontWeight: selectedAdmin1 ? 400 : 600 }}>{FLAGS[selectedCountry.gid] || ''} {selectedCountry.name}</span></>

            )}

            {selectedAdmin1 && (

              <><span style={{ color: T.textTertiary }}>›</span>

              <span style={{ color: T.text, fontWeight: 600 }}>{selectedAdmin1.name}</span></>

            )}

          </div>



          {/* Search */}

          <div style={{ padding: '10px 16px' }}>

            <div style={{ position: 'relative' }}>

              <input type="text" placeholder="Search regions..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}

                style={{ width: '100%', padding: '9px 12px 9px 32px', background: T.bgInput, border: '1px solid ' + T.border, borderRadius: T.radiusSm, color: T.text, fontSize: 13, outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s', fontFamily: T.font }}

                onFocus={e => e.target.style.borderColor = T.accent} onBlur={e => e.target.style.borderColor = T.border} />

              <svg style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>

            </div>

          </div>



          {/* Region List */}

          <div style={{ flex: 1, overflowY: 'auto', padding: '0 8px 8px' }}>

            {drillLevel === 'country' && !selectedCountry && filtered.map(country => (

              <div key={country.gid} onClick={() => flyToCountry(country)}

                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: T.radiusSm, cursor: 'pointer', fontSize: 13, color: T.text, transition: 'all 0.15s', marginBottom: 2 }}

                onMouseEnter={e => { e.currentTarget.style.background = T.bgHover; e.currentTarget.style.transform = 'translateX(4px)' }}

                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.transform = 'translateX(0)' }}>

                <span style={{ fontSize: 20 }}>{FLAGS[country.gid] || '🌍'}</span>

                <div style={{ flex: 1 }}>

                  <div style={{ fontWeight: 500 }}>{country.name}</div>

                  <div style={{ fontSize: 11, color: T.textTertiary, marginTop: 1 }}>{parseFloat(country.area).toLocaleString()} km²</div>

                </div>

                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ opacity: 0.3 }}><path d="m9 18 6-6-6-6"/></svg>

              </div>

            ))}

            {selectedCountry && drillLevel === 'country' && admin1Regions

              .filter(r => r.name.toLowerCase().includes(searchQuery.toLowerCase()))

              .map(region => (

                <div key={region.gid} onClick={() => flyToAdmin1(region)}

                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: T.radiusSm, cursor: 'pointer', fontSize: 13, color: T.text, transition: 'all 0.15s', marginBottom: 2 }}

                  onMouseEnter={e => { e.currentTarget.style.background = T.bgHover; e.currentTarget.style.transform = 'translateX(4px)' }}

                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.transform = 'translateX(0)' }}>

                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: T.accent, flexShrink: 0 }} />

                  <div style={{ flex: 1 }}>

                    <div style={{ fontWeight: 500 }}>{region.name}</div>

                    {region.area && <div style={{ fontSize: 11, color: T.textTertiary, marginTop: 1 }}>{parseFloat(region.area).toLocaleString()} km²</div>}

                  </div>

                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ opacity: 0.3 }}><path d="m9 18 6-6-6-6"/></svg>

                </div>

              ))}

            {selectedCountry && admin1Regions.length === 0 && (

              <div style={{ padding: '20px 12px', textAlign: 'center', color: T.textTertiary, fontSize: 12 }}>Loading regions...</div>

            )}

          </div>



          {/* Sidebar Footer */}

          <div style={{ padding: '10px 16px', borderTop: '1px solid ' + T.border, fontSize: 11, color: T.textTertiary, display: 'flex', justifyContent: 'space-between' }}>

            <span>{countries.length} countries</span>

            <span>{dateRange.length} months</span>

          </div>

        </aside>



        {/* ─── Sidebar Toggle ─── */}

        <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)}

          style={{ position: 'absolute', left: sidebarCollapsed ? 4 : 272, top: '50%', transform: 'translateY(-50%)', zIndex: 20, background: T.bgCard, border: '1px solid ' + T.border, borderRadius: '0 6px 6px 0', padding: '12px 4px', cursor: 'pointer', color: T.textSecondary, transition: 'all 0.3s', backdropFilter: T.glass }}

          onMouseEnter={e => e.target.style.color = T.text} onMouseLeave={e => e.target.style.color = T.textSecondary}>

          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d={sidebarCollapsed ? "m9 18 6-6-6-6" : "m15 18-6-6 6-6"}/></svg>

        </button>



        {/* ─── Map Container ─── */}

        <div ref={mapContainer} style={{ flex: 1, position: 'relative' }} />



        {/* ─── Layer Control Panel ─── */}

        <div style={{ position: 'absolute', top: 10, right: 52, zIndex: 10 }}>

          <button onClick={() => setShowLayers(!showLayers)}

            style={{ background: T.bgCard, border: '1px solid ' + T.border, borderRadius: T.radiusSm, padding: '8px 10px', cursor: 'pointer', color: T.text, backdropFilter: T.glass, display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontFamily: T.font, transition: 'all 0.2s' }}

            onMouseEnter={e => e.currentTarget.style.borderColor = T.accent} onMouseLeave={e => e.currentTarget.style.borderColor = T.border}>

            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2 2 7l10 5 10-5-10-5Z"/><path d="m2 17 10 5 10-5"/><path d="m2 12 10 5 10-5"/></svg>

            Layers

          </button>

          {showLayers && (

            <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 6, background: T.bgCard, border: '1px solid ' + T.border, borderRadius: T.radius, padding: '12px', minWidth: 200, backdropFilter: T.glass, boxShadow: T.shadow, animation: 'slideUp 0.2s ease' }}>

              <div style={{ fontSize: 11, color: T.textTertiary, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 10, fontWeight: 600 }}>Basemap</div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 14 }}>

                {Object.entries(BASEMAPS).map(([key, bm]) => (

                  <button key={key} onClick={() => { setActiveBasemap(key) }}

                    style={{ padding: '8px 6px', background: activeBasemap === key ? T.bgHover : 'transparent', border: '1px solid ' + (activeBasemap === key ? T.accent : T.border), borderRadius: T.radiusSm, color: activeBasemap === key ? T.text : T.textSecondary, cursor: 'pointer', fontSize: 11, fontFamily: T.font, transition: 'all 0.2s', textAlign: 'center' }}>

                    <span style={{ display: 'block', fontSize: 18, marginBottom: 2 }}>{bm.icon}</span>

                    {bm.name}

                  </button>

                ))}

              </div>

              <div style={{ borderTop: '1px solid ' + T.border, paddingTop: 10 }}>

                <div style={{ fontSize: 11, color: T.textTertiary, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 8, fontWeight: 600 }}>NTL Overlay</div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>

                  <button onClick={() => setShowNtl(!showNtl)}

                    style={{ width: 36, height: 20, borderRadius: 10, border: 'none', background: showNtl ? T.accent : T.border, cursor: 'pointer', position: 'relative', transition: 'all 0.2s' }}>

                    <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#fff', position: 'absolute', top: 2, left: showNtl ? 18 : 2, transition: 'all 0.2s' }} />

                  </button>

                  <span style={{ fontSize: 12, color: T.textSecondary }}>{showNtl ? 'Visible' : 'Hidden'}</span>

                </div>

                {showNtl && (

                  <div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: T.textTertiary, marginBottom: 4 }}>

                      <span>Opacity</span>

                      <span>{Math.round(tileOpacity * 100)}%</span>

                    </div>

                    <input type="range" min="0" max="1" step="0.05" value={tileOpacity}

                      onChange={e => setTileOpacity(parseFloat(e.target.value))}

                      style={{ width: '100%', accentColor: T.accent }} />

                  </div>

                )}

              </div>

            </div>

          )}

        </div>



        {/* ─── Analytics Panel ─── */}

        {showChart && analytics && selectedCountry && (

          <div style={{ position: 'absolute', bottom: 100, right: 16, width: 400, background: T.bgCard, backdropFilter: T.glass, borderRadius: T.radiusLg, border: '1px solid ' + T.border, boxShadow: T.shadow, zIndex: 15, animation: 'slideUp 0.3s ease' }}>

            {/* Panel Header */}

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid ' + T.border }}>

              <div>

                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>

                  {FLAGS[selectedCountry.gid] || ''} {selectedCountry.name}

                  {selectedAdmin1 && <span style={{ fontSize: 12, fontWeight: 400, color: T.textSecondary }}> › {selectedAdmin1.name}</span>}

                </h3>

                <p style={{ margin: '3px 0 0', fontSize: 11, color: T.textTertiary }}>NTL Analysis • 2012–2020</p>

              </div>

              <button onClick={() => setShowChart(false)}

                style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: T.textTertiary, cursor: 'pointer', fontSize: 14, padding: '4px 8px', borderRadius: T.radiusSm, transition: 'all 0.15s' }}

                onMouseEnter={e => { e.target.style.background = 'rgba(255,255,255,0.1)'; e.target.style.color = T.text }}

                onMouseLeave={e => { e.target.style.background = 'rgba(255,255,255,0.05)'; e.target.style.color = T.textTertiary }}>✕</button>

            </div>



            {/* Stats Cards */}

            {stats && (

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, padding: '12px 18px', borderBottom: '1px solid ' + T.border }}>

                <div style={{ background: 'rgba(99,102,241,0.1)', borderRadius: T.radiusSm, padding: '8px 10px', textAlign: 'center' }}>

                  <div style={{ fontSize: 10, color: T.textTertiary, marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Latest</div>

                  <div style={{ fontSize: 14, fontWeight: 600, color: T.accent }}>{stats.latest.toFixed(1)}</div>

                </div>

                <div style={{ background: 'rgba(34,197,94,0.1)', borderRadius: T.radiusSm, padding: '8px 10px', textAlign: 'center' }}>

                  <div style={{ fontSize: 10, color: T.textTertiary, marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Growth</div>

                  <div style={{ fontSize: 14, fontWeight: 600, color: stats.growth >= 0 ? T.green : T.red }}>{stats.growth >= 0 ? '+' : ''}{stats.growth.toFixed(1)}%</div>

                </div>

                <div style={{ background: 'rgba(234,179,8,0.1)', borderRadius: T.radiusSm, padding: '8px 10px', textAlign: 'center' }}>

                  <div style={{ fontSize: 10, color: T.textTertiary, marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Peak</div>

                  <div style={{ fontSize: 14, fontWeight: 600, color: T.amber }}>{stats.max.toFixed(1)}</div>

                </div>

              </div>

            )}



            {/* Chart Tabs */}

            <div style={{ display: 'flex', padding: '0 18px', borderBottom: '1px solid ' + T.border }}>

              {[['radiance', 'Radiance'], ['cloudfree', 'Cloud-Free']].map(([key, label]) => (

                <button key={key} onClick={() => setChartTab(key)}

                  style={{ flex: 1, padding: '10px 0', fontSize: 12, fontWeight: chartTab === key ? 600 : 400, color: chartTab === key ? T.accent : T.textTertiary, background: 'transparent', border: 'none', borderBottom: '2px solid ' + (chartTab === key ? T.accent : 'transparent'), cursor: 'pointer', fontFamily: T.font, transition: 'all 0.2s' }}>

                  {label}

                </button>

              ))}

            </div>



            {/* Chart Content */}

            <div style={{ padding: '14px 18px' }}>

              {chartTab === 'radiance' && <MiniChart data={analytics.data?.ar || []} dateRange={dateRange} />}

              {chartTab === 'cloudfree' && <CloudFreeChart data={analytics.data?.cf || []} dateRange={dateRange} />}

            </div>

          </div>

        )}



        {/* ─── Floating Timeline Bar ─── */}

        <div style={{ position: 'absolute', bottom: 16, left: sidebarCollapsed ? 16 : 296, right: 16, zIndex: 20, background: T.bgCard, backdropFilter: T.glass, borderRadius: T.radiusLg, border: '1px solid ' + T.border, boxShadow: T.shadow, padding: '0', transition: 'left 0.3s ease' }}>

          {/* Current Date Display */}

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 18px 6px' }}>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>

              <button onClick={() => setPlaying(!playing)}

                style={{ width: 40, height: 40, borderRadius: '50%', background: playing ? T.red : T.accent, border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, transition: 'all 0.2s', boxShadow: '0 2px 12px ' + (playing ? 'rgba(239,68,68,0.4)' : T.accentGlow) }}

                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.08)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>

                {playing ? '⏸' : '▶'}

              </button>

              <div>

                <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.5px' }}>

                  {selectedDate ? MONTH_FULL[parseInt(selectedDate.split('-')[1]) - 1] + ' ' + selectedDate.split('-')[0] : ''}

                </div>

                <div style={{ fontSize: 11, color: T.textTertiary }}>{yearIndex + 1} of {dateRange.length} months</div>

              </div>

            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>

              <button onClick={prevYear} disabled={years.indexOf(currentYear) <= 0}

                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid ' + T.border, borderRadius: T.radiusSm, padding: '6px 10px', cursor: 'pointer', color: years.indexOf(currentYear) <= 0 ? T.textTertiary : T.text, fontSize: 12, fontFamily: T.font, transition: 'all 0.15s' }}>

                ◀ Prev

              </button>

              <select value={currentYear} onChange={e => {

                const first = dateRange.find(d => d.startsWith(e.target.value))

                if (first) setDateByIndex(dateRange.indexOf(first))

              }} style={{ background: T.bgInput, color: T.text, border: '1px solid ' + T.border, borderRadius: T.radiusSm, padding: '6px 12px', fontSize: 13, fontFamily: T.font, fontWeight: 600, outline: 'none', cursor: 'pointer' }}>

                {years.map(y => <option key={y} value={y}>{y}</option>)}

              </select>

              <button onClick={nextYear} disabled={years.indexOf(currentYear) >= years.length - 1}

                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid ' + T.border, borderRadius: T.radiusSm, padding: '6px 10px', cursor: 'pointer', color: years.indexOf(currentYear) >= years.length - 1 ? T.textTertiary : T.text, fontSize: 12, fontFamily: T.font, transition: 'all 0.15s' }}>

                Next ▶

              </button>

            </div>

          </div>



          {/* Month Buttons */}

          <div style={{ display: 'flex', gap: 4, padding: '6px 18px 12px', overflowX: 'auto' }}>

            {monthsInYear.map(d => {

              const month = parseInt(d.split('-')[1])

              const isActive = d === selectedDate

              const isHovered = d === hoveredMonth

              return (

                <button key={d}

                  onClick={() => setDateByIndex(dateRange.indexOf(d))}

                  onMouseEnter={() => setHoveredMonth(d)}

                  onMouseLeave={() => setHoveredMonth(null)}

                  style={{ flex: 1, minWidth: 48, padding: '8px 4px', background: isActive ? T.accent : isHovered ? T.bgHover : 'rgba(255,255,255,0.03)', color: isActive ? '#fff' : isHovered ? T.text : T.textSecondary, border: '1px solid ' + (isActive ? T.accent : isHovered ? 'rgba(99,102,241,0.3)' : T.border), borderRadius: T.radiusSm, cursor: 'pointer', fontSize: 12, fontWeight: isActive ? 700 : 500, fontFamily: T.font, transition: 'all 0.15s', textAlign: 'center', lineHeight: 1.2 }}>

                  <div style={{ fontSize: 13, fontWeight: isActive ? 700 : 500 }}>{MONTH_NAMES[month - 1]}</div>

                </button>

              )

            })}

          </div>



          {/* Progress Bar */}

          <div style={{ height: 3, background: T.border, borderRadius: '0 0 ' + T.radiusLg + ' ' + T.radiusLg, overflow: 'hidden' }}>

            <div style={{ height: '100%', width: (((yearIndex + 1) / dateRange.length) * 100) + '%', background: 'linear-gradient(90deg, ' + T.accent + ', ' + T.cyan + ')', transition: 'width 0.3s ease', borderRadius: '0 0 ' + T.radiusLg + ' ' + T.radiusLg }} />

          </div>

        </div>

      </div>

    </div>

  )

}



/* ═══════════════════════════════════════════════════════════════

   MINI CHART: NTL RADIANCE TIME SERIES

   ═══════════════════════════════════════════════════════════════ */

function MiniChart({ data, dateRange }) {

  const [hoverIdx, setHoverIdx] = useState(null)

  if (!data || data.length === 0) return <p style={{ color: T.textTertiary, fontSize: 12, textAlign: 'center', padding: 12 }}>No radiance data available</p>

  const values = data.map(d => parseFloat(d.value)).filter(v => !isNaN(v))

  if (values.length === 0) return null

  const max = Math.max(...values)

  const min = Math.min(...values)

  const range = max - min || 1

  const w = 356, h = 100, pad = 4

  const points = values.map((v, i) =>

    ((i / (values.length - 1)) * (w - pad * 2) + pad).toFixed(1) + ',' + (h - pad - ((v - min) / range) * (h - pad * 2)).toFixed(1)

  ).join(' ')

  const areaPoints = points + ' ' + (w - pad) + ',' + (h - pad) + ' ' + pad + ',' + (h - pad)



  return (

    <div style={{ position: 'relative' }}

      onMouseLeave={() => setHoverIdx(null)}>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>

        <span style={{ fontSize: 11, color: T.textTertiary }}>Radiance (nW/cm²/sr)</span>

        <span style={{ fontSize: 11, color: T.accent, fontWeight: 600 }}>{hoverIdx !== null ? values[hoverIdx]?.toFixed(1) : values[values.length - 1]?.toFixed(1)}</span>

      </div>

      <svg viewBox={'0 0 ' + w + ' ' + h} style={{ width: '100%', height: h, display: 'block', cursor: 'crosshair' }}

        onMouseMove={e => {

          const rect = e.currentTarget.getBoundingClientRect()

          const x = (e.clientX - rect.left) / rect.width

          const idx = Math.round(x * (values.length - 1))

          if (idx >= 0 && idx < values.length) setHoverIdx(idx)

        }}>

        <defs>

          <linearGradient id="radGrad" x1="0" y1="0" x2="0" y2="1">

            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3" />

            <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />

          </linearGradient>

        </defs>

        {/* Grid lines */}

        {[0, 0.25, 0.5, 0.75, 1].map(pct => (

          <line key={pct} x1={pad} y1={h - pad - pct * (h - pad * 2)} x2={w - pad} y2={h - pad - pct * (h - pad * 2)} stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />

        ))}

        <polygon fill="url(#radGrad)" points={areaPoints} />

        <polyline fill="none" stroke="#6366f1" strokeWidth="1.8" points={points} strokeLinejoin="round" />

        {hoverIdx !== null && (

          <>

            <line x1={(hoverIdx / (values.length - 1)) * (w - pad * 2) + pad} y1={pad} x2={(hoverIdx / (values.length - 1)) * (w - pad * 2) + pad} y2={h - pad} stroke="rgba(255,255,255,0.2)" strokeWidth="1" strokeDasharray="3,3" />

            <circle cx={(hoverIdx / (values.length - 1)) * (w - pad * 2) + pad} cy={h - pad - ((values[hoverIdx] - min) / range) * (h - pad * 2)} r="4" fill="#6366f1" stroke="#fff" strokeWidth="1.5" />

          </>

        )}

      </svg>

      {/* Y-axis labels */}

      <div style={{ position: 'absolute', left: 0, top: 24, bottom: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', pointerEvents: 'none' }}>

        <span style={{ fontSize: 9, color: T.textTertiary }}>{max.toFixed(0)}</span>

        <span style={{ fontSize: 9, color: T.textTertiary }}>{min.toFixed(0)}</span>

      </div>

      {hoverIdx !== null && dateRange && dateRange[hoverIdx] && (

        <div style={{ fontSize: 10, color: T.textTertiary, textAlign: 'center', marginTop: 2 }}>{dateRange[hoverIdx]}</div>

      )}

    </div>

  )

}



/* ═══════════════════════════════════════════════════════════════

   MINI CHART: CLOUD-FREE COVERAGE

   ═══════════════════════════════════════════════════════════════ */

function CloudFreeChart({ data, dateRange }) {

  const [hoverIdx, setHoverIdx] = useState(null)

  if (!data || data.length === 0) return <p style={{ color: T.textTertiary, fontSize: 12, textAlign: 'center', padding: 12 }}>No cloud-free data available</p>

  const values = data.map(d => parseFloat(d.value)).filter(v => !isNaN(v))

  if (values.length === 0) return null

  const w = 356, h = 60

  const barW = (w / values.length) * 0.85

  const gap = (w / values.length) * 0.15



  return (

    <div onMouseLeave={() => setHoverIdx(null)}>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>

        <span style={{ fontSize: 11, color: T.textTertiary }}>Cloud-Free Coverage (%)</span>

        <span style={{ fontSize: 11, color: T.green, fontWeight: 600 }}>{hoverIdx !== null ? values[hoverIdx]?.toFixed(1) + '%' : values[values.length - 1]?.toFixed(1) + '%'}</span>

      </div>

      <svg viewBox={'0 0 ' + w + ' ' + h} style={{ width: '100%', height: h, display: 'block', cursor: 'crosshair' }}

        onMouseMove={e => {

          const rect = e.currentTarget.getBoundingClientRect()

          const x = (e.clientX - rect.left) / rect.width

          const idx = Math.min(Math.floor(x * values.length), values.length - 1)

          if (idx >= 0) setHoverIdx(idx)

        }}>

        {/* 50% line */}

        <line x1="0" y1={h * 0.5} x2={w} y2={h * 0.5} stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" strokeDasharray="3,3" />

        {values.map((v, i) => {

          const x = i * (w / values.length)

          const barH = (v / 100) * h

          const color = v > 80 ? '#22c55e' : v > 50 ? '#eab308' : '#ef4444'

          return (

            <rect key={i} x={x + gap / 2} y={h - barH} width={barW} height={barH} rx="1"

              fill={color} opacity={hoverIdx === i ? 0.9 : 0.5}

              style={{ transition: 'opacity 0.15s' }} />

          )

        })}

      </svg>

      {hoverIdx !== null && dateRange && dateRange[hoverIdx] && (

        <div style={{ fontSize: 10, color: T.textTertiary, textAlign: 'center', marginTop: 2 }}>{dateRange[hoverIdx]}</div>

      )}

    </div>

  )

      }
