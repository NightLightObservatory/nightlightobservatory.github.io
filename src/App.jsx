import { useState, useEffect, useRef, useCallback } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

const BASEMAP = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'
const TILE_URL = 'https://api.lights.nltglobal.com/tiles'

export default function App() {
  const mapContainer = useRef(null)
  const mapRef = useRef(null)
  const [countries, setCountries] = useState([])
  const [dateRange, setDateRange] = useState([])
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedCountry, setSelectedCountry] = useState(null)
  const [analytics, setAnalytics] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showTour, setShowTour] = useState(true)
  const [yearIndex, setYearIndex] = useState(0)
  const [playing, setPlaying] = useState(false)

  // Load static data
  useEffect(() => {
    fetch('/data/admin0.json').then(r => r.json()).then(d => setCountries(d.data))
    fetch('/data/date-range.json').then(r => r.json()).then(d => {
      setDateRange(d)
      setSelectedDate(d[d.length - 1])
    })
  }, [])

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || showTour) return
    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: BASEMAP,
      center: [110, 5],
      zoom: 4,
      attributionControl: true
    })
    map.addControl(new maplibregl.NavigationControl(), 'top-right')
    mapRef.current = map

    map.on('load', () => {
      updateTileLayer(map, selectedDate)
    })

    return () => map.remove()
  }, [showTour])

  // Update tiles when date changes
  useEffect(() => {
    if (mapRef.current && mapRef.current.isStyleLoaded() && selectedDate) {
      updateTileLayer(mapRef.current, selectedDate)
    }
  }, [selectedDate])

  function updateTileLayer(map, date) {
    const sourceId = 'ntl-tiles'
    if (map.getSource(sourceId)) {
      map.removeLayer('ntl-layer')
      map.removeSource(sourceId)
    }
    map.addSource(sourceId, {
      type: 'raster',
      tiles: [TILE_URL + '/' + date + '/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: 'NTL Data © NLT'
    })
    map.addLayer({
      id: 'ntl-layer',
      type: 'raster',
      source: sourceId,
      paint: { 'raster-opacity': 0.85 }
    }, 'waterway')
  }

  // Fly to country
  const flyToCountry = useCallback((country) => {
    setSelectedCountry(country)
    if (mapRef.current && country.bbox) {
      const bbox = JSON.parse(country.bbox)
      mapRef.current.fitBounds([[bbox[0], bbox[1]], [bbox[2], bbox[3]]], { padding: 40 })
    }
    // Load analytics
    fetch('/data/analytics/' + country.gid + '.json')
      .then(r => r.ok ? r.json() : null)
      .then(d => setAnalytics(d))
      .catch(() => setAnalytics(null))
  }, [])

  // Timeline playback
  useEffect(() => {
    if (!playing || dateRange.length === 0) return
    const interval = setInterval(() => {
      setYearIndex(prev => {
        const next = prev + 1
        if (next >= dateRange.length) { setPlaying(false); return 0 }
        setSelectedDate(dateRange[next])
        return next
      })
    }, 400)
    return () => clearInterval(interval)
  }, [playing, dateRange])

  // Get unique years
  const years = [...new Set(dateRange.map(d => d.split('-')[0]))]
  const currentYear = selectedDate ? selectedDate.split('-')[0] : ''
  const monthsInYear = dateRange.filter(d => d.startsWith(currentYear))

  // Filter countries
  const filtered = countries.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Tour screen
  if (showTour) {
    return (
      <div style={styles.tourOverlay}>
        <h2 style={styles.tourTitle}>Welcome to the Big Data</h2>
        <h3 style={styles.tourSubtitle}>Nighttime Lights Socioeconomic Observatory</h3>
        <p style={styles.tourText}>in less than 1 minute, let us give you an in-depth view into the observatory.</p>
        <button style={styles.tourButton} onClick={() => setShowTour(false)}>Take a tour</button>
        <p style={styles.tourSkip}>Not new here? <a href="#" onClick={e => { e.preventDefault(); setShowTour(false) }} style={styles.tourLink}>Skip the tour</a></p>
      </div>
    )
  }

  return (
    <div style={styles.app}>
      {/* Header */}
      <div style={styles.header}>
        <span style={styles.logo}>🏔</span>
        <h1 style={styles.headerTitle}>Big Data Nighttime Lights Socioeconomic Observatory</h1>
        <div style={styles.headerRight}>
          <span style={styles.badge}>NTL</span>
        </div>
      </div>

      {/* Sidebar */}
      <div style={styles.sidebar}>
        <input
          type="text"
          placeholder="Search"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={styles.searchInput}
        />
        <div style={styles.countryList}>
          {filtered.map(country => (
            <div
              key={country.gid}
              style={{
                ...styles.countryItem,
                ...(selectedCountry?.gid === country.gid ? styles.countryItemActive : {})
              }}
              onClick={() => flyToCountry(country)}
            >
              <span>{country.name}</span>
              <span style={styles.chartIcon}>📈</span>
            </div>
          ))}
        </div>
      </div>

      {/* Map */}
      <div ref={mapContainer} style={styles.map} />

      {/* Analytics Panel */}
      {analytics && selectedCountry && (
        <div style={styles.chartPanel}>
          <h3 style={styles.chartTitle}>{selectedCountry.name} - NTL Time Series</h3>
          <div style={styles.chartContainer}>
            <MiniChart data={analytics.data?.ar || []} />
          </div>
          <button style={styles.closeBtn} onClick={() => setAnalytics(null)}>✕</button>
        </div>
      )}

      {/* Timeline */}
      <div style={styles.timeline}>
        <button style={styles.playBtn} onClick={() => setPlaying(!playing)}>
          {playing ? '⏸' : '▶'}
        </button>
        <select
          value={currentYear}
          onChange={e => {
            const y = e.target.value
            const first = dateRange.find(d => d.startsWith(y))
            if (first) {
              setSelectedDate(first)
              setYearIndex(dateRange.indexOf(first))
            }
          }}
          style={styles.yearSelect}
        >
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <div style={styles.monthBar}>
          {monthsInYear.map(d => (
            <button
              key={d}
              style={{
                ...styles.monthBtn,
                ...(d === selectedDate ? styles.monthBtnActive : {})
              }}
              onClick={() => {
                setSelectedDate(d)
                setYearIndex(dateRange.indexOf(d))
              }}
            >
              {d}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// Mini SVG Chart component
function MiniChart({ data }) {
  if (!data || data.length === 0) return <p style={{ color: '#999' }}>No data</p>
  const values = data.map(d => parseFloat(d.value)).filter(v => !isNaN(v))
  const max = Math.max(...values)
  const min = Math.min(...values)
  const range = max - min || 1
  const w = 500
  const h = 120
  const points = values.map((v, i) =>
    ((i / (values.length - 1)) * w).toFixed(1) + ',' + (h - ((v - min) / range) * h).toFixed(1)
  ).join(' ')

  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: 120 }}>
      <polyline fill="none" stroke="#ef4444" strokeWidth="2" points={points} />
    </svg>
  )
}

const styles = {
  app: { position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', fontFamily: 'system-ui, sans-serif', background: '#0a0a0a', color: '#e0e0e0' },
  header: { display: 'flex', alignItems: 'center', padding: '8px 16px', background: '#111', borderBottom: '1px solid #222', zIndex: 10 },
  logo: { fontSize: 24, marginRight: 10 },
  headerTitle: { fontSize: 14, fontWeight: 500, flex: 1, color: '#ccc' },
  headerRight: { display: 'flex', gap: 8 },
  badge: { background: '#ef4444', color: '#fff', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700 },
  sidebar: { position: 'absolute', top: 48, left: 0, width: 220, bottom: 50, background: 'rgba(0,0,0,0.85)', zIndex: 5, overflowY: 'auto', padding: '8px' },
  searchInput: { width: '100%', padding: '6px 10px', background: '#1a1a1a', border: '1px solid #333', borderRadius: 4, color: '#fff', fontSize: 13, boxSizing: 'border-box', marginBottom: 8 },
  countryList: { display: 'flex', flexDirection: 'column', gap: 2 },
  countryItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 8px', cursor: 'pointer', borderRadius: 4, fontSize: 13, transition: 'background 0.15s' },
  countryItemActive: { background: '#1e3a5f' },
  chartIcon: { fontSize: 14, opacity: 0.5 },
  map: { flex: 1, position: 'relative' },
  chartPanel: { position: 'absolute', top: 60, right: 16, width: 360, background: 'rgba(10,22,40,0.95)', borderRadius: 8, padding: 16, zIndex: 10, boxShadow: '0 4px 20px rgba(0,0,0,0.5)' },
  chartTitle: { fontSize: 14, marginBottom: 8, color: '#fff' },
  chartContainer: { width: '100%' },
  closeBtn: { position: 'absolute', top: 8, right: 8, background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: 16 },
  timeline: { display: 'flex', alignItems: 'center', padding: '6px 16px', background: '#111', borderTop: '1px solid #222', gap: 8, overflowX: 'auto', zIndex: 10 },
  playBtn: { background: 'none', border: '1px solid #ef4444', color: '#ef4444', borderRadius: 4, padding: '4px 10px', cursor: 'pointer', fontSize: 14 },
  yearSelect: { background: '#1a1a1a', color: '#ef4444', border: '1px solid #ef4444', borderRadius: 4, padding: '4px 8px', fontSize: 12 },
  monthBar: { display: 'flex', gap: 4, overflowX: 'auto' },
  monthBtn: { background: '#1a1a1a', color: '#ef4444', border: '1px solid #333', borderRadius: 4, padding: '4px 8px', fontSize: 11, cursor: 'pointer', whiteSpace: 'nowrap' },
  monthBtnActive: { background: '#ef4444', color: '#fff' },
  tourOverlay: { position: 'fixed', inset: 0, background: '#000', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, sans-serif', color: '#e0e0e0' },
  tourTitle: { fontSize: 20, fontWeight: 300, color: '#cda' },
  tourSubtitle: { fontSize: 18, fontWeight: 300, color: '#cda', marginTop: 4 },
  tourText: { fontSize: 16, color: '#999', marginTop: 16 },
  tourButton: { marginTop: 40, padding: '16px 60px', fontSize: 18, background: '#fff', color: '#000', border: 'none', borderRadius: 8, cursor: 'pointer' },
  tourSkip: { marginTop: 16, fontSize: 14, color: '#666' },
  tourLink: { color: '#aaa', textDecoration: 'underline' }
      }
