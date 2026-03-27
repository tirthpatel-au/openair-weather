import { geoGraticule10, geoOrthographic, geoPath } from 'd3-geo'
import { Sparkles } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { MouseEvent } from 'react'
import type { FeatureCollection, Geometry } from 'geojson'
import { feature, mesh } from 'topojson-client'
import countriesAtlas from 'world-atlas/countries-110m.json'
import { majorCities } from '../data/majorCities'

type ActiveLocation = {
  label: string
  shortName: string
  lat: number
  lon: number
}

type GlobeExplorerProps = {
  activeLocation?: ActiveLocation
  disabled: boolean
  onSelect: (lat: number, lon: number) => void
}

type DragState = {
  x: number
  y: number
  rotation: [number, number, number]
}

const width = 560
const height = 560
const sphereRadius = 252

const atlas = countriesAtlas as {
  objects: {
    countries: object
  }
}

const countryFeatures = (
  feature(atlas as never, atlas.objects.countries as never) as unknown as FeatureCollection<Geometry>
).features
const countryMesh = mesh(atlas as never, atlas.objects.countries as never, (a, b) => a !== b)
const graticule = geoGraticule10()

const clampLatitude = (value: number) => Math.max(-85, Math.min(85, value))

const formatCoordinates = (lat: number, lon: number) =>
  `${Math.abs(lat).toFixed(2)}°${lat >= 0 ? 'N' : 'S'}, ${Math.abs(lon).toFixed(2)}°${lon >= 0 ? 'E' : 'W'}`

