import { useState, useEffect, useRef, useCallback } from 'react'



import maplibregl from 'maplibre-gl'



import 'maplibre-gl/dist/maplibre-gl.css'







const BASEMAP = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'



const TILE_URL = 'https://api.lights.nltglobal.com/tiles'







/* ─── Color Tokens (nltgis.ai design system) ─── */



const T = {



  bg: '#0a1628',



  bgCard: 'rgba(22,29,47,0.92)',



  bgSidebar: 'rgba(10,22,40,0.95)',



  bgHeader: 'rgba(10,22,40,0.98)',



  bgInput: 'rgba(30,41,59,0.6)',



  border: '#1e293b',



  borderLight: 'rgba(255,255,255,0.08)',



  text: '#ffffff',



  textSecondary: 'rgba(255,255,255,0.6)',



  textTertiary: 'rgba(255,255,255,0.35)',



  accent: '#6366f1',



  accentHover: '#818cf8',



  red: '#ef4444',



  green: '#22c55e',



  amber: '#eab308',



  font: "'DM Sans', system-ui, -apple-system, sans-serif",



  radius: '8px',



  radiusSm: '6px',



  shadow: '0 10px 30px rgba(0,0,0,0.3)',



  glass: 'blur(12px)',



}







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



  const [drillLevel, setDrillLevel] = useState('country') // 'country' | 'admin1'



  const [mapReady, setMapReady] = useState(false)







  // Load static data



  useEffect(() => {



    fetch('/data/admin0.json').then(r => r.json()).then(d => setCountries(d.data || []))



    fetch('/data/date-range.json').then(r => r.json()).then(d => {



      setDateRange(d)



      if (d.length) { setSelectedDate(d[d.length - 1]); setYearIndex(d.length - 1) }



    })



  }, [])







  // Initialize map



  useEffect(() => {



    if (!mapContainer.current || showTour) return



    const map = new maplibregl.Map({



      container: mapContainer.current,



      style: BASEMAP,



      center: [115, 2],



      zoom: 3.5,



      attributionControl: false,



      maxZoom: 14,



      minZoom: 2,



    })



    map.addControl(new maplibregl.NavigationControl({ showCompass: true }), 'top-right')



    map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right')



    mapRef.current = map



    map.on('load', () => {



      setMapReady(true)



      if (selectedDate) updateTileLayer(map, selectedDate)



    })



    return () => { map.remove(); setMapReady(false) }



  }, [showTour])







  // Update tiles when date changes



  useEffect(() => {



    if (mapRef.current && mapReady && selectedDate) {



      updateTileLayer(mapRef.current, selectedDate)



    }



  }, [selectedDate, mapReady])







  // Update tile opacity



  useEffect(() => {



    if (mapRef.current && mapReady && mapRef.current.getLayer('ntl-layer')) {



      mapRef.current.setPaintProperty('ntl-layer', 'raster-opacity', tileOpacity)



    }



  }, [tileOpacity, mapReady])







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



      attribution: 'NTL Data &copy; NLT'



    })



    map.addLayer({



      id: 'ntl-layer',



      type: 'raster',



      source: sourceId,



      paint: { 'raster-opacity': tileOpacity }



    })



  }







  // Fly to country



  const flyToCountry = useCallback((country) => {



    setSelectedCountry(country)



    setSelectedAdmin1(null)



    setDrillLevel('country')



    setShowChart(false)



    setAdmin1Regions([])



    if (mapRef.current && country.bbox) {



      const bbox = JSON.parse(country.bbox)



      mapRef.current.fitBounds([[bbox[0], bbox[1]], [bbox[2], bbox[3]]], { padding: 60, duration: 1500 })



    }



    // Load admin1 regions



    fetch('/data/admin1/' + country.gid + '.json')



      .then(r => r.ok ? r.json() : null)



      .then(d => { if (d && d.data) setAdmin1Regions(d.data) })



      .catch(() => setAdmin1Regions([]))



    // Load analytics



    fetch('/data/analytics/' + country.gid + '.json')



      .then(r => r.ok ? r.json() : null)



      .then(d => { setAnalytics(d); setShowChart(true) })



      .catch(() => setAnalytics(null))



  }, [])







  // Fly to admin1



  const flyToAdmin1 = useCallback((region) => {



    setSelectedAdmin1(region)



    setDrillLevel('admin1')



    if (mapRef.current && region.bbox) {



      const bbox = JSON.parse(region.bbox)



      mapRef.current.fitBounds([[bbox[0], bbox[1]], [bbox[2], bbox[3]]], { padding: 60, duration: 1200 })



    }



  }, [])







  // Back to country level



  const backToCountries = useCallback(() => {



    setSelectedCountry(null)



    setSelectedAdmin1(null)



    setDrillLevel('country')



    setAdmin1Regions([])



    setAnalytics(null)



    setShowChart(false)



    if (mapRef.current) {



      mapRef.current.flyTo({ center: [115, 2], zoom: 3.5, duration: 1200 })



    }



  }, [])







  // Back to country from admin1



  const backToCountry = useCallback(() => {



    setSelectedAdmin1(null)



    setDrillLevel('country')



    if (selectedCountry) flyToCountry(selectedCountry)



  }, [selectedCountry, flyToCountry])







  // Timeline playback



  useEffect(() => {



    if (!playing || dateRange.length === 0) return



    const interval = setInterval(() => {



      setYearIndex(prev => {



        const next = prev + 1



        if (next >= dateRange.length) { setPlaying(false); return prev }



        setSelectedDate(dateRange[next])



        return next



      })



    }, 350)



    return () => clearInterval(interval)



  }, [playing, dateRange])







  const years = [...new Set(dateRange.map(d => d.split('-')[0]))]



  const currentYear = selectedDate ? selectedDate.split('-')[0] : ''



  const monthsInYear = dateRange.filter(d => d.startsWith(currentYear))



  const filtered = countries.filter(c =>



    c.name.toLowerCase().includes(searchQuery.toLowerCase())



  )







  // Tour Screen



  if (showTour) {



    return (



      <div style={{



        position: 'fixed', inset: 0, background: `linear-gradient(135deg, ${T.bg} 0%, #0f172a 50%, #020617 100%)`,



        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',



        fontFamily: T.font, color: T.text, overflow: 'hidden'



      }}>



        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 30% 50%, rgba(99,102,241,0.08) 0%, transparent 60%), radial-gradient(ellipse at 70% 20%, rgba(239,68,68,0.05) 0%, transparent 50%)' }} />



        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: 560, padding: '0 24px' }}>



          <div style={{ width: 64, height: 64, margin: '0 auto 32px', background: `linear-gradient(135deg, ${T.accent}, ${T.red})`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, boxShadow: '0 0 40px rgba(99,102,241,0.3)' }}>



            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/><circle cx="12" cy="12" r="3"/></svg>



          </div>



          <p style={{ fontSize: 14, letterSpacing: '3px', textTransform: 'uppercase', color: T.accent, marginBottom: 12, fontWeight: 500 }}>NLT Observatory</p>



          <h1 style={{ fontSize: 36, fontWeight: 700, lineHeight: 1.2, margin: '0 0 8px', background: 'linear-gradient(90deg, #fff 30%, rgba(255,255,255,0.6))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Big Data Nighttime Lights</h1>



          <h2 style={{ fontSize: 20, fontWeight: 400, color: T.textSecondary, margin: '0 0 32px' }}>Socioeconomic Observatory</h2>



          <p style={{ fontSize: 15, color: T.textTertiary, lineHeight: 1.6, marginBottom: 40 }}>Explore satellite-derived nighttime light data across 9 countries in the East Asia and Pacific region. Analyze economic activity trends from 2012 to 2020.</p>



          <button onClick={() => setShowTour(false)} style={{



            padding: '14px 48px', fontSize: 15, fontWeight: 600, background: T.accent, color: '#fff',



            border: 'none', borderRadius: T.radius, cursor: 'pointer', letterSpacing: '0.5px',



            boxShadow: '0 4px 20px rgba(99,102,241,0.4)', transition: 'all 0.2s ease'



          }} onMouseEnter={e => { e.target.style.background = T.accentHover; e.target.style.transform = 'translateY(-1px)' }}



             onMouseLeave={e => { e.target.style.background = T.accent; e.target.style.transform = 'translateY(0)' }}>



            Explore the Observatory



          </button>



          <p style={{ marginTop: 20, fontSize: 13, color: T.textTertiary }}>



            Powered by{' '}



            <a href="https://nltgis.ai" target="_blank" rel="noopener" style={{ color: T.accent, textDecoration: 'none' }}>nltGIS.ai</a>



            {' '}&bull;{' '}



            <a href="https://github.com/NightLightObservatory" target="_blank" rel="noopener" style={{ color: T.textTertiary, textDecoration: 'none' }}>GitHub</a>



          </p>



        </div>



      </div>



    )



  }







  return (



    <div style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', fontFamily: T.font, background: T.bg, color: T.text }}>



      {/* ─── Header ─── */}



      <header style={{



        display: 'flex', alignItems: 'center', padding: '0 16px', height: 48,



        background: T.bgHeader, borderBottom: `1px solid ${T.border}`, zIndex: 20,



        backdropFilter: T.glass



      }}>



        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>



          <div style={{ width: 28, height: 28, background: `linear-gradient(135deg, ${T.accent}, ${T.red})`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>



            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4"/></svg>



          </div>



          <span style={{ fontSize: 14, fontWeight: 600, color: T.text, letterSpacing: '0.3px' }}>NLT Observatory</span>



          <span style={{ fontSize: 11, color: T.textTertiary, marginLeft: 4 }}>East Asia &amp; Pacific</span>



        </div>



        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>



          <span style={{ fontSize: 12, color: T.textSecondary }}>{selectedDate || ''}</span>



          <span style={{ background: T.red, color: '#fff', padding: '2px 8px', borderRadius: '4px', fontSize: 10, fontWeight: 700, letterSpacing: '0.5px' }}>NTL</span>



        </div>



      </header>







      <div style={{ flex: 1, display: 'flex', position: 'relative', overflow: 'hidden' }}>



        {/* ─── Sidebar ─── */}



        <aside style={{



          width: 260, background: T.bgSidebar, borderRight: `1px solid ${T.border}`,



          display: 'flex', flexDirection: 'column', zIndex: 10, backdropFilter: T.glass



        }}>



          {/* Breadcrumb */}



          <div style={{ padding: '10px 14px', borderBottom: `1px solid ${T.border}`, fontSize: 12 }}>



            <span onClick={backToCountries} style={{ color: drillLevel !== 'country' || selectedCountry ? T.accent : T.textSecondary, cursor: 'pointer' }}>Countries</span>



            {selectedCountry && (



              <><span style={{ color: T.textTertiary, margin: '0 6px' }}>/</span>



              <span onClick={backToCountry} style={{ color: selectedAdmin1 ? T.accent : T.text, cursor: selectedAdmin1 ? 'pointer' : 'default' }}>{selectedCountry.name}</span></>



            )}



            {selectedAdmin1 && (



              <><span style={{ color: T.textTertiary, margin: '0 6px' }}>/</span>



              <span style={{ color: T.text }}>{selectedAdmin1.name}</span></>



            )}



          </div>







          {/* Search */}



          <div style={{ padding: '10px 14px' }}>



            <input type="text" placeholder="Search regions..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}



              style={{



                width: '100%', padding: '8px 12px', background: T.bgInput, border: `1px solid ${T.border}`,



                borderRadius: T.radiusSm, color: T.text, fontSize: 13, outline: 'none', boxSizing: 'border-box',



                transition: 'border-color 0.2s', fontFamily: T.font



              }}



              onFocus={e => e.target.style.borderColor = T.accent}



              onBlur={e => e.target.style.borderColor = T.border}



            />



          </div>







          {/* Region List */}



          <div style={{ flex: 1, overflowY: 'auto', padding: '0 8px 8px' }}>



            {drillLevel === 'country' && !selectedCountry && filtered.map(country => (



              <div key={country.gid} onClick={() => flyToCountry(country)}



                style={{



                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',



                  padding: '8px 10px', borderRadius: T.radiusSm, cursor: 'pointer', fontSize: 13,



                  color: T.text, transition: 'background 0.15s',



                  background: 'transparent'



                }}



                onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,0.1)'}



                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}



              >



                <span>{country.name}</span>



                <span style={{ fontSize: 11, color: T.textTertiary }}>{parseFloat(country.area).toLocaleString()} km²</span>



              </div>



            ))}







            {selectedCountry && drillLevel === 'country' && admin1Regions



              .filter(r => r.name.toLowerCase().includes(searchQuery.toLowerCase()))



              .map(region => (



              <div key={region.gid} onClick={() => flyToAdmin1(region)}



                style={{



                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',



                  padding: '8px 10px', borderRadius: T.radiusSm, cursor: 'pointer', fontSize: 13,



                  color: T.text, transition: 'background 0.15s', background: 'transparent'



                }}



                onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,0.1)'}



                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}



              >



                <span>{region.name}</span>



                {region.area && <span style={{ fontSize: 11, color: T.textTertiary }}>{parseFloat(region.area).toLocaleString()} km²</span>}



              </div>



            ))}



          </div>







          {/* Sidebar Footer */}



          <div style={{ padding: '10px 14px', borderTop: `1px solid ${T.border}`, fontSize: 11, color: T.textTertiary }}>



            {countries.length} countries &bull; {dateRange.length} months



          </div>



        </aside>







        {/* ─── Map ─── */}



        <div ref={mapContainer} style={{ flex: 1, position: 'relative' }} />







        {/* ─── NTL Opacity Control ─── */}



        <div style={{



          position: 'absolute', top: 56, right: 52, zIndex: 5,



          background: T.bgCard, backdropFilter: T.glass, borderRadius: T.radius,



          padding: '8px 12px', border: `1px solid ${T.border}`, minWidth: 140



        }}>



          <div style={{ fontSize: 10, color: T.textTertiary, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>NTL Opacity</div>



          <input type="range" min="0" max="1" step="0.05" value={tileOpacity}



            onChange={e => setTileOpacity(parseFloat(e.target.value))}



            style={{ width: '100%', accentColor: T.accent }}



          />



          <div style={{ fontSize: 11, color: T.textSecondary, textAlign: 'right' }}>{Math.round(tileOpacity * 100)}%</div>



        </div>







        {/* ─── Analytics Chart Panel ─── */}



        {showChart && analytics && selectedCountry && (



          <div style={{



            position: 'absolute', bottom: 60, right: 16, width: 380,



            background: T.bgCard, backdropFilter: T.glass, borderRadius: '10px',



            border: `1px solid ${T.border}`, boxShadow: T.shadow, zIndex: 15,



            animation: 'slideUp 0.3s ease'



          }}>



            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: `1px solid ${T.border}` }}>



              <div>



                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>{selectedCountry.name}</h3>



                <p style={{ margin: '2px 0 0', fontSize: 11, color: T.textTertiary }}>NTL Radiance Time Series (2012–2020)</p>



              </div>



              <button onClick={() => setShowChart(false)} style={{



                background: 'transparent', border: 'none', color: T.textTertiary,



                cursor: 'pointer', fontSize: 16, padding: '2px 6px', borderRadius: '4px'



              }} onMouseEnter={e => e.target.style.color = T.text}



                 onMouseLeave={e => e.target.style.color = T.textTertiary}>✕</button>



            </div>



            <div style={{ padding: '12px 16px' }}>



              <MiniChart data={analytics.data?.ar || []} />



              <CloudFreeChart data={analytics.data?.cf || []} />



            </div>



          </div>



        )}



      </div>







      {/* ─── Timeline Bar ─── */}



      <div style={{



        display: 'flex', alignItems: 'center', padding: '6px 16px', height: 44,



        background: T.bgHeader, borderTop: `1px solid ${T.border}`, gap: 10, zIndex: 20



      }}>



        <button onClick={() => setPlaying(!playing)} style={{



          background: 'transparent', border: `1px solid ${T.accent}`, color: T.accent,



          borderRadius: T.radiusSm, padding: '4px 12px', cursor: 'pointer', fontSize: 13,



          fontFamily: T.font, fontWeight: 500, transition: 'all 0.15s',



          display: 'flex', alignItems: 'center', gap: 4



        }} onMouseEnter={e => { e.target.style.background = T.accent; e.target.style.color = '#fff' }}



           onMouseLeave={e => { e.target.style.background = 'transparent'; e.target.style.color = T.accent }}>



          {playing ? '⏸' : '▶'} {playing ? 'Pause' : 'Play'}



        </button>







        <select value={currentYear} onChange={e => {



          const y = e.target.value



          const first = dateRange.find(d => d.startsWith(y))



          if (first) { setSelectedDate(first); setYearIndex(dateRange.indexOf(first)) }



        }} style={{



          background: T.bgInput, color: T.text, border: `1px solid ${T.border}`,



          borderRadius: T.radiusSm, padding: '4px 8px', fontSize: 12, fontFamily: T.font, outline: 'none'



        }}>



          {years.map(y => <option key={y} value={y}>{y}</option>)}



        </select>







        <div style={{ flex: 1, display: 'flex', gap: 3, overflowX: 'auto', padding: '2px 0' }}>



          {monthsInYear.map(d => {



            const month = d.split('-')[1]



            const isActive = d === selectedDate



            return (



              <button key={d} onClick={() => { setSelectedDate(d); setYearIndex(dateRange.indexOf(d)) }}



                style={{



                  background: isActive ? T.accent : 'transparent',



                  color: isActive ? '#fff' : T.textSecondary,



                  border: `1px solid ${isActive ? T.accent : T.border}`,



                  borderRadius: T.radiusSm, padding: '3px 8px', fontSize: 11,



                  cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: T.font,



                  transition: 'all 0.15s', fontWeight: isActive ? 600 : 400



                }}>



                {month}



              </button>



            )



          })}



        </div>







        <div style={{ fontSize: 11, color: T.textTertiary, whiteSpace: 'nowrap' }}>



          {yearIndex + 1} / {dateRange.length}



        </div>



      </div>



    </div>



  )



}







/* ─── Mini Chart: NTL Radiance ─── */



function MiniChart({ data }) {



  if (!data || data.length === 0) return <p style={{ color: '#666', fontSize: 12 }}>No radiance data</p>



  const values = data.map(d => parseFloat(d.value)).filter(v => !isNaN(v))



  if (values.length === 0) return null



  const max = Math.max(...values)



  const min = Math.min(...values)



  const range = max - min || 1



  const w = 340, h = 80



  const points = values.map((v, i) =>



    ((i / (values.length - 1)) * w).toFixed(1) + ',' + (h - 4 - ((v - min) / range) * (h - 8)).toFixed(1)



  ).join(' ')



  const areaPoints = points + ` ${w},${h} 0,${h}`







  return (



    <div style={{ marginBottom: 12 }}>



      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>



        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Radiance (nW/cm²/sr)</span>



        <span style={{ fontSize: 11, color: '#6366f1' }}>{values[values.length - 1]?.toLocaleString()}</span>



      </div>



      <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: h, display: 'block' }}>



        <defs>



          <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">



            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3" />



            <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />



          </linearGradient>



        </defs>



        <polygon fill="url(#grad)" points={areaPoints} />



        <polyline fill="none" stroke="#6366f1" strokeWidth="1.5" points={points} />



      </svg>



    </div>



  )



}







/* ─── Mini Chart: Cloud-Free % ─── */



function CloudFreeChart({ data }) {



  if (!data || data.length === 0) return null



  const values = data.map(d => parseFloat(d.value)).filter(v => !isNaN(v))



  if (values.length === 0) return null



  const w = 340, h = 40



  const barW = w / values.length







  return (



    <div>



      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>



        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Cloud-Free Coverage</span>



        <span style={{ fontSize: 11, color: '#22c55e' }}>{values[values.length - 1]?.toFixed(1)}%</span>



      </div>



      <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: h, display: 'block' }}>



        {values.map((v, i) => (



          <rect key={i} x={i * barW} y={h - (v / 100) * h} width={Math.max(barW - 0.5, 0.5)} height={(v / 100) * h}



            fill={v > 80 ? '#22c55e' : v > 50 ? '#eab308' : '#ef4444'} opacity="0.6" />



        ))}



      </svg>



    </div>



  )



}