export const GlobeExplorer = ({ activeLocation, disabled, onSelect }: GlobeExplorerProps) => {
  const [rotation, setRotation] = useState<[number, number, number]>([-20, -18, 0])
  const [dragState, setDragState] = useState<DragState | null>(null)
  const [hoveredCity, setHoveredCity] = useState<string | null>(null)

  const projection = useMemo(
    () =>
      geoOrthographic()
        .translate([width / 2, height / 2])
        .scale(sphereRadius)
        .rotate(rotation)
        .clipAngle(90)
        .precision(0.1),
    [rotation],
  )

  const path = geoPath(projection)

  const cityPoints = useMemo(
    () =>
      majorCities
        .map((city) => ({
          ...city,
          point: projection([city.lon, city.lat]),
        }))
        .filter((city) => city.point),
    [projection],
  )

  const activePoint = activeLocation ? projection([activeLocation.lon, activeLocation.lat]) : null

  const handleMouseDown = (event: MouseEvent<SVGSVGElement>) => {
    if (disabled) {
      return
    }

    setDragState({
      x: event.clientX,
      y: event.clientY,
      rotation,
    })
  }

  const handleMouseMove = (event: MouseEvent<SVGSVGElement>) => {
    if (!dragState || disabled) {
      return
    }

    const dx = event.clientX - dragState.x
    const dy = event.clientY - dragState.y

    setRotation([
      dragState.rotation[0] + dx * 0.35,
      clampLatitude(dragState.rotation[1] - dy * 0.35),
      0,
    ])
  }

  const handleMouseUp = () => {
    setDragState(null)
  }

  const handleSelectPoint = (event: MouseEvent<SVGSVGElement>) => {
    if (disabled || dragState) {
      return
    }

    const rect = event.currentTarget.getBoundingClientRect()
    const x = ((event.clientX - rect.left) / rect.width) * width
    const y = ((event.clientY - rect.top) / rect.height) * height
    const invert = projection.invert
    if (!invert) {
      return
    }

    const coords = invert([x, y])

    if (!coords) {
      return
    }

    onSelect(coords[1], coords[0])
  }

  return (
    <div className="rounded-[2rem] border border-[var(--line)] bg-[var(--panel)] p-6 shadow-[var(--panel-shadow)] sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[var(--text-soft)]">
            Earth explorer
          </p>
          <h3 className="mt-3 font-display text-3xl tracking-[-0.05em]">Rotate the world</h3>
        </div>
        <div className="rounded-full border border-[var(--line)] bg-[var(--surface)] px-4 py-2 text-sm text-[var(--text-soft)]">
          Drag to rotate, click to load weather
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-center">
        <div className="mx-auto w-full max-w-[31rem]">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="h-auto w-full cursor-grab drop-shadow-[0_30px_60px_rgba(17,151,190,0.18)] active:cursor-grabbing"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onClick={handleSelectPoint}
          >
            <defs>
              <radialGradient id="explorer-glow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="rgba(90,198,232,0.28)" />
                <stop offset="100%" stopColor="rgba(90,198,232,0)" />
              </radialGradient>
              <radialGradient id="explorer-sphere" cx="38%" cy="28%" r="72%">
                <stop offset="0%" stopColor="rgba(242,251,255,0.98)" />
                <stop offset="45%" stopColor="rgba(124,216,242,0.96)" />
                <stop offset="100%" stopColor="rgba(6,63,94,0.98)" />
              </radialGradient>
            </defs>

            <circle cx={width / 2} cy={height / 2} r={sphereRadius + 26} fill="url(#explorer-glow)" />
            <path d={path({ type: 'Sphere' }) ?? undefined} fill="url(#explorer-sphere)" />
            <path d={path(graticule) ?? undefined} fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="1.1" />

            {countryFeatures.map((country: FeatureCollection<Geometry>['features'][number], index: number) => (
              <path
                key={index}
                d={path(country) ?? undefined}
                fill="rgba(226,248,255,0.86)"
                stroke="rgba(255,255,255,0.18)"
                strokeWidth="0.35"
              />
            ))}

            <path d={path(countryMesh) ?? undefined} fill="none" stroke="rgba(8,48,70,0.22)" strokeWidth="0.45" />
            <path d={path({ type: 'Sphere' }) ?? undefined} fill="none" stroke="rgba(255,255,255,0.62)" strokeWidth="5" />

            {cityPoints.map((city) =>
              city.point ? (
                <g
                  key={`${city.name}-${city.country}`}
                  transform={`translate(${city.point[0]}, ${city.point[1]})`}
                  onMouseEnter={() => setHoveredCity(`${city.name}, ${city.country}`)}
                  onMouseLeave={() => setHoveredCity(null)}
                >
                  <circle r="2.4" fill="rgba(8,48,70,0.78)" stroke="white" strokeWidth="0.9" />
                </g>
              ) : null,
            )}

            {activePoint ? (
              <g transform={`translate(${activePoint[0]}, ${activePoint[1]})`}>
                <circle r="10" fill="rgba(255,255,255,0.16)" />
                <circle r="5.5" fill="white" />
                <circle r="3" fill="var(--accent)" />
              </g>
            ) : null}
          </svg>
        </div>

        <div className="space-y-4">
          <div className="rounded-[1.5rem] border border-[var(--line)] bg-[var(--surface)] p-4">
            <p className="text-sm font-semibold uppercase tracking-[0.26em] text-[var(--text-soft)]">
              Selected point
            </p>
            <p className="mt-3 font-display text-2xl tracking-[-0.04em]">
              {activeLocation?.shortName ?? 'Pick a place'}
            </p>
            <p className="mt-2 text-sm leading-7 text-[var(--text-soft)]">
              {activeLocation
                ? formatCoordinates(activeLocation.lat, activeLocation.lon)
                : 'Rotate the globe and click any visible area to fetch weather for that point.'}
            </p>
          </div>
          <div className="rounded-[1.5rem] border border-[var(--line)] bg-[var(--surface)] p-4">
            <div className="flex items-center gap-2 text-[var(--accent)]">
              <Sparkles size={18} />
              <span className="text-sm font-semibold">World map layer</span>
            </div>
            <p className="mt-3 text-sm leading-7 text-[var(--text-soft)]">
              Country outlines are rendered on a live orthographic globe, with major city markers to
              help orient you as you rotate.
            </p>
          </div>
          <div className="rounded-[1.5rem] border border-[var(--line)] bg-[var(--surface)] p-4 text-sm text-[var(--text-soft)]">
            {hoveredCity ?? 'Hover city markers to preview place names while you explore.'}
          </div>
        </div>
      </div>
    </div>
  )
}
